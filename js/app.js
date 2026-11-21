/* =========================================
   LinkNest — Phase 2 Functional Bookmark Management
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "linknest-data";
  const DATA_VERSION = 1;
  const THEME_KEY = "linknest-theme";

  /* ---------- State ---------- */
  let state = { version: DATA_VERSION, bookmarks: [], categories: [] };
  let currentView = "all"; // all | favorites | uncategorized | category:<id>
  let currentSearch = "";
  let editingBookmarkId = null;
  let editingCategoryId = null; // null = create
  let lastFocused = null;
  let openMenuEl = null;
  let toastTimer = null;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------- IDs ---------- */
  function newId(prefix) {
    return prefix + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- Demo seed ---------- */
  function seedDemo() {
    const cats = [
      { id: "cat_dev", name: "Development" },
      { id: "cat_design", name: "Design" },
      { id: "cat_prod", name: "Productivity" },
      { id: "cat_learn", name: "Learning" }
    ];
    const links = [
      { name: "GitHub", url: "https://github.com", desc: "Where the world builds software. Host and review code, manage projects, and build software.", cat: "cat_dev", fav: true, letter: "G", color: "#24292f" },
      { name: "ChatGPT", url: "https://chat.openai.com", desc: "A conversational AI assistant for writing, analysis, coding, and brainstorming.", cat: "cat_prod", fav: true, letter: "C", color: "#10a37f" },
      { name: "MDN Web Docs", url: "https://developer.mozilla.org", desc: "Resources for developers, by developers. Documentation for web standards and APIs.", cat: "cat_learn", fav: false, letter: "M", color: "#000000" },
      { name: "Cloudflare", url: "https://www.cloudflare.com", desc: "Web performance, security, and reliability services for sites and applications.", cat: "cat_dev", fav: false, letter: "C", color: "#f38020" },
      { name: "YouTube", url: "https://www.youtube.com", desc: "Watch, upload, and share videos. Entertainment, education, and tutorials.", cat: "cat_design", fav: false, letter: "Y", color: "#ff0000" },
      { name: "Stack Overflow", url: "https://stackoverflow.com", desc: "The largest online community for programmers to learn and share knowledge.", cat: "cat_dev", fav: true, letter: "S", color: "#f48024" }
    ];
    const now = Date.now();
    state = {
      version: DATA_VERSION,
      categories: cats,
      bookmarks: links.map((l, i) => ({
        id: newId("b"),
        url: l.url,
        name: l.name,
        description: l.desc,
        categoryId: l.cat,
        favorite: l.fav,
        letter: l.letter,
        color: l.color,
        createdAt: now + i,
        updatedAt: now + i
      }))
    };
    saveData();
  }

  /* ---------- Storage ---------- */
  function isValidBookmark(b) {
    return b && typeof b === "object" && typeof b.id === "string" &&
      typeof b.url === "string" && typeof b.name === "string" &&
      (b.description === undefined || typeof b.description === "string") &&
      (b.categoryId === null || typeof b.categoryId === "string") &&
      typeof b.favorite === "boolean";
  }
  function isValidCategory(c) {
    return c && typeof c === "object" && typeof c.id === "string" && typeof c.name === "string" && c.name.trim().length > 0;
  }
  function isValidData(d) {
    return d && typeof d === "object" && d.version === DATA_VERSION &&
      Array.isArray(d.bookmarks) && Array.isArray(d.categories) &&
      d.bookmarks.every(isValidBookmark) && d.categories.every(isValidCategory);
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!isValidData(parsed)) return null;
      return parsed;
    } catch (e) {
      console.error("Failed to read storage:", e);
      return null;
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save storage:", e);
      showToast(LN.t("toast_storage_error"), true);
    }
  }

  /* ---------- Theme ---------- */
  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "light";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = $("#theme-toggle");
    if (toggle) toggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }
  function initTheme() {
    applyTheme(getPreferredTheme());
    const toggle = $("#theme-toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const next = current === "dark" ? "light" : "dark";
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { console.error(e); }
        applyTheme(next);
      });
    }
  }

  /* ---------- Sidebar (mobile) ---------- */
  function initSidebar() {
    const sidebar = $("#sidebar");
    const overlay = $("#sidebar-overlay");
    const toggle = $("#sidebar-toggle");
    if (!sidebar || !overlay || !toggle) return;

    function open() {
      sidebar.classList.add("is-open");
      overlay.classList.add("is-visible");
      overlay.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }
    function close() {
      sidebar.classList.remove("is-open");
      overlay.classList.remove("is-visible");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      window.setTimeout(function () { if (!overlay.classList.contains("is-visible")) overlay.hidden = true; }, 220);
    }
    function isOpen() { return sidebar.classList.contains("is-open"); }

    if (!window.matchMedia("(max-width: 768px)").matches) {
      toggle.setAttribute("aria-expanded", "true");
    }

    toggle.addEventListener("click", function () {
      if (window.matchMedia("(max-width: 768px)").matches) {
        if (isOpen()) close(); else open();
      } else {
        const app = document.querySelector(".app");
        if (!app) return;
        const collapsed = app.classList.toggle("sidebar-collapsed");
        toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      }
    });
    overlay.addEventListener("click", close);
    overlay.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    $$(".nav-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 768px)").matches) close();
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) close();
    });

    window.addEventListener("resize", function () {
      if (window.matchMedia("(max-width: 768px)").matches) {
        const app = document.querySelector(".app");
        if (app) app.classList.remove("sidebar-collapsed");
        toggle.setAttribute("aria-expanded", "false");
      } else {
        close();
        const app = document.querySelector(".app");
        const collapsed = !!(app && app.classList.contains("sidebar-collapsed"));
        toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      }
    });
  }

  /* ---------- URL helpers ---------- */
  function normalizeUrl(input) {
    try {
      const u = new URL(input.trim());
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      if (!u.hostname) return null;
      return u.href;
    } catch (e) {
      return null;
    }
  }

  /* ---------- Toast ---------- */
  function showToast(message, isError) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.toggle("is-error", !!isError);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 2600);
  }

  /* ---------- Modals ---------- */
  function openDialog(dialog, trigger) {
    lastFocused = trigger || document.activeElement;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }
  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      try { lastFocused.focus(); } catch (e) {}
    }
    lastFocused = null;
  }

  /* ---------- Bookmark modal ---------- */
  function populateCategorySelect(selectedId) {
    const sel = $("#field-category");
    if (!sel) return;
    sel.innerHTML = "";
    const noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = "Uncategorized";
    sel.appendChild(noneOpt);
    state.categories.forEach(function (c) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      if (selectedId && selectedId === c.id) opt.selected = true;
      sel.appendChild(opt);
    });
    if (selectedId) sel.value = selectedId; else sel.value = "";
  }

  function clearFieldErrors() {
    ["url", "name"].forEach(function (f) {
      const input = $("#field-" + f);
      const err = $("#error-" + f);
      if (input) input.classList.remove("is-invalid");
      if (err) err.textContent = "";
    });
  }

  function openBookmarkModal(bookmark, trigger) {
    editingBookmarkId = bookmark ? bookmark.id : null;
    const title = $("#bookmark-modal-title");
    if (title) title.textContent = bookmark ? LN.t("modal_edit_link") : LN.t("modal_add_link");
    const form = $("#bookmark-form");
    if (form) form.reset();
    clearFieldErrors();
    const status = $("#fetch-status");
    if (status) status.textContent = "";
    const urlInput = $("#field-url");
    const nameInput = $("#field-name");
    const descInput = $("#field-desc");
    if (bookmark) {
      if (urlInput) urlInput.value = bookmark.url;
      if (nameInput) nameInput.value = bookmark.name;
      if (descInput) descInput.value = bookmark.description || "";
    }
    populateCategorySelect(bookmark ? bookmark.categoryId : null);

    const dialog = $("#bookmark-modal");
    openDialog(dialog, trigger);
    setTimeout(function () {
      if (urlInput) urlInput.focus();
    }, 0);
  }

  function closeBookmarkModal() {
    const dialog = $("#bookmark-modal");
    closeDialog(dialog);
    editingBookmarkId = null;
  }

  async function fetchLinkDetails() {
    const urlInput = $("#field-url");
    const nameInput = $("#field-name");
    const descInput = $("#field-desc");
    const fetchBtn = $("#fetch-details-btn");
    const status = $("#fetch-status");
    const urlRaw = urlInput ? urlInput.value.trim() : "";
    const normalized = normalizeUrl(urlRaw);
    if (!normalized) {
      const err = $("#error-url");
      if (err) err.textContent = LN.t("error_url_invalid");
      if (urlInput) urlInput.classList.add("is-invalid");
      if (status) status.textContent = "";
      return;
    }
    const err = $("#error-url");
    if (err) err.textContent = "";
    if (urlInput) urlInput.classList.remove("is-invalid");
    if (fetchBtn) fetchBtn.disabled = true;
    if (fetchBtn) fetchBtn.textContent = LN.t("fetching_details");
    if (status) status.textContent = "";
    try {
      const res = await fetch("/api/link-preview?url=" + encodeURIComponent(normalized));
      let data = {};
      try { data = await res.json(); } catch (e) { data = {}; }
      if (!res.ok) {
        throw new Error((data && data.error) || "fetch_error");
      }
      const hasTitle = !!(data && data.title);
      const hasDesc = !!(data && data.description);
      if (!hasTitle && !hasDesc) {
        if (status) status.textContent = LN.t("fetch_no_metadata");
        return;
      }
      const nameHas = !!(nameInput && nameInput.value.trim());
      const descHas = !!(descInput && descInput.value.trim());
      if ((nameHas && hasTitle) || (descHas && hasDesc)) {
        if (!window.confirm(LN.t("confirm_overwrite"))) {
          if (status) status.textContent = LN.t("fetch_no_metadata");
          return;
        }
      }
      if (hasTitle && nameInput) nameInput.value = data.title;
      if (hasDesc && descInput) descInput.value = data.description;
      if (status) status.textContent = LN.t("fetch_success");
    } catch (e) {
      if (status) status.textContent = LN.t("fetch_error");
    } finally {
      if (fetchBtn) {
        fetchBtn.disabled = false;
        fetchBtn.textContent = LN.t("fetch_details");
      }
    }
  }

  function handleBookmarkSubmit(e) {
    e.preventDefault();
    clearFieldErrors();
    const urlInput = $("#field-url");
    const nameInput = $("#field-name");
    const descInput = $("#field-desc");
    const catSelect = $("#field-category");

    const urlRaw = urlInput.value.trim();
    const nameRaw = nameInput.value.trim();
    const descRaw = descInput.value.trim();
    const catId = catSelect.value || null;

    const normalized = normalizeUrl(urlRaw);
    let hasError = false;
    if (!normalized) {
      $("#error-url").textContent = LN.t("error_url_invalid");
      urlInput.classList.add("is-invalid");
      hasError = true;
    }
    if (!nameRaw) {
      $("#error-name").textContent = LN.t("error_name_required");
      nameInput.classList.add("is-invalid");
      hasError = true;
    }
    if (hasError) return;

    // duplicate check
    const duplicate = state.bookmarks.find(function (b) {
      return b.url === normalized && b.id !== editingBookmarkId;
    });
    if (duplicate) {
      $("#error-url").textContent = LN.t("error_url_duplicate");
      urlInput.classList.add("is-invalid");
      return;
    }

    const now = Date.now();
    if (editingBookmarkId) {
      const idx = state.bookmarks.findIndex((b) => b.id === editingBookmarkId);
      if (idx !== -1) {
        state.bookmarks[idx] = {
          ...state.bookmarks[idx],
          url: normalized,
          name: nameRaw,
          description: descRaw,
          categoryId: catId,
          updatedAt: now
        };
      }
      showToast(LN.t("toast_link_updated"));
    } else {
      state.bookmarks.unshift({
        id: newId("b"),
        url: normalized,
        name: nameRaw,
        description: descRaw,
        categoryId: catId,
        favorite: false,
        letter: nameRaw.charAt(0).toUpperCase(),
        color: "var(--accent)",
        createdAt: now,
        updatedAt: now
      });
      showToast(LN.t("toast_link_added"));
    }

    saveData();
    closeBookmarkModal();
    renderAll();
  }

  /* ---------- Category modal ---------- */
  function openCategoryModal(category, trigger) {
    editingCategoryId = category ? category.id : null;
    const title = $("#category-modal-title");
    if (title) title.textContent = category ? LN.t("modal_rename_category") : LN.t("modal_new_category");
    const input = $("#field-cat-name");
    const err = $("#error-cat-name");
    if (err) err.textContent = "";
    if (input) {
      input.classList.remove("is-invalid");
      input.value = category ? category.name : "";
    }
    const dialog = $("#category-modal");
    openDialog(dialog, trigger);
    setTimeout(function () { if (input) input.focus(); }, 0);
  }
  function closeCategoryModal() {
    closeDialog($("#category-modal"));
    editingCategoryId = null;
  }
  function handleCategorySubmit(e) {
    e.preventDefault();
    const input = $("#field-cat-name");
    const err = $("#error-cat-name");
    const name = input.value.trim();
    if (!name) {
      err.textContent = LN.t("error_category_required");
      input.classList.add("is-invalid");
      return;
    }
    // duplicate check (case-insensitive)
    const dup = state.categories.find(function (c) {
      return c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCategoryId;
    });
    if (dup) {
      err.textContent = LN.t("error_category_duplicate");
      input.classList.add("is-invalid");
      return;
    }
    if (editingCategoryId) {
      const cat = state.categories.find((c) => c.id === editingCategoryId);
      if (cat) cat.name = name;
      showToast(LN.t("toast_category_renamed"));
    } else {
      state.categories.push({ id: newId("cat"), name: name });
      showToast(LN.t("toast_category_created"));
    }
    saveData();
    closeCategoryModal();
    renderAll();
  }

  /* ---------- Delete ---------- */
  function deleteBookmark(id) {
    const bm = state.bookmarks.find((b) => b.id === id);
    if (!bm) return;
    if (!window.confirm(LN.format("confirm_delete_link", { name: bm.name }))) return;
    state.bookmarks = state.bookmarks.filter((b) => b.id !== id);
    saveData();
    renderAll();
    showToast(LN.t("toast_link_deleted"));
  }
  function deleteCategory(id) {
    const cat = state.categories.find((c) => c.id === id);
    if (!cat) return;
    if (!window.confirm(LN.format("confirm_delete_category", { name: cat.name }))) return;
    // move bookmarks
    state.bookmarks.forEach(function (b) {
      if (b.categoryId === id) b.categoryId = null;
    });
    state.categories = state.categories.filter((c) => c.id !== id);
    if (currentView === "category:" + id) currentView = "uncategorized";
    saveData();
    renderAll();
    showToast(LN.t("toast_category_deleted"));
  }

  /* ---------- Favorite toggle ---------- */
  function toggleFavorite(id) {
    const bm = state.bookmarks.find((b) => b.id === id);
    if (!bm) return;
    bm.favorite = !bm.favorite;
    bm.updatedAt = Date.now();
    saveData();
    renderAll();
  }

  /* ---------- Menu handling ---------- */
  function closeOpenMenu() {
    if (openMenuEl) {
      openMenuEl.classList.remove("is-open");
      const btn = openMenuEl.previousElementSibling;
      if (btn) btn.setAttribute("aria-expanded", "false");
      openMenuEl = null;
    }
  }
  function toggleMenu(menuEl, btn) {
    if (openMenuEl && openMenuEl !== menuEl) closeOpenMenu();
    const willOpen = !menuEl.classList.contains("is-open");
    if (willOpen) {
      menuEl.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      openMenuEl = menuEl;
    } else {
      closeOpenMenu();
    }
  }

  // close menus on outside click
  document.addEventListener("click", function (e) {
    if (openMenuEl && !openMenuEl.contains(e.target)) {
      const btn = openMenuEl.previousElementSibling;
      // allow clicking the toggle button itself (handled separately)
      if (btn && btn.contains(e.target)) return;
      closeOpenMenu();
    }
  });

  /* ---------- Rendering ---------- */
  function getCategoryName(id) {
    if (!id) return LN.t("uncategorized");
    const c = state.categories.find((x) => x.id === id);
    return c ? c.name : LN.t("uncategorized");
  }
  function getCategoryClass(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("dev")) return "dev";
    if (n.includes("design")) return "design";
    if (n.includes("prod")) return "productivity";
    if (n.includes("learn")) return "learning";
    return "dev";
  }

  function filteredBookmarks() {
    let list = state.bookmarks.slice();
    if (currentView === "favorites") list = list.filter((b) => b.favorite);
    else if (currentView === "uncategorized") list = list.filter((b) => !b.categoryId);
    else if (currentView.startsWith("category:")) {
      const id = currentView.slice(9);
      list = list.filter((b) => b.categoryId === id);
    }
    const q = currentSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(function (b) {
        return b.name.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (b.description || "").toLowerCase().includes(q);
      });
    }
    return list;
  }

  function renderSidebarCategories() {
    const list = $("#category-list");
    if (!list) return;
    list.innerHTML = "";
    state.categories.forEach(function (c) {
      const li = document.createElement("li");
      li.className = "category-row";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-item nav-item--category";
      if (currentView === "category:" + c.id) {
        btn.classList.add("is-active");
        btn.setAttribute("aria-current", "page");
      }
      // dot color by index? use class by name
      const dot = document.createElement("span");
      dot.className = "category-dot category-dot--" + getCategoryClass(c.name);
      dot.setAttribute("aria-hidden", "true");
      btn.appendChild(dot);
      const label = document.createElement("span");
      label.textContent = c.name;
      btn.appendChild(label);
      btn.addEventListener("click", function () {
        currentView = "category:" + c.id;
        const title = $("#page-title");
        if (title) title.textContent = c.name;
        renderAll();
      });
      li.appendChild(btn);

      // actions
      const actionsBtn = document.createElement("button");
      actionsBtn.type = "button";
      actionsBtn.className = "icon-btn icon-btn--ghost icon-btn--sm category-actions";
      actionsBtn.setAttribute("aria-label", LN.format("category_actions_aria", { name: c.name }));
      actionsBtn.setAttribute("aria-haspopup", "menu");
      actionsBtn.setAttribute("aria-expanded", "false");
      actionsBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>';

      const menu = document.createElement("div");
      menu.className = "menu";
      menu.setAttribute("role", "menu");

      const renameItem = document.createElement("button");
      renameItem.type = "button";
      renameItem.className = "menu__item";
      renameItem.setAttribute("role", "menuitem");
      renameItem.textContent = LN.t("menu_edit");
      renameItem.addEventListener("click", function () {
        closeOpenMenu();
        openCategoryModal(c, actionsBtn);
      });

      const deleteItem = document.createElement("button");
      deleteItem.type = "button";
      deleteItem.className = "menu__item menu__item--danger";
      deleteItem.setAttribute("role", "menuitem");
      deleteItem.textContent = LN.t("menu_delete");
      deleteItem.addEventListener("click", function () {
        closeOpenMenu();
        deleteCategory(c.id);
      });

      menu.appendChild(renameItem);
      menu.appendChild(deleteItem);

      actionsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleMenu(menu, actionsBtn);
      });

      li.appendChild(actionsBtn);
      li.appendChild(menu);
      list.appendChild(li);
    });
  }

  function renderCards() {
    const grid = $("#card-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const items = filteredBookmarks();

    items.forEach(function (bm) {
      const card = document.createElement("article");
      card.className = "bookmark-card";

      const top = document.createElement("div");
      top.className = "card__top";

      const favIcon = document.createElement("div");
      favIcon.className = "card__favicon";
      favIcon.setAttribute("aria-hidden", "true");
      const letter = bm.letter || (bm.name ? bm.name.charAt(0).toUpperCase() : "?");
      const color = bm.color || "var(--accent)";
      const span = document.createElement("span");
      span.style.color = color;
      span.textContent = letter;
      favIcon.appendChild(span);

      const meta = document.createElement("div");
      meta.className = "card__meta";
      const safeUrl = normalizeUrl(bm.url) || "#";
      const nameLink = document.createElement("a");
      nameLink.className = "card__name card__name-link";
      nameLink.href = safeUrl;
      nameLink.target = "_blank";
      nameLink.rel = "noopener noreferrer";
      nameLink.textContent = bm.name;
      nameLink.addEventListener("click", function (e) {
        // validate URL before opening
        if (!normalizeUrl(bm.url)) {
          e.preventDefault();
          showToast(LN.t("error_url_invalid"), true);
        }
      });
      const urlSpan = document.createElement("span");
      urlSpan.className = "card__url";
      urlSpan.textContent = bm.url;
      meta.appendChild(nameLink);
      meta.appendChild(urlSpan);

      const actions = document.createElement("div");
      actions.className = "card__actions card__menu";

      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "icon-btn icon-btn--ghost favorite-btn";
      if (bm.favorite) favBtn.classList.add("is-favorite");
      favBtn.setAttribute("aria-label", LN.format("favorite_toggle_aria", { name: bm.name }));
      favBtn.setAttribute("aria-pressed", bm.favorite ? "true" : "false");
      favBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      favBtn.addEventListener("click", function () { toggleFavorite(bm.id); });

      const menuBtn = document.createElement("button");
      menuBtn.type = "button";
      menuBtn.className = "icon-btn icon-btn--ghost";
      menuBtn.setAttribute("aria-label", LN.format("more_actions_aria", { name: bm.name }));
      menuBtn.setAttribute("aria-haspopup", "menu");
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>';

      const menu = document.createElement("div");
      menu.className = "menu";
      menu.setAttribute("role", "menu");

      const openItem = document.createElement("button");
      openItem.type = "button";
      openItem.className = "menu__item";
      openItem.setAttribute("role", "menuitem");
      openItem.textContent = LN.t("menu_open");
      openItem.addEventListener("click", function () {
        closeOpenMenu();
        const n = normalizeUrl(bm.url);
        if (n) window.open(n, "_blank", "noopener,noreferrer");
        else showToast(LN.t("error_url_invalid"), true);
      });

      const editItem = document.createElement("button");
      editItem.type = "button";
      editItem.className = "menu__item";
      editItem.setAttribute("role", "menuitem");
      editItem.textContent = LN.t("menu_edit");
      editItem.addEventListener("click", function () {
        closeOpenMenu();
        openBookmarkModal(bm, menuBtn);
      });

      const deleteItem = document.createElement("button");
      deleteItem.type = "button";
      deleteItem.className = "menu__item menu__item--danger";
      deleteItem.setAttribute("role", "menuitem");
      deleteItem.textContent = LN.t("menu_delete");
      deleteItem.addEventListener("click", function () {
        closeOpenMenu();
        deleteBookmark(bm.id);
      });

      menu.appendChild(openItem);
      menu.appendChild(editItem);
      menu.appendChild(deleteItem);

      menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleMenu(menu, menuBtn);
      });

      actions.appendChild(favBtn);
      actions.appendChild(menuBtn);
      actions.appendChild(menu);

      top.appendChild(favIcon);
      top.appendChild(meta);
      top.appendChild(actions);

      const desc = document.createElement("p");
      desc.className = "card__desc";
      desc.textContent = bm.description || "";

      const footer = document.createElement("div");
      footer.className = "card__footer";
      const badge = document.createElement("span");
      badge.className = "category-badge category-badge--" + getCategoryClass(getCategoryName(bm.categoryId));
      badge.textContent = getCategoryName(bm.categoryId);
      const domain = document.createElement("span");
      domain.className = "card__domain";
      try { domain.textContent = new URL(bm.url).hostname; } catch (e) { domain.textContent = bm.url; }
      footer.appendChild(badge);
      footer.appendChild(domain);

      card.appendChild(top);
      card.appendChild(desc);
      card.appendChild(footer);
      grid.appendChild(card);
    });

    renderEmptyState(items.length);
  }

  function renderEmptyState(count) {
    const empty = $("#empty-state");
    const grid = $("#card-grid");
    if (!empty || !grid) return;
    if (count === 0) {
      grid.style.display = "none";
      empty.hidden = false;
      // meaningful text
      const title = $("#empty-title");
      const text = $("#empty-text");
      const addBtn = $("#empty-add-btn");
      if (currentSearch.trim()) {
        if (title) title.textContent = LN.t("no_matches_title");
        if (text) text.textContent = LN.t("no_matches_text");
        if (addBtn) addBtn.hidden = true;
      } else if (currentView === "favorites") {
        if (title) title.textContent = LN.t("no_favorites_title");
        if (text) text.textContent = LN.t("no_favorites_text");
        if (addBtn) addBtn.hidden = false;
      } else if (currentView === "uncategorized") {
        if (title) title.textContent = LN.t("no_uncategorized_title");
        if (text) text.textContent = LN.t("no_uncategorized_text");
        if (addBtn) addBtn.hidden = false;
      } else if (currentView.startsWith("category:")) {
        const c = state.categories.find((x) => x.id === currentView.slice(9));
        if (title) title.textContent = LN.t("no_category_links_title");
        if (text) text.textContent = c ? LN.format("no_category_links_text", { name: c.name }) : LN.t("no_category_links_text").replace("{name}", "");
        if (addBtn) addBtn.hidden = false;
      } else {
        if (title) title.textContent = LN.t("no_links_title");
        if (text) text.textContent = LN.t("no_links_text");
        if (addBtn) addBtn.hidden = false;
      }
    } else {
      grid.style.display = "";
      empty.hidden = true;
    }
  }

  function updateCount() {
    const el = $("#result-count");
    if (!el) return;
    const n = filteredBookmarks().length;
    el.textContent = n + " " + (n === 1 ? LN.t("link") : LN.t("links"));
  }

  function updatePageTitle() {
    const title = $("#page-title");
    if (!title) return;
    if (currentView === "all") title.textContent = LN.t("nav_all_links");
    else if (currentView === "favorites") title.textContent = LN.t("nav_favorites");
    else if (currentView === "uncategorized") title.textContent = LN.t("nav_uncategorized");
    else if (currentView.startsWith("category:")) {
      const c = state.categories.find((x) => x.id === currentView.slice(9));
      title.textContent = c ? c.name : LN.t("nav_categories");
    }
  }

  function renderNavActive() {
    // main nav
    $$("button[data-view]").forEach(function (btn) {
      const v = btn.getAttribute("data-view");
      const active = (v === "all" && currentView === "all") ||
        (v === "favorites" && currentView === "favorites") ||
        (v === "uncategorized" && currentView === "uncategorized");
      btn.classList.toggle("is-active", active);
      if (active) btn.setAttribute("aria-current", "page"); else btn.removeAttribute("aria-current");
    });
    // categories
    $$(".nav-item--category").forEach(function (btn) { btn.classList.remove("is-active"); btn.removeAttribute("aria-current"); });
    // active category handled in renderSidebarCategories
  }

  function renderAll() {
    updatePageTitle();
    renderSidebarCategories();
    renderNavActive();
    renderCards();
    updateCount();
  }

  /* ---------- Nav ---------- */
  function initNav() {
    $$("button[data-view]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const v = btn.getAttribute("data-view");
        currentView = v;
        renderAll();
      });
    });
    $("#add-category-btn")?.addEventListener("click", function (e) {
      openCategoryModal(null, e.currentTarget);
    });
  }

  /* ---------- Search ---------- */
  function initSearch() {
    const input = $("#search-input");
    if (!input) return;
    input.addEventListener("input", function () {
      currentSearch = input.value;
      renderCards();
      updateCount();
    });
  }

  /* ---------- Language ---------- */
  function applyLanguageUI(lang) {
    LN.setLanguage(lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = LN.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.setAttribute("placeholder", LN.t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", LN.t(el.getAttribute("data-i18n-aria")));
    });
    const lt = $("#lang-toggle");
    if (lt) lt.textContent = LN.t("language_toggle");
    renderAll();
  }

  /* ---------- Wiring ---------- */
  function init() {
    const data = loadData();
    if (data) state = data;
    else seedDemo();

    initTheme();
    initSidebar();
    initNav();
    initSearch();

    const langToggle = $("#lang-toggle");
    if (langToggle) {
      langToggle.addEventListener("click", function () {
        const next = LN.getLanguage() === "en" ? "ar" : "en";
        applyLanguageUI(next);
      });
    }

    // bookmark modal
    const addBtn = $("#add-link-btn");
    const emptyAddBtn = $("#empty-add-btn");
    const modal = $("#bookmark-modal");
    const form = $("#bookmark-form");
    const closeBtn = $("#bookmark-modal-close");
    const cancelBtn = $("#bookmark-cancel-btn");

    if (addBtn) addBtn.addEventListener("click", function (e) { openBookmarkModal(null, e.currentTarget); });
    if (emptyAddBtn) emptyAddBtn.addEventListener("click", function (e) { openBookmarkModal(null, e.currentTarget); });
    if (closeBtn) closeBtn.addEventListener("click", closeBookmarkModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeBookmarkModal);
    if (form) form.addEventListener("submit", handleBookmarkSubmit);

    const fetchBtn = $("#fetch-details-btn");
    if (fetchBtn) fetchBtn.addEventListener("click", fetchLinkDetails);
    if (modal) {
      modal.addEventListener("cancel", function (e) { e.preventDefault(); closeBookmarkModal(); });
    }

    // Escape key closes dialogs
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      const bm = $("#bookmark-modal");
      const cm = $("#category-modal");
      if (bm && bm.open) { e.preventDefault(); closeBookmarkModal(); }
      else if (cm && cm.open) { e.preventDefault(); closeCategoryModal(); }
    });

    // category modal
    const catModal = $("#category-modal");
    const catForm = $("#category-form");
    const catClose = $("#category-modal-close");
    const catCancel = $("#category-cancel-btn");
    if (catClose) catClose.addEventListener("click", closeCategoryModal);
    if (catCancel) catCancel.addEventListener("click", closeCategoryModal);
    if (catForm) catForm.addEventListener("submit", handleCategorySubmit);
    if (catModal) {
      catModal.addEventListener("cancel", function (e) { e.preventDefault(); closeCategoryModal(); });
    }

    applyLanguageUI(LN.getLanguage());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
