// menu.safe.js — безопасная версия menu.js для SPA + i18n

let menuData = {};
let currentFilter = 'all';
let currentLang = 'eng';
window.MenuStorage = { data: {} };

// Helpers
function normKey(s) {
  if (!s && s !== 0) return '';
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
}
function pickLocalizedText(field, lang) {
  if (field == null) return '';
  if (typeof field === 'object') {
    return field[lang] || field.eng || field.cz || Object.values(field)[0] || '';
  }
  return String(field);
}
function pickLanguageFromI18n() {
  if (window.i18n && typeof window.i18n.getLang === 'function') {
    const raw = window.i18n.getLang();
    if (!raw) return 'eng';
    const k = raw.toLowerCase();
    if (k === 'en') return 'eng';
    if (k === 'cz') return 'cz';
    return raw;
  }
  return currentLang || 'eng';
}

// Safety: sanitize image src to avoid javascript: URIs, allow same-origin & http/https
function sanitizeImageSrc(src) {
  if (!src) return '';
  try {
    // Use document.baseURI (includes any base path like /~achilkem/)
    const base = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : window.location.href;
    const url = new URL(src, base);

    // Only allow http/https and same origin (or same-host path)
    const protocol = url.protocol;
    if ((protocol === 'http:' || protocol === 'https:')) {
      // Accept same-origin or paths that resolve under the same host
      if (url.origin === location.origin) {
        return url.href;
      }
      // Optional: allow same-host with different origin (rare) — skip for security
    }
  } catch (e) {
    // invalid URL -> return empty
  }
  return '';
}

// Init / load
async function initMenu() {
  try {
    const res = await fetch('data/menu.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load menu.json');
    menuData = await res.json();
    window.MenuStorage.data = menuData;
    currentLang = pickLanguageFromI18n();
    renderMenu(menuData, currentLang, currentFilter);
    setupMenuFilters(); // safe to call
  } catch (err) {
    console.error('menu.js initMenu error:', err);
  }
}

document.addEventListener('DOMContentLoaded', initMenu);

// renderMenu — безопасно вставляет данные в DOM (textContent, sanitized src)
function renderMenu(data, lang = 'eng', filter = 'all') {
  const container = document.querySelector('.menu-items');
  if (!container) {
    console.error('menu.js: .menu-items container not found');
    return;
  }
  // clear container safely
  while (container.firstChild) container.removeChild(container.firstChild);

  const template = document.getElementById('menu-item-template');
  if (!template) {
    console.error('menu.js: #menu-item-template not found');
    return;
  }

  const wantedNorm = filter === 'all' ? null : normKey(filter);

  Object.entries(data || {}).forEach(([categoryKey, items]) => {
    if (!Array.isArray(items)) return;
    const categoryNorm = normKey(categoryKey);
    if (wantedNorm && categoryNorm !== wantedNorm) return;

    items.forEach(item => {
      const clone = template.content.cloneNode(true);
      const article = clone.querySelector('.menu-item');
      const img = clone.querySelector('img');
      const titleEl = clone.querySelector('.menu-first-text');
      const descEl = clone.querySelector('.menu-first-desc');
      const priceEl = clone.querySelector('.menu-first-price');
      const weightEl = clone.querySelector('.menu-order-weight');

      if (article) article.dataset.category = categoryKey;

      if (img) {
        const safeSrc = sanitizeImageSrc(item.image || '');
        if (safeSrc) {
          img.setAttribute('src', safeSrc);
        } else {
          img.removeAttribute('src');
        }
        img.setAttribute('alt', pickLocalizedText(item.name || item.title || '', lang) || '');
      }
      if (titleEl) titleEl.textContent = pickLocalizedText(item.name || item.title || '', lang);
      if (descEl) descEl.textContent = pickLocalizedText(item.description || item.desc || '', lang);
      if (priceEl) priceEl.textContent = String(item.price || '');
      if (weightEl) weightEl.textContent = String(item.weight || '');

      container.appendChild(clone);
    });
  });
}

