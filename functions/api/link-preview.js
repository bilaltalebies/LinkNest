export async function onRequestGet(context) {
  const requestUrl = new URL(context.request.url);
  const targetParam = requestUrl.searchParams.get("url");

  if (!targetParam) {
    return jsonResponse({ error: "missing_url" }, 400);
  }

  let target;
  try {
    target = new URL(targetParam);
  } catch (e) {
    return jsonResponse({ error: "invalid_url" }, 400);
  }

  if (!isAllowedUrl(target)) {
    return jsonResponse({ error: "unsafe_url" }, 400);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const result = await fetchWithRedirects(target.href, controller.signal);
    const meta = parseMetadata(result.html);
    return jsonResponse({
      title: meta.title || null,
      description: meta.description || null
    }, 200);
  } catch (e) {
    const code = errorCode(e && e.message);
    const status = code === "timeout" ? 504 : (code === "too_large" ? 413 : (code === "not_html" ? 415 : 502));
    return jsonResponse({ error: code }, status);
  } finally {
    clearTimeout(timeoutId);
  }
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function isAllowedUrl(url) {
  if (!(url instanceof URL)) return false;
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  if (!url.hostname) return false;
  return !isPrivateOrReservedHost(url.hostname);
}

function isPrivateOrReservedHost(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
      host.endsWith(".internal") || host.endsWith(".home") || host.endsWith(".lan")) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((o) => o < 0 || o > 255)) return true;
    const [a, b] = octets;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a >= 224) return true;
    return false;
  }

  if (host.includes(":")) return true;

  return false;
}

async function fetchWithRedirects(startUrl, signal) {
  const MAX_REDIRECTS = 5;
  const MAX_BYTES = 512 * 1024;
  let current = startUrl;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    let res;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: signal,
        headers: {
          "Accept": "text/html,application/xhtml+xml",
          "User-Agent": "LinkNestPreview/1.0"
        }
      });
    } catch (e) {
      if (signal && signal.aborted) throw new Error("timeout");
      throw new Error("fetch_failed");
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("bad_redirect");
      let next;
      try {
        next = new URL(location, current);
      } catch (e) {
        throw new Error("bad_redirect");
      }
      if (!isAllowedUrl(next)) throw new Error("unsafe_redirect");
      current = next.href;
      continue;
    }

    if (!res.ok) throw new Error("http_error");

    const contentType = res.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      throw new Error("not_html");
    }

    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        try { await reader.cancel(); } catch (e) {}
        throw new Error("too_large");
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const html = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return { url: current, html: html };
  }

  throw new Error("too_many_redirects");
}

function parseMetadata(html) {
  const title = extractTitle(html);
  const description = extractDescription(html);
  return { title: title ? cleanText(title) : null, description: description ? cleanText(description) : null };
}

function extractTitle(html) {
  const og = getMetaProperty(html, "og:title");
  if (og) return og;
  const tw = getMetaProperty(html, "twitter:title");
  if (tw) return tw;
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t && t[1]) return t[1];
  return null;
}

function extractDescription(html) {
  const og = getMetaProperty(html, "og:description");
  if (og) return og;
  const tw = getMetaProperty(html, "twitter:description");
  if (tw) return tw;
  const meta = getMetaProperty(html, "description");
  if (meta) return meta;
  return null;
}

function getMetaProperty(html, property) {
  // attribute order: property then content
  const regex1 = new RegExp("<meta[^>]+(?:property|name)\\s*=\\s*[\"']" + escapeRegExp(property) + "[\"'][^>]*>", "i");
  const tag1 = html.match(regex1);
  if (tag1) {
    const content = tag1[0].match(/content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (content) return content[1] || content[2] || content[3] || null;
  }
  // reverse: content then property
  const regex2 = new RegExp("<meta[^>]+content\\s*=\\s*[\"']([^\"']*)[\"'][^>]+(?:property|name)\\s*=\\s*[\"']" + escapeRegExp(property) + "[\"']", "i");
  const m2 = html.match(regex2);
  if (m2 && m2[1]) return m2[1];
  return null;
}

function cleanText(value) {
  if (value == null) return null;
  let s = String(value).trim();
  s = s.replace(/&amp;/g, "&")
       .replace(/&lt;/g, "<")
       .replace(/&gt;/g, ">")
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'")
       .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(parseInt(n, 10)); })
       .replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); });
  s = s.replace(/\s+/g, " ").trim();
  return s.length ? s : null;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function errorCode(message) {
  switch (message) {
    case "invalid_url": return "invalid_url";
    case "unsafe_url":
    case "unsafe_redirect": return "unsafe_url";
    case "not_html": return "not_html";
    case "too_large": return "too_large";
    case "timeout": return "timeout";
    case "too_many_redirects": return "too_many_redirects";
    default: return "fetch_failed";
  }
}
