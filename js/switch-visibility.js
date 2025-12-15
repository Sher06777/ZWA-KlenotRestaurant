import { hideAdminTables } from './account.js';
export function initSwitchVisibility({ autoCheckSession = false } = {}) {
  const $ = (sel, root = document) => root ? root.querySelector(sel) : null;
  const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel || ''));
  const safeCall = (fn, ...args) => { try { return fn && fn(...args); } catch (e) { console.error(e); } };

  const mainContent = document.getElementById('main');
  const gallerySection = document.getElementById('gallery-section');
  const formMain = document.querySelector('.form-main');
  const loginFormSection = document.querySelector('.login-form-section');
  const accountWrapper = document.getElementById('account-wrapper');
  const personalAccount = document.getElementById('personal-account');
  const header = document.getElementById('dropped-menu');
  const footer = document.querySelector('footer');
  const logo = document.querySelector('.logo');
  const loginButton = document.querySelector('.login-btn');
  const galleryBtn = $$('.gallery-btn');
  const regestrationButton = document.querySelector('.form-regestration-div');
  const reservationSection = document.getElementById('reservation-section');
  const reservationBtn = $$('.reservation-btn');
  const menuBtn = $$('.menu-btn');
  const menuSection = document.querySelector('.menu-all');
  const menuImg3D = document.querySelector('.menu-3d-hero');
  const menuCard = document.querySelector('.menu-items');

  let currentLanguage = localStorage.getItem('site_lang') || 'eng';
  let currentVisibleSection = null;

  if (!window.__switchVisibilityBoundUserEvent) {
    window.addEventListener('user:loggedin', async (ev) => {
      try {
        const user = ev && ev.detail ? ev.detail : window.user;
        if (!user) return;
        if (typeof window.onLoginOrRegister === 'function') {
          try { await window.onLoginOrRegister(user); } catch (e) { console.warn('user:loggedin handler error', e); }
        }
      } catch (err) { console.warn('user:loggedin event processing failed', err); }
    });
    window.__switchVisibilityBoundUserEvent = true;
  }

  async function getTranslation(key) {
    try {
      const lang = (window.i18n && typeof window.i18n.getLang === 'function')
        ? window.i18n.getLang()
        : (localStorage.getItem('site_lang') || 'eng');

      const loader = window.i18n && window.i18n._loadDict;
      const dict = loader ? await safeCall(window.i18n._loadDict, lang) : (window.i18n && window.i18n.dict ? window.i18n.dict : null);

      if (!dict) return null;
      const parts = String(key || '').split('.');
      let cur = dict;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
        else { cur = undefined; break; }
      }
      return cur == null ? null : String(cur);
    } catch (err) { console.error('getTranslation error', err); return null; }
  }

  async function updateLoginLabel() {
    const loginTextEl = document.querySelector('.login-btn .login-text');
    if (!loginTextEl) return;

    const key = isLoggedIn() ? 'main.menu-account-short' : 'main.menu-signin-button';
    loginTextEl.setAttribute('data-i18n', key);

    const txt = await getTranslation(key);
    if (txt) loginTextEl.textContent = txt;
  }

  async function translateElement(el, key) {
    if (!el || !key) return;
    el.setAttribute('data-i18n', key);
    const txt = await getTranslation(key);
    if (txt) el.textContent = txt;
  }

  const fadeOut = (el, callback) => {
    if (!el) return;
    el.style.opacity = 1;
    el.style.transition = 'opacity 0.5s ease';
    el.style.pointerEvents = 'none';
    el.style.opacity = 0;

    el.classList.remove('visible');
    el.classList.add('invisible');

    if (callback) setTimeout(callback, 500); 
  };

  const fadeIn = (el) => {
    if (!el) return;
    el.classList.remove('invisible');
    el.classList.add('visible');
    el.style.opacity = 0;

    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = 1;
      el.style.pointerEvents = 'auto';
    });
  };

  window.updateLoginLabel = updateLoginLabel;

  let loggedIn = false;
  function setLoggedIn(status) { loggedIn = !!status; }
  function isLoggedIn() { return !!loggedIn; }
  window.setLoggedIn = setLoggedIn;
  window.isLoggedIn = isLoggedIn;

  function showSection(section) {
    const secEl = (typeof section === 'string') ? document.getElementById(section) : section;
    if (!secEl) { console.warn('[VIS] showSection: target not found', section); return; }
    if (currentVisibleSection === secEl) {
      console.log('[VIS] showSection ignored (same section):', secEl.id || secEl.className);
      return;
    }
    const allSections = [mainContent, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection, menuSection].filter(Boolean);
    allSections.forEach(el => {
      if (el === secEl) fadeIn(el);
      else fadeOut(el);
    });
    currentVisibleSection = secEl;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }

  function set3DMenuInvisible(value) {
    if (!menuImg3D) return;
    if (value) {
      menuImg3D.classList.add('invisible');
      if (window.menu3D && typeof window.menu3D.stop === 'function') safeCall(window.menu3D.stop);
    } else {
      menuImg3D.classList.remove('invisible');
      if (window.menu3D && typeof window.menu3D.start === 'function') safeCall(window.menu3D.start);
    }
  }
  window.set3DMenuInvisible = set3DMenuInvisible;

  function makeVisible(el) { if (!el) return; el.classList.remove('invisible'); el.classList.add('visible'); currentVisibleSection = el; }
  function makeInvisible(el) { if (!el) return; el.classList.remove('visible'); el.classList.add('invisible'); if (currentVisibleSection === el) currentVisibleSection = null; }

  function safeAdd(el, event, handler, opts) {
    if (!el || typeof handler !== 'function') return null;
    el.addEventListener(event, handler, opts);
    return () => el.removeEventListener(event, handler, opts);
  }

  
  (async () => {
    try {
      if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
        safeCall(() => window.CSRFManager.init().catch(err => console.warn('CSRFManager init failed in switch-visibility:', err)));
      }
      if (mainContent) { fadeIn(mainContent); currentVisibleSection = mainContent; }
      [menuSection, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection].filter(Boolean).forEach(makeInvisible);

      galleryBtn.forEach(btn => safeAdd(btn, 'click', (e) => { e.stopPropagation(); e.preventDefault(); showSection(gallerySection); set3DMenuInvisible(true); }));

      if (logo) safeAdd(logo, 'click', (e) => { e.preventDefault(); showSection(mainContent); set3DMenuInvisible(true); });

      if (loginButton) safeAdd(loginButton, 'click', async (e) => {
        e.preventDefault();
        if (isLoggedIn()) {
          
          if (accountWrapper) showSection(accountWrapper);

          try {
            // Найдём контейнеры админских таблиц
            const adminRes = document.getElementById('admin-reservations-container');
            const adminUsers = document.getElementById('admin-users-content');

            // Функция-помощник: считаем элемент "видимым" если он в документе и не display: none
            const isVisible = (el) => !!(el && el.offsetParent !== null && getComputedStyle(el).display !== 'none');

            const adminResVisible = isVisible(adminRes);
            const adminUsersVisible = isVisible(adminUsers) && (adminUsers.innerHTML || '').trim() !== '';

            if (adminResVisible || adminUsersVisible) {
              // 1) спрячем админ-таблицы (та же логика, что у Personal Account Buttons)
              try { if (typeof hideAdminTables === 'function') hideAdminTables(); } catch (e) { console.warn('hideAdminTables failed:', e); }

              // 2) аккуратно восстановим "обычную" высоту
              const pa = document.getElementById('personal-account');
              if (pa) {
                // убираем только те inline-стили, которые могли растянуть контейнер
                pa.style.height = '800px';
                pa.style.maxHeight = '';
                pa.style.width = '';
                // если нужно жёстко перекрыть внешние правила:
                // pa.style.setProperty('height', '800px', 'important');
              }
            }
          } catch (err) {
            console.warn('personal-account restore on login click failed', err);
          }

          
          if (window.user && typeof window.initPersonalAccount === 'function') {
            try { await safeCall(window.initPersonalAccount, window.user); } catch (err) { console.warn('initPersonalAccount on profile click failed', err); }
          }

          
          await updateLoginLabel();
        } else {
          showSection(formMain);
          await updateLoginLabel();
        }
        set3DMenuInvisible(true);
      });

      reservationBtn.forEach(btn => safeAdd(btn, 'click', (e) => { e.stopPropagation(); e.preventDefault(); showSection(reservationSection); set3DMenuInvisible(true); }));

      menuBtn.forEach(btn => safeAdd(btn, 'click', async (e) => {
        e.stopPropagation(); e.preventDefault(); showSection(menuSection); set3DMenuInvisible(false);
        if (typeof window.loadMenu === 'function') { try { await window.loadMenu(); } catch (err) { console.warn('loadMenu failed:', err); } }
      }));

      if (regestrationButton) safeAdd(regestrationButton, 'click', (e) => { e.preventDefault(); showSection(loginFormSection); set3DMenuInvisible(true); });

      if (!window.__switchVisibilityRegisteredOnLogin) {
        const handler = async (user) => {
          if (window._autoLoginDone) return;
          setLoggedIn(true);
          await updateLoginLabel();

          
          if (accountWrapper) showSection(accountWrapper);

          
          if (user) {
            window.user = user;
            if (typeof window.initPersonalAccount === 'function') {
              try { await safeCall(window.initPersonalAccount, user); } catch (err) { console.warn('onLoginOrRegister initPersonalAccount failed', err); }
            }
          }

          set3DMenuInvisible(true);
        };
        const prev = typeof window.onLoginOrRegister === 'function' ? window.onLoginOrRegister : null;
        window.onLoginOrRegister = async function (user) {
          try { if (typeof prev === 'function') safeCall(prev, user); } catch (e) { console.warn(e); }
          try { await handler(user); } catch (e) { console.warn('onLoginOrRegister handler error', e); }
        };
        window.__switchVisibilityRegisteredOnLogin = true;
      }

      try {
        if (autoCheckSession) {
          const res = await fetch('./php/check_session.php', { credentials: 'include' });
          const data = await (res.json().catch(() => ({})));
          if (data.loggedIn && data.user) {
            const user = { id: data.user.id || data.user.user_id || null, name: data.user.name || '', email: data.user.email || '' };
            window.user = user;
            if (typeof window.initPersonalAccount === 'function') safeCall(window.initPersonalAccount, user);
            setLoggedIn(true);
            await updateLoginLabel();
            showSection(mainContent);
            window._autoLoginDone = true;
          }
        }
      } catch (err) { console.error('[check_session] error', err); }

      if (window.AuthManager && typeof window.AuthManager.attachLogoutButton === 'function') {
        try { window.AuthManager.attachLogoutButton('.logout-account-btn'); } catch (e) { console.warn('AuthManager.attachLogoutButton failed', e); }
      }

      const aboutUsLink = document.querySelector('a[href="#about-us"]');
      const aboutUsSection = document.getElementById('about-us');
      if (aboutUsLink && aboutUsSection) {
        safeAdd(aboutUsLink, 'click', async (e) => {
          e.preventDefault();
          showSection(mainContent);
          set3DMenuInvisible(true);
          await new Promise(r => setTimeout(r, 600));
          aboutUsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      [mainContent, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection].filter(Boolean).forEach(el => safeAdd(el, 'click', () => set3DMenuInvisible(true)));
    } catch (err) {
      console.warn('switch-visibility init failed', err);
    }
  })();

  try {
    
    if (typeof window !== 'undefined') {
      if (!window.fadeIn) window.fadeIn = fadeIn;
      if (!window.fadeOut) window.fadeOut = fadeOut;
      if (!window.getTranslation) window.getTranslation = getTranslation;
      if (!window.translateElement) window.translateElement = translateElement;
      
      if (!window.translatePersonalAccount) window.translatePersonalAccount = async (root) => {
        try {
          if (!root) return;
          const els = root.querySelectorAll && root.querySelectorAll('[data-i18n]');
          if (!els) return;
          for (const el of els) {
            const key = el.getAttribute && el.getAttribute('data-i18n');
            if (key && typeof window.getTranslation === 'function') {
              const txt = await window.getTranslation(key);
              if (txt) el.textContent = txt;
            }
          }
        } catch (e) { }
      };
    }
  } catch (e) {
    console.warn('switch-visibility: failed to attach compatibility shims', e);
  }

  
  window.switchVisibility = { showSection, set3DMenuInvisible, updateLoginLabel, makeVisible, makeInvisible };
}