// Filters: safe wiring
function setupMenuFilters() {
  const buttons = Array.from(document.querySelectorAll('.menu-button'));
  if (!buttons.length) return;

  const activeBtn = buttons.find(b => b.classList.contains('active'));
  if (activeBtn) {
    currentFilter = mapFilterToCategory((activeBtn.dataset.filter || 'all').toLowerCase());
  } else {
    buttons.forEach((b, i) => b.classList.toggle('active', i === 0));
    currentFilter = mapFilterToCategory((buttons[0] && buttons[0].dataset.filter) || 'all');
  }

  // replace nodes to remove previous listeners safely
  buttons.forEach(btn => {
    const parent = btn.parentNode;
    if (!parent) return;
    const clone = btn.cloneNode(true);
    parent.replaceChild(clone, btn);
  });

  const freshButtons = Array.from(document.querySelectorAll('.menu-button'));
  freshButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      freshButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const raw = (btn.dataset.filter || 'all').toLowerCase();
      currentFilter = mapFilterToCategory(raw);
      currentLang = pickLanguageFromI18n();
      renderMenu(menuData, currentLang, currentFilter);
    });
  });
}

function mapFilterToCategory(filterValue) {
  if (!filterValue) return 'all';
  if (filterValue === 'all') return 'all';
  const keys = Object.keys(menuData || {});
  const lower = filterValue.toLowerCase();
  const exact = keys.find(k => k.toLowerCase() === lower);
  if (exact) return exact;
  const targetNorm = normKey(filterValue);
  const found = keys.find(k => normKey(k) === targetNorm);
  if (found) return found;
  return filterValue;
}

// i18n change handling
window.addEventListener('i18n:changed', (e) => {
  const lang = (e && e.detail && e.detail.lang) ? e.detail.lang : pickLanguageFromI18n();
  currentLang = (lang === 'en') ? 'eng' : lang;
  if (Object.keys(menuData || {}).length) {
    renderMenu(menuData, currentLang, currentFilter);
  }
});

