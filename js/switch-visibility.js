// switch-visibility.js — безопасная, устойчиво-анимированная логика SPA (updated)

const $ = (sel, root = document) => root ? root.querySelector(sel) : null;
const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel || ''));
const safeCall = (fn, ...args) => { try { return fn && fn(...args); } catch (e) { console.error(e); } };

const mainContent = document.getElementById('main');
const gallerySection = document.getElementById('gallery-section');
const formMain = document.querySelector('.form-main');
const loginFormSection = document.querySelector('.login-form-section');
const personalAccount = document.querySelector('.main-content-wrapper');
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

if (!mainContent) console.warn('switch-visibility: #main not found');
if (!menuSection) console.warn('switch-visibility: .menu-all not found');
if (!formMain) console.warn('switch-visibility: .form-main not found');

// если кто-то ранее зарегистрировал onLoginOrRegister — не затираем
window.onLoginOrRegister = window.onLoginOrRegister || function () { /* noop until handler registered */ };

// И добавим слушатель события (внутри DOMContentLoaded или в глобальной инициализации)
window.addEventListener('user:loggedin', async (ev) => {
  try {
    const user = ev && ev.detail ? ev.detail : window.user;
    if (!user) return;
    // вызов основной логики входа (она уже обёрнута/добавлена в window.onLoginOrRegister)
    if (typeof window.onLoginOrRegister === 'function') {
      try { await window.onLoginOrRegister(user); } catch (e) { console.warn('user:loggedin handler error', e); }
    }
  } catch (err) {
    console.warn('user:loggedin event processing failed', err);
  }
});

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
  } catch (err) {
    console.error('getTranslation error', err);
    return null;
  }
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

const fadeOut = (el) => {
  if (!el) return;
  el.style.opacity = 1;
  el.style.transition = 'opacity 0.5s ease';
  el.style.pointerEvents = 'none';
  el.style.opacity = 0;

  el.classList.remove('visible');
  el.classList.add('invisible');

};

function fadeIn(el) {
  if (!el) return;
  el.classList.remove('invisible');
  el.classList.add('visible');
  el.style.opacity = '0';
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });
}

window.updateLoginLabel = updateLoginLabel;

let loggedIn = false;
function setLoggedIn(status) {
  loggedIn = !!status;
}
function isLoggedIn() {
  return !!loggedIn;
}
window.setLoggedIn = setLoggedIn;
window.isLoggedIn = isLoggedIn;

