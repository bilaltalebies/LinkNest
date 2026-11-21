/* =========================================
   LinkNest — i18n (English / Arabic)
   ========================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "linknest-lang";

  const translations = {
    en: {
      skip_to_content: "Skip to content",
      nav_all_links: "All Links",
      nav_favorites: "Favorites",
      nav_uncategorized: "Uncategorized",
      nav_categories: "Categories",
      create_category: "Create a new category",
      add_link: "Add Link",
      add_link_aria: "Add a new link",
      search_placeholder: "Search links…",
      search_aria: "Search links",
      toggle_navigation: "Toggle navigation",
      theme_toggle_aria: "Toggle color theme",
      empty_add_first: "Add your first link",
      modal_add_link: "Add Link",
      modal_edit_link: "Edit Link",
      modal_new_category: "New Category",
      modal_rename_category: "Rename Category",
      field_url: "Website URL",
      field_name: "Website name",
      field_description: "Description",
      field_category: "Category",
      field_category_name: "Category name",
      placeholder_url: "https://example.com",
      placeholder_name: "Example Site",
      placeholder_description: "Short description (optional)",
      error_url_invalid: "Please enter a valid HTTP or HTTPS URL.",
      error_url_duplicate: "This URL has already been saved.",
      error_name_required: "Website name is required.",
      error_category_required: "Category name is required.",
      error_category_duplicate: "A category with this name already exists.",
      btn_cancel: "Cancel",
      btn_save: "Save",
      close_dialog_aria: "Close dialog",
      toast_link_added: "Link added.",
      toast_link_updated: "Link updated.",
      toast_link_deleted: "Link deleted.",
      toast_category_created: "Category created.",
      toast_category_renamed: "Category renamed.",
      toast_category_deleted: "Category deleted.",
      toast_storage_error: "Unable to save changes. Storage may be full.",
      fetch_details: "Fetch details",
      fetching_details: "Fetching…",
      fetch_success: "Details fetched.",
      fetch_no_metadata: "No metadata found.",
      fetch_error: "Could not fetch details.",
      confirm_overwrite: "Overwrite existing values with fetched details?",
      confirm_delete_link: 'Delete "{name}"? This cannot be undone.',
      confirm_delete_category: 'Delete category "{name}"? Its links will move to Uncategorized.',
      no_links_title: "No links yet",
      no_links_text: "Save your first link to see it here. Your personal collection will grow with you.",
      no_matches_title: "No matches found",
      no_matches_text: "Try a different search term or clear the search.",
      no_favorites_title: "No favorites yet",
      no_favorites_text: "Mark links as favorite to see them here.",
      no_uncategorized_title: "No uncategorized links",
      no_uncategorized_text: "All your links have a category.",
      no_category_links_title: "No links in this category",
      no_category_links_text: "Add links to {name} to see them here.",
      menu_open: "Open",
      menu_edit: "Edit",
      menu_delete: "Delete",
      favorite_toggle_aria: "Toggle favorite for {name}",
      more_actions_aria: "More actions for {name}",
      category_actions_aria: "Actions for {name}",
      uncategorized: "Uncategorized",
      link: "link",
      links: "links",
      switch_language_aria: "Switch language",
      language_toggle: "العربية"
    },
    ar: {
      skip_to_content: "تخطي إلى المحتوى",
      nav_all_links: "جميع الروابط",
      nav_favorites: "المفضلة",
      nav_uncategorized: "غير مصنف",
      nav_categories: "الفئات",
      create_category: "إنشاء فئة جديدة",
      add_link: "إضافة رابط",
      add_link_aria: "إضافة رابط جديد",
      search_placeholder: "البحث في الروابط…",
      search_aria: "البحث في الروابط",
      toggle_navigation: "تبديل التنقل",
      theme_toggle_aria: "تبديل المظهر",
      empty_add_first: "أضف أول رابط",
      modal_add_link: "إضافة رابط",
      modal_edit_link: "تعديل رابط",
      modal_new_category: "فئة جديدة",
      modal_rename_category: "إعادة تسمية الفئة",
      field_url: "رابط الموقع",
      field_name: "اسم الموقع",
      field_description: "الوصف",
      field_category: "الفئة",
      field_category_name: "اسم الفئة",
      placeholder_url: "https://example.com",
      placeholder_name: "موقع مثال",
      placeholder_description: "وصف مختصر (اختياري)",
      error_url_invalid: "يرجى إدخال رابط HTTP أو HTTPS صالح.",
      error_url_duplicate: "تم حفظ هذا الرابط مسبقاً.",
      error_name_required: "اسم الموقع مطلوب.",
      error_category_required: "اسم الفئة مطلوب.",
      error_category_duplicate: "توجد فئة بهذا الاسم مسبقاً.",
      btn_cancel: "إلغاء",
      btn_save: "حفظ",
      close_dialog_aria: "إغلاق النافذة",
      toast_link_added: "تمت إضافة الرابط.",
      toast_link_updated: "تم تحديث الرابط.",
      toast_link_deleted: "تم حذف الرابط.",
      toast_category_created: "تم إنشاء الفئة.",
      toast_category_renamed: "تمت إعادة تسمية الفئة.",
      toast_category_deleted: "تم حذف الفئة.",
      toast_storage_error: "تعذر حفظ التغييرات. قد يكون التخزين ممتلئاً.",
      fetch_details: "جلب التفاصيل",
      fetching_details: "جارٍ الجلب…",
      fetch_success: "تم جلب التفاصيل.",
      fetch_no_metadata: "لم يتم العثور على بيانات.",
      fetch_error: "تعذر جلب التفاصيل.",
      confirm_overwrite: "استبدال القيم الحالية بالبيانات المجلوبة؟",
      confirm_delete_link: 'هل تريد حذف "{name}"؟ لا يمكن التراجع عن هذا الإجراء.',
      confirm_delete_category: 'هل تريد حذف الفئة "{name}"؟ سيتم نقل روابطها إلى غير مصنف.',
      no_links_title: "لا توجد روابط بعد",
      no_links_text: "احفظ أول رابط لتراه هنا. ستتزايد مجموعتك الشخصية معك.",
      no_matches_title: "لا توجد نتائج",
      no_matches_text: "جرّب مصطلح بحث مختلف أو امسح البحث.",
      no_favorites_title: "لا توجد مفضلات بعد",
      no_favorites_text: "ضع علامة على الروابط كمفضلة لعرضها هنا.",
      no_uncategorized_title: "لا توجد روابط غير مصنفة",
      no_uncategorized_text: "جميع روابطك لديها فئة.",
      no_category_links_title: "لا توجد روابط في هذه الفئة",
      no_category_links_text: "أضف روابط إلى {name} لعرضها هنا.",
      menu_open: "فتح",
      menu_edit: "تعديل",
      menu_delete: "حذف",
      favorite_toggle_aria: "تبديل المفضلة لـ {name}",
      more_actions_aria: "المزيد من الإجراءات لـ {name}",
      category_actions_aria: "إجراءات الفئة {name}",
      uncategorized: "غير مصنف",
      link: "رابط",
      links: "روابط",
      switch_language_aria: "تبديل اللغة",
      language_toggle: "English"
    }
  };

  function getStoredLang() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "en" || v === "ar") return v;
    } catch (e) {}
    return "en";
  }

  let current = getStoredLang();
  if (!translations[current]) current = "en";

  function t(key) {
    return (translations[current] && translations[current][key]) ||
           (translations.en && translations.en[key]) || key;
  }

  function format(key, vars) {
    let s = t(key);
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return s;
  }

  function setLanguage(lang) {
    if (!translations[lang]) return;
    current = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }

  function getLanguage() { return current; }

  window.LN = {
    t: t,
    format: format,
    setLanguage: setLanguage,
    getLanguage: getLanguage
  };
})();