/* ------------------------
   Add-item dialog & upload
   ------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.getElementById("add-item-dialog");
  if (!dialog) return; // nothing to wire

  const openBtn = document.getElementById("menu-show-add-item-btn");
  const dialogContent = dialog.querySelector(".menu-add-dialog-content");
  const closeBtn = document.getElementById("close-dialog");
  const form = document.getElementById("menu-add-item-form");
  const categorySelect = document.getElementById("item-category");
  const idField = document.getElementById("item-id");
  const nameEngInput = document.getElementById("item-name-eng");
  const nameCzInput = document.getElementById("item-name-cz");
  const imgNameField = document.getElementById("item-image-name");
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const previewImg = document.getElementById("preview-img");
  const dropText = dropZone ? dropZone.querySelector("p") : null;

  if (!form || !categorySelect || !idField || !nameEngInput || !imgNameField) {
    console.warn('menu.js: add-item form missing fields, skipping add-item wiring.');
    return;
  }

  let currentFileExtension = ".jpg";
  let currentFileObject = null;

  function calculateNextId(categoryKey) {
    const items = menuData[categoryKey] || [];
    // prefix fallback to 1
    let prefix = 1;
    if (items.length > 0 && typeof items[0].id === 'string') {
      const p = parseInt(items[0].id.split(".")[0], 10);
      if (!Number.isNaN(p)) prefix = p;
    }
    let maxSecond = 0;
    items.forEach(it => {
      if (!it || typeof it.id !== 'string') return;
      const parts = it.id.split(".");
      const second = parseInt(parts[1], 10);
      if (!Number.isNaN(second) && second > maxSecond) maxSecond = second;
    });
    return `${prefix}.${maxSecond + 1}`;
  }

  function updateFileName() {
    const fullId = idField.value || '';
    const rawName = (nameEngInput.value || '').trim();

    if (!fullId) return;

    let shortId = fullId.includes('.') ? fullId.split('.')[1] : fullId;
    if (fullId.includes('.')) shortId = fullId.split('.')[1];

    let safeName = "item";
    if (rawName) {
      safeName = rawName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!safeName) safeName = "item";
    }

    imgNameField.value = `${shortId}-${safeName}${currentFileExtension}`;
  }

  nameEngInput.addEventListener("input", updateFileName);
  categorySelect.addEventListener("change", (e) => {
    idField.value = calculateNextId(e.target.value);
    updateFileName();
  });

  // Drag & drop (guards for missing elements)
  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault(); e.stopPropagation();
      }, false);
    });
    ['dragenter', 'dragover'].forEach(ev => dropZone.addEventListener(ev, () => dropZone.classList.add('drag-over')));
    ['dragleave', 'drop'].forEach(ev => dropZone.addEventListener(ev, () => dropZone.classList.remove('drag-over')));
    dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
  }

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    // basic client checks: size limit (e.g. 5MB) and mime type prefix
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File is too large (max 5MB).');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Only image files are allowed.');
      return;
    }

    currentFileObject = file;
    const fileName = file.name;
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      currentFileExtension = fileName.substring(lastDotIndex).toLowerCase().replace(/[^.\w-]/g,'');
    }

    const reader = new FileReader();
    reader.onloadend = function () {
      if (previewImg) {
        previewImg.src = reader.result;
        previewImg.style.display = "block";
      }
      if (dropText) dropText.style.display = "none";
    };
    reader.readAsDataURL(file);
    updateFileName();
  }

  // modal controls
  if (openBtn) openBtn.addEventListener("click", () => {
    const currentCat = categorySelect.value;
    idField.value = calculateNextId(currentCat);
    updateFileName();
    dialog.classList.remove("menu-modal-hidden");
  });
  if (closeBtn) closeBtn.addEventListener("click", () => dialog.classList.add("menu-modal-hidden"));
  if (dialogContent) dialog.addEventListener("click", (e) => { if (!dialogContent.contains(e.target)) dialog.classList.add("menu-modal-hidden"); });

  // Validate filename server-safe
  function isValidFilename(name) {
    return /^[A-Za-z0-9._-]+$/.test(name);
  }

  // Submit form (add meal)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Сохранение...";
    }

    const category = categorySelect.value;
    const finalFileName = imgNameField.value;

    if (!isValidFilename(finalFileName)) {
      alert('Invalid file name.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Сохранить"; }
      return;
    }

    const newDish = {
      id: idField.value,
      name: { eng: nameEngInput.value || '', cz: nameCzInput ? nameCzInput.value || '' : '' },
      description: {
        eng: document.getElementById("item-desc-eng") ? document.getElementById("item-desc-eng").value || '' : '',
        cz: document.getElementById("item-desc-cz") ? document.getElementById("item-desc-cz").value || '' : ''
      },
      price: (document.getElementById("item-price") ? document.getElementById("item-price").value || '' : '') + " CZK",
      weight: document.getElementById("item-weight") ? document.getElementById("item-weight").value || '' : '',
      image: `./img/menu-img/${category}/${finalFileName}`
    };

    const formData = new FormData();
    formData.append('category', category);
    formData.append('itemJson', JSON.stringify(newDish));
    formData.append('imageName', finalFileName);
    if (currentFileObject) formData.append('imageFile', currentFileObject);

    // CSRF: ensure manager exists and is initialized
    try {
      if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
        try { await window.CSRFManager.init(); } catch (e) { console.warn('CSRF init failed:', e); }
      }
      if (window.CSRFManager && typeof window.CSRFManager.appendToFormData === 'function') {
        await window.CSRFManager.appendToFormData(formData);
      }
    } catch (err) {
      console.warn('CSRF append failed (will still try request):', err);
    }

    const headers = (window.CSRFManager && typeof window.CSRFManager.getHeader === 'function') ? window.CSRFManager.getHeader() : {};

    try {
      const response = await fetch('./php/add_meal.php', {
        method: 'POST',
        body: formData,
        headers,
        credentials: 'include'
      });

      // prefer JSON
      let result;
      try {
        result = await response.json();
      } catch (err) {
        // fallback: try text parse
        const text = await response.text();
        try { result = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON from server'); }
      }

      if (result && result.success) {
        alert("✅ " + (result.message || 'Added'));
        if (!menuData[category]) menuData[category] = [];
        menuData[category].push(newDish);
        renderMenu(menuData, currentLang, currentFilter);
        dialog.classList.add("menu-modal-hidden");
        form.reset();
        if (previewImg) previewImg.style.display = "none";
        if (dropText) dropText.style.display = "block";
        currentFileObject = null;
      } else {
        alert("❌ Ошибка сервера: " + (result && result.message ? result.message : 'Unknown'));
      }

    } catch (error) {
      console.error('Ошибка JS при отправке add_meal:', error);
      alert('Server error — see console.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Сохранить"; }
    }
  });
});
