// Normalize a key for comparison/searching (lowercase, remove non-alphanumerics).

export async function initMenu() {
  let menuData = {};
  let currentFilter = 'all';
  let currentLang = 'eng';
  window.MenuStorage = { data: {} };

  // Normalize a key for comparison/searching (lowercase, remove non-alphanumerics).
  function normKey(s) {
    if (!s && s !== 0) return '';
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  }
  // Pick localized text from a field that may be either a string or an object {eng:..., cz:...}.
  function pickLocalizedText(field, lang) {
    if (field == null) return '';
    if (typeof field === 'object') {
      return field[lang] || field.eng || field.cz || Object.values(field)[0] || '';
    }
    return String(field);
  }
  // Pick localized text from a field that may be either a string or an object {eng:..., cz:...}.
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

  // Sanitize image src — allow only http(s) and same-origin absolute/relative URLs.
  // Returns empty string when URL is unsafe.
  function sanitizeImageSrc(src) {
    if (!src) return '';
    try {
      const base = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : window.location.href;
      const url = new URL(src, base);
      const protocol = url.protocol;
      if ((protocol === 'http:' || protocol === 'https:')) {
        if (url.origin === location.origin) {
          return url.href;
        }
      }
    } catch (e) {}
    return '';
  }
  // Load menu JSON (no-store to avoid caching during development), then render.
  async function loadMenuData() {
    try {
      const res = await fetch('data/menu.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load menu.json');
      menuData = await res.json();
      window.MenuStorage.data = menuData;
      currentLang = pickLanguageFromI18n();
      renderMenu(menuData, currentLang, currentFilter);
      setupMenuFilters();
    } catch (err) {
      console.error('menu.js initMenu error:', err);
    }
  }
  // Render menu items into .menu-items using a <template>.
  function renderMenu(data, lang = 'eng', filter = 'all') {
    const container = document.querySelector('.menu-items');
    if (!container) {
      console.error('menu.js: .menu-items container not found');
      return;
    }
    while (container.firstChild) container.removeChild(container.firstChild);

    const template = document.getElementById('menu-item-template');
    if (!template) { console.error('menu.js: #menu-item-template not found'); return; }

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
          // only set src when safe (same-origin); otherwise omit to avoid mixed-origin issues.
          const safeSrc = sanitizeImageSrc(item.image || '');
          if (safeSrc) img.setAttribute('src', safeSrc);
          else img.removeAttribute('src');
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

  // Prepare filter buttons: replace nodes to remove attached listeners, attach fresh ones.
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

    // Replace elements to remove any previously bound event listeners (clean slate).
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

  // Map a filter value (label) to an existing category key in data, with normalization and fallbacks.
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

  // Re-render when language changes via i18n event.
  window.addEventListener('i18n:changed', (e) => {
    const lang = (e && e.detail && e.detail.lang) ? e.detail.lang : pickLanguageFromI18n();
    currentLang = (lang === 'en') ? 'eng' : lang;
    if (Object.keys(menuData || {}).length) {
      renderMenu(menuData, currentLang, currentFilter);
    }
  });

  // Add-item dialog wiring (minimal validation + image handling).
  const dialog = document.getElementById("add-item-dialog");
  if (!dialog) return; 

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

  // Calculate next id using pattern "prefix.number" where prefix is from first item or 1.
  function calculateNextId(categoryKey) {
    const items = menuData[categoryKey] || [];
    
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

  
  // Drag & drop + file input handling.
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

  
  if (openBtn) openBtn.addEventListener("click", () => {
    const currentCat = categorySelect.value;
    idField.value = calculateNextId(currentCat);
    updateFileName();
    dialog.classList.remove("menu-modal-hidden");
    if (nameEngInput) nameEngInput.focus();
  });
  if (closeBtn) closeBtn.addEventListener("click", () => dialog.classList.add("menu-modal-hidden"));

  
  
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
      
      if (dialog && !dialog.classList.contains('menu-modal-hidden')) {
        dialog.classList.add('menu-modal-hidden');
      }
    }
  });

  
  function isValidFilename(name) {
    return /^[A-Za-z0-9._-]+$/.test(name);
  }

  const priceInput = document.getElementById('item-price');
  const weightInput = document.getElementById('item-weight');

  // Helpers to enforce digits-only behavior with caret preservation.
  function insertOnlyDigitsAtCaret(el, text) {
    const cleaned = (text || '').replace(/[^\d]+/g, '');
    try {
      const start = typeof el.selectionStart === 'number' ? el.selectionStart : el.value.length;
      const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : el.value.length;

      if (typeof el.setRangeText === 'function') {
        el.setRangeText(cleaned, start, end, 'end'); 
        el.selectionStart = el.selectionEnd = start + cleaned.length;
      } else {
        const val = el.value || '';
        el.value = val.slice(0, start) + cleaned + val.slice(end);
        el.selectionStart = el.selectionEnd = start + cleaned.length;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (err) {
      // Fallback: strip non-digits globally.
      el.value = (el.value || '').replace(/[^\d]+/g, '');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  
  function onlyDigitsInputHandler(e) {
    const el = e.target;
    const old = el.value || '';
    const cleaned = old.replace(/[^\d]+/g, '');
    if (cleaned !== old) {
      // Try to approximate caret position after cleaning.
      const pos = (el.selectionStart || 0) - (old.length - cleaned.length);
      el.value = cleaned;
      
      const newPos = Math.max(0, Math.min(el.value.length, pos));
      try { el.setSelectionRange(newPos, newPos); } catch(_) {}
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  
  function onlyDigitsKeydownHandler(e) {
    
    // Allow navigation + control keys; block other non-digit keys.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const allowedKeys = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'Tab', 'Enter'
    ];
    if (allowedKeys.indexOf(e.key) !== -1) return;
    
    if (/^[0-9]$/.test(e.key)) return;
    
    e.preventDefault();
  }

  
  function onlyDigitsPasteHandler(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    insertOnlyDigitsAtCaret(e.target, text);
  }

  
  if (priceInput) {
    
    priceInput.addEventListener('input', onlyDigitsInputHandler);
    priceInput.addEventListener('keydown', onlyDigitsKeydownHandler);
    priceInput.addEventListener('paste', onlyDigitsPasteHandler);

    // Trim leading zeros on blur.
    priceInput.addEventListener('blur', () => {
      if (priceInput.value === '') return;
      
      priceInput.value = priceInput.value.replace(/^0+(?=\d)/, '');
    });
  }

  if (weightInput) {
    weightInput.addEventListener('input', onlyDigitsInputHandler);
    weightInput.addEventListener('keydown', onlyDigitsKeydownHandler);
    weightInput.addEventListener('paste', onlyDigitsPasteHandler);

    weightInput.addEventListener('blur', () => {
      if (weightInput.value === '') return;
      weightInput.value = weightInput.value.replace(/^0+(?=\d)/, '');
    });
  }

  // Submit handler — builds FormData, appends CSRF, and posts to add_meal.php.
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";
    }

    const category = categorySelect.value;
    const finalFileName = imgNameField.value;

    if (!isValidFilename(finalFileName)) {
      alert('Invalid file name.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Save"; }
      return;
    }


    let rawWeight = '';
    if (weightInput && weightInput.value !== '') {
      const parsedW = parseFloat(String(weightInput.value).replace(',', '.'));
      if (Number.isFinite(parsedW) && parsedW >= 0) {
        
        rawWeight = String(parsedW) + ' g';
      }
    }

    let priceNum = 0;
    const rawPrice = (document.getElementById("item-price") ? (document.getElementById("item-price").value || '') : '').toString().trim();
    if (rawPrice.length > 0) {
      const parsed = parseFloat(rawPrice.replace(',', '.'));
      if (Number.isFinite(parsed) && parsed >= 0) {
        priceNum = parsed;
      } else {
        priceNum = 0;
      }
    }
    

    const newDish = {
      id: idField.value,
      name: { eng: nameEngInput.value || '', cz: nameCzInput ? nameCzInput.value || '' : '' },
      description: {
        eng: document.getElementById("item-desc-eng") ? document.getElementById("item-desc-eng").value || '' : '',
        cz: document.getElementById("item-desc-cz") ? document.getElementById("item-desc-cz").value || '' : ''
      },
      price: String(priceNum) + " CZK",
      weight: rawWeight,
      image: `./img/menu-img/${category}/${finalFileName}`
    };

    const formData = new FormData();
    formData.append('category', category);
    formData.append('itemJson', JSON.stringify(newDish));
    formData.append('imageName', finalFileName);
    if (currentFileObject) formData.append('imageFile', currentFileObject);

    // Ensure CSRF token appended when CSRFManager is available.
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

      
      let result;
      try {
        result = await response.json();
      } catch (err) {
        
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
        alert("❌ Server error: " + (result && result.message ? result.message : 'Unknown'));
      }

    } catch (error) {
      console.error('JS error while sending add_meal:', error);
      alert('Server error — see console.');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Save"; }
    }
  });
  loadMenuData();
}