function showSection(section) {
  const allSections = [mainContent, gallerySection, formMain, loginFormSection, personalAccount, reservationSection, menuSection]
    .filter(Boolean);

  allSections.forEach(el => {
    if (el === section) fadeIn(el);
    else fadeOut(el);
  });

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

function makeVisible(el) { if (!el) return; el.classList.remove('invisible'); el.classList.add('visible'); }
function makeInvisible(el) { if (!el) return; el.classList.remove('visible'); el.classList.add('invisible'); }

function safeAdd(el, event, handler, opts) {
  if (!el || typeof handler !== 'function') return null;
  el.addEventListener(event, handler, opts);
  return () => el.removeEventListener(event, handler, opts);
}

document.addEventListener('DOMContentLoaded', async () => {
  const logoutButton = document.querySelector('.logout-account-btn');

  if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
    safeCall(() => window.CSRFManager.init().catch(err => console.warn('CSRFManager init failed in switch-visibility:', err)));
  }

  if (mainContent) fadeIn(mainContent);
  [menuSection, gallerySection, formMain, loginFormSection, personalAccount, reservationSection]
    .filter(Boolean)
    .forEach(makeInvisible);

  galleryBtn.forEach(btn => safeAdd(btn, 'click', (e) => {
    e.stopPropagation(); e.preventDefault();
    showSection(gallerySection);
    set3DMenuInvisible(true);
  }));

  if (logo) safeAdd(logo, 'click', (e) => {
    e.preventDefault();
    showSection(mainContent);
    set3DMenuInvisible(true);
  });

  if (loginButton) safeAdd(loginButton, 'click', async (e) => {
    e.preventDefault();
    if (isLoggedIn()) {
      showSection(personalAccount);
      await updateLoginLabel();
    } else {
      showSection(formMain);
      await updateLoginLabel();
    }
    set3DMenuInvisible(true);
  });

  reservationBtn.forEach(btn => safeAdd(btn, 'click', (e) => {
    e.stopPropagation(); e.preventDefault();
    showSection(reservationSection);
    set3DMenuInvisible(true);
  }));

  menuBtn.forEach(btn => safeAdd(btn, 'click', async (e) => {
    e.stopPropagation(); e.preventDefault();
    showSection(menuSection);
    set3DMenuInvisible(false);
    if (typeof window.loadMenu === 'function') {
      try { await window.loadMenu(); } catch (err) { console.warn('loadMenu failed:', err); }
    }
  }));

  if (regestrationButton) safeAdd(regestrationButton, 'click', (e) => {
    e.preventDefault();
    showSection(loginFormSection);
    set3DMenuInvisible(true);
  });

  // Если кто-то ещё не установил onLoginOrRegister — регистрируем наш обработчик.
  // Но не переписываем, если уже есть логика.
  if (!window.__switchVisibilityRegisteredOnLogin) {
    const handler = async (user) => {
      // если это автологин — пропускаем (мы его обрабатываем отдельно ниже)
      if (window._autoLoginDone) return;
      setLoggedIn(true);
      await updateLoginLabel();
      if (user) {
        window.user = user;
        if (typeof window.initPersonalAccount === 'function') safeCall(window.initPersonalAccount, user);
      }
      // Закрываем форму входа и показываем personalAccount
      if (personalAccount) showSection(personalAccount);
      set3DMenuInvisible(true);
    };

    // Если ранее было что-то присвоено — дополняем цепочку: сначала старое, затем наше.
    const prev = typeof window.onLoginOrRegister === 'function' ? window.onLoginOrRegister : null;
    window.onLoginOrRegister = async function (user) {
      try { if (typeof prev === 'function') safeCall(prev, user); } catch (e) { console.warn(e); }
      try { await handler(user); } catch (e) { console.warn('onLoginOrRegister handler error', e); }
    };
    window.__switchVisibilityRegisteredOnLogin = true;
  }

  // Если вход уже произошёл до загрузки этого скрипта (signin.js установил window.user),
  // то сразу обработаем это состояние: закроем форму и откроем аккаунт.
  try {
    if (window.user && !isLoggedIn()) {
      // Вызовим наш onLoginOrRegister безопасно (передадим user).
      if (typeof window.onLoginOrRegister === 'function') {
        await window.onLoginOrRegister(window.user);
      }
    }
  } catch (e) {
    console.warn('post-init login handling failed', e);
  }

  [mainContent, gallerySection, formMain, loginFormSection, personalAccount, reservationSection]
    .filter(Boolean).forEach(el => safeAdd(el, 'click', () => set3DMenuInvisible(true)));

  // Инициализация сохранения входа в акаунт (проверка сессии)
  try {
    if (mainContent && typeof window.fetch === 'function') {
      const res = await fetch('./php/check_session.php', { credentials: 'include' });
      const data = await (res.json().catch(() => ({})));
      if (data.loggedIn && data.user) {
        const user = { name: data.user.name || '', email: data.user.email || '' };
        window.user = user;
        if (typeof window.initPersonalAccount === 'function') safeCall(window.initPersonalAccount, user);
        setLoggedIn(true);
        await updateLoginLabel();
        showSection(mainContent);
        window._autoLoginDone = true;
      }
    }
  } catch (err) {
    console.error('[check_session] error', err);
  }

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
});

document.addEventListener('i18n:changed', async (ev) => {
  const newLang = (window.i18n && typeof window.i18n.getLang === 'function') ? window.i18n.getLang() : currentLanguage;
  if (newLang === currentLanguage) return;
  currentLanguage = newLang;
  await updateLoginLabel();
});

window.switchVisibility = {
  showSection,
  set3DMenuInvisible,
  updateLoginLabel,
  makeVisible,
  makeInvisible
};
