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
  const reservationSection = document.getElementById('reservation-section');
  const menuSection = document.querySelector('.menu-all');
  const menuImg3D = document.querySelector('.menu-3d-hero');
  const loginButton = document.querySelector('.login-btn');
  const logo = document.querySelector('.logo');
  const regestrationButton = document.querySelector('.form-regestration-div');

  const galleryBtn = $$('.gallery-btn');
  const reservationBtn = $$('.reservation-btn');
  const menuBtn = $$('.menu-btn');

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
    if (el.classList.contains('invisible')) return;

    el.style.opacity = 1;
    el.style.transition = 'opacity 0.5s ease';
    el.style.pointerEvents = 'none';
    el.style.opacity = 0;

    el.classList.remove('visible');
    el.classList.add('invisible');
    try {
      if (el === accountWrapper && el.querySelectorAll) {
        const inner = el.querySelectorAll('.personal-account-content');
        inner.forEach(child => { child.classList.remove('visible'); child.classList.add('invisible'); });
      }
    } catch (e) { }
  };

  const fadeIn = (el) => {
    if (!el) return;
    if (el.classList.contains('visible') && el.style.opacity !== '0') return;

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

  function showSection(sectionIdOrEl) {
    const secEl = (typeof sectionIdOrEl === 'string') ? document.getElementById(sectionIdOrEl) : sectionIdOrEl;
    if (!secEl) return;
    if (currentVisibleSection === secEl) return;

    const allSections = [mainContent, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection, menuSection].filter(Boolean);
    allSections.forEach(el => {
      if (el === secEl) fadeIn(el);
      else fadeOut(el);
    });
    currentVisibleSection = secEl;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { }
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

  const routes = {
    '': mainContent,
    '#about-us': mainContent,
    '#menu': menuSection,
    '#gallery': gallerySection,
    '#reservation': reservationSection,
    '#signin': formMain,
    '#register': loginFormSection,
    '#account': accountWrapper
  };

  async function handleRouting() {
    const hash = window.location.hash;
    let targetSection = routes[hash] || routes[''];

    if (!routes[hash] && hash.length > 1) {
      try {
        const possibleEl = document.querySelector(hash);
        if (possibleEl && possibleEl.tagName === 'SECTION') targetSection = possibleEl;
      } catch (e) { }
    }

    if (targetSection === menuSection) {
      set3DMenuInvisible(false);
      if (typeof window.loadMenu === 'function') {
        try { await window.loadMenu(); } catch (err) { console.warn('loadMenu failed:', err); }
      }
    } else {
      set3DMenuInvisible(true);
    }

    if (targetSection === accountWrapper && !isLoggedIn()) {
      if (window.location.hash !== '#signin') window.location.hash = '#signin';
      return;
    }
    if ((targetSection === formMain || targetSection === loginFormSection) && isLoggedIn()) {
      if (window.location.hash !== '#account') window.location.hash = '#account';
      return;
    }

    showSection(targetSection);

    if (hash === '#about-us' && targetSection === mainContent) {
      setTimeout(() => {
        const aboutSection = document.getElementById('about-us');
        if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
      }, 600);
    }
  }

  window.addEventListener('hashchange', handleRouting);

  if (loginButton) safeAdd(loginButton, 'click', (e) => {
    e.preventDefault();
    window.location.hash = isLoggedIn() ? '#account' : '#signin';
  });
  if (regestrationButton) safeAdd(regestrationButton, 'click', (e) => {
    e.preventDefault();
    window.location.hash = '#register';
  });
  if (logo) safeAdd(logo, 'click', (e) => {
    e.preventDefault();
    history.pushState("", document.title, window.location.pathname + window.location.search);
    handleRouting();
  });
  [mainContent, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection].filter(Boolean).forEach(el => safeAdd(el, 'click', () => set3DMenuInvisible(true)));




  (async () => {
    try {
      if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
        safeCall(() => window.CSRFManager.init().catch(err => console.warn('CSRFManager init failed:', err)));
      }

      [menuSection, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection].filter(Boolean).forEach(el => {
        el.classList.remove('visible');
        el.classList.add('invisible');
      });

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
            window._autoLoginDone = true;
          }
        }
      } catch (err) { console.error('[check_session] error', err); }

      if (!window.__switchVisibilityRegisteredOnLogin) {
        const handler = async (user) => {
          if (window._autoLoginDone) return;
          setLoggedIn(true);
          await updateLoginLabel();


          window.location.hash = '#account';


          if (user) {
            window.user = user;
            if (typeof window.initPersonalAccount === 'function') {
              try { await safeCall(window.initPersonalAccount, user); } catch (err) { console.warn('initPersonalAccount failed', err); }
            }
          }
        };
        const prev = typeof window.onLoginOrRegister === 'function' ? window.onLoginOrRegister : null;
        window.onLoginOrRegister = async function (user) {
          try { if (typeof prev === 'function') safeCall(prev, user); } catch (e) { console.warn(e); }
          try { await handler(user); } catch (e) { console.warn('handler error', e); }
        };
        window.__switchVisibilityRegisteredOnLogin = true;
      }

      if (window.AuthManager && typeof window.AuthManager.attachLogoutButton === 'function') {
        try { window.AuthManager.attachLogoutButton('.logout-account-btn'); } catch (e) { }
      }


      await handleRouting();


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
      if (!window.translatePersonalAccount) window.translatePersonalAccount = async (root) => { };
    }
  } catch (e) { }

  window.switchVisibility = { showSection, set3DMenuInvisible, updateLoginLabel, makeVisible, makeInvisible };
}