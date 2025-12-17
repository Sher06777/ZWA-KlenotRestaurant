// switch-language.js
export async function initI18n() {
  const DEFAULT_LANG = 'eng';
  const STORAGE_KEY = 'site_lang';
  const TRANSLATIONS_BASE = 'i18n/';
  const FILE_BY_LANG = (lang) => `${TRANSLATIONS_BASE}${lang}.json`;

  const cache = {};

  function getSavedLang() { try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; } catch (e) { return DEFAULT_LANG; } }
  function saveLang(lang) { try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ } }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  async function loadDict(lang) {
    if (cache[lang]) return cache[lang];
    const path = FILE_BY_LANG(lang);
    try {
      const json = await fetchJson(path);
      cache[lang] = json;
      return json;
    } catch (err) {
      console.error('i18n: cannot load', path, err);
      if (lang !== DEFAULT_LANG) return loadDict(DEFAULT_LANG);
      throw err;
    }
  }

  function lookup(dict, keyPath) {
    if (!keyPath) return undefined;
    const parts = keyPath.split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else return undefined;
    }
    return cur;
  }

  function applyText(el, text) {
    if (text == null) return;
    try {
      const firstSpan = el.querySelector && el.querySelector('span');
      if (firstSpan && el.hasAttribute('data-i18n')) {
        firstSpan.textContent = text;
        return;
      }
    } catch (e) {}
    el.textContent = text;
  }

  function applyDictToDOM(dict) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = lookup(dict, key);
      if (value != null) applyText(el, value);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = lookup(dict, key);
      if (value != null) el.setAttribute('placeholder', value);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-alt');
      const value = lookup(dict, key);
      if (value != null) el.setAttribute('alt', value);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const value = lookup(dict, key);
      if (value != null) el.setAttribute('title', value);
    });
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      const key = el.getAttribute('data-i18n-value');
      const value = lookup(dict, key);
      if (value != null) el.value = value;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const value = lookup(dict, key);
      if (value != null) el.setAttribute('aria-label', value);
    });
  }

  async function setLanguage(lang) {
    if (!lang) lang = DEFAULT_LANG;
    try {
      const dict = await loadDict(lang);
      applyDictToDOM(dict);
      saveLang(lang);
      window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
      updateLangButtonsUI(lang);
      console.info(`i18n: language set to ${lang}`);
      return dict;
    } catch (err) {
      console.error('i18n: failed to set language', err);
      return null;
    }
  }

  function initLangButtons() {
    const dataLangBtns = Array.from(document.querySelectorAll('[data-lang]'));

    dataLangBtns.forEach(btn => {
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', btn.getAttribute('tabindex') || '0');
      btn.addEventListener('click', (e) => { e.preventDefault(); const chosen = btn.getAttribute('data-lang'); if (chosen) setLanguage(chosen); });
      btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const chosen = btn.getAttribute('data-lang'); if (chosen) setLanguage(chosen); } });
    });

    document.querySelectorAll('.lang-eng').forEach(btn => btn.addEventListener('click', (e)=>{ e.preventDefault(); setLanguage('en'); }));
    document.querySelectorAll('.lang-cz').forEach(btn => btn.addEventListener('click', (e)=>{ e.preventDefault(); setLanguage('cz'); }));

    updateLangButtonsUI(getSavedLang());
  }

  function updateLangButtonsUI(activeLang) {
    document.querySelectorAll('[data-lang]').forEach(el => el.classList.toggle('active-i18n', el.getAttribute('data-lang') === activeLang));
    document.querySelectorAll('.lang-eng').forEach(el => el.classList.toggle('active-i18n', activeLang === 'en'));
    document.querySelectorAll('.lang-cz').forEach(el => el.classList.toggle('active-i18n', activeLang === 'cz'));
  }

  // expose API
  window.i18n = {
    setLanguage,
    getLang: getSavedLang,
    _loadDict: loadDict,
    _cache: cache
  };

  // init on call
  try {
    initLangButtons();
    const lang = getSavedLang() || DEFAULT_LANG;
    await setLanguage(lang);
  } catch (e) {
    console.warn('i18n init failed', e);
  }
}
