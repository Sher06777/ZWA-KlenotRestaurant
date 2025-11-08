// menu.js — устойчивая версия для SPA + i18n
let menuData = {};         // загруженные данные из data/menu.json
let currentFilter = 'all'; // текущее правило фильтрации (ключ JSON или 'all')
let currentLang = 'eng';   // текущий язык (используется как ключ в name/description)

function normKey(s) {
  if (!s && s !== 0) return '';
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function pickLocalizedText(field, lang) {
  if (field == null) return '';
  if (typeof field === 'object') {
    // поддерживаем варианты: eng/cz
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
    return raw; // e.g. 'eng'
  }
  return currentLang || 'eng';
}

/**
 * Загрузка меню (глобально видимая функция)
 */
async function loadMenu() {
  try {
    const res = await fetch('data/menu.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Ошибка загрузки menu.json: ' + res.status);
    menuData = await res.json();

    // Получаем текущий язык из i18n если есть
    currentLang = pickLanguageFromI18n();

    // Рендерим (если currentFilter установлен — он сохранится)
    renderMenu(menuData, currentLang, currentFilter);

    // Настраиваем обработчики кнопок (один раз; безопасно вызвать несколько раз)
    setupMenuFilters();
  } catch (err) {
    console.error('menu.js: loadMenu error', err);
  }
}

/**
 * Рендер меню
 * data — объект вида { "Category Name": [items], ... }
 * lang — 'eng' / 'cz' и т.д.
 * filter — 'all' или конкретный ключ (логика сравнения нормализует)
 */
function renderMenu(data, lang = 'eng', filter = 'all') {
  const container = document.querySelector('.menu-items');
  if (!container) {
    console.error('menu.js: .menu-items container not found');
    return;
  }
  container.innerHTML = '';

  const template = document.getElementById('menu-item-template');
  if (!template) {
    console.error('menu.js: #menu-item-template not found');
    return;
  }

  const wantedNorm = filter === 'all' ? null : normKey(filter);

  Object.entries(data).forEach(([categoryKey, items]) => {
    const categoryNorm = normKey(categoryKey);

    if (wantedNorm && categoryNorm !== wantedNorm) {
      // не та категория
      return;
    }

    if (!Array.isArray(items)) return;

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
        img.src = item.image || '';
        img.alt = pickLocalizedText(item.name || item.title || '', lang) || '';
      }
      if (titleEl) titleEl.textContent = pickLocalizedText(item.name || item.title || '', lang);
      if (descEl) descEl.textContent = pickLocalizedText(item.description || item.desc || '', lang);
      if (priceEl) priceEl.textContent = item.price || '';
      if (weightEl) weightEl.textContent = item.weight || '';

      container.appendChild(clone);
    });
  });
}

/**
 * Установка обработчиков фильтрующих кнопок
 * — кнопки должны иметь data-filter
 * — data-filter может быть коротким alias (salads/mains) или точным ключом JSON
 */
function setupMenuFilters() {
  const buttons = Array.from(document.querySelectorAll('.menu-button'));
  if (!buttons.length) return;

  // если currentFilter === 'all' — попробуем найти кнопку active, иначе синхронизируем UI
  const activeBtn = buttons.find(b => b.classList.contains('active'));
  if (activeBtn) {
    const raw = (activeBtn.dataset.filter || 'all').toLowerCase();
    currentFilter = mapFilterToCategory(raw);
  } else {
    // если нет активной кнопки — пометим первую как active
    buttons.forEach((b, i) => b.classList.toggle('active', i === 0));
    currentFilter = mapFilterToCategory((buttons[0] && buttons[0].dataset.filter) || 'all');
  }

  // подписка на клики
  buttons.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  const freshButtons = Array.from(document.querySelectorAll('.menu-button'));
  freshButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      freshButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const raw = (btn.dataset.filter || 'all').toLowerCase();
      currentFilter = mapFilterToCategory(raw);

      // подхватываем текущий язык (на случай, если сменили язык)
      currentLang = pickLanguageFromI18n();

      renderMenu(menuData, currentLang, currentFilter);
    });
  });
}

/**
 * Попытка перевести data-filter в ключ menu.json.
 * Логика:
 *  - если filterValue === 'all' => 'all'
 *  - если среди ключей menuData есть точный (case-insensitive) => возвращаем его
 *  - иначе ищем совпадение по нормализованной строке
 *  - иначе возвращаем исходное значение (может совпасть при рендере если ключ JSON совпадёт)
 */
function mapFilterToCategory(filterValue) {
  if (!filterValue) return 'all';
  if (filterValue === 'all') return 'all';

  // Попробуем точное совпадение ключа (case-insensitive)
  const keys = Object.keys(menuData || {});
  const lower = filterValue.toLowerCase();
  const exact = keys.find(k => k.toLowerCase() === lower);
  if (exact) return exact;

  // Сопоставление по нормализованной форме
  const targetNorm = normKey(filterValue);
  const found = keys.find(k => normKey(k) === targetNorm);
  if (found) return found;

  // Если ничего не найдено — возвращаем исходное (рендер попытается использовать его)
  return filterValue;
}

/**
 * Подписка на смену языка (вызывается i18n:changed event)
 */
document.addEventListener('DOMContentLoaded', () => {
  // когда i18n поменяет язык — перерендерим меню
  window.addEventListener('i18n:changed', (e) => {
    const lang = (e && e.detail && e.detail.lang) ? e.detail.lang : pickLanguageFromI18n();
    // нормализуем en->eng
    currentLang = (lang === 'en') ? 'eng' : lang;
    if (Object.keys(menuData).length) {
      renderMenu(menuData, currentLang, currentFilter);
    }
  });

  // Если i18n уже загружен и вызвал setLanguage до нас, pickLanguageFromI18n корректно вернёт значение.
});
