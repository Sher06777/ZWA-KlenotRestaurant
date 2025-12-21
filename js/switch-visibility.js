export function initSwitchVisibility({ autoCheckSession = true } = {}) {
  // Safe caller
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

  let currentVisibleSection = null;
  let accountInitialized = false;

  // ensure user:loggedin handler bound once
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

  // load translation dictionary and lookup by dot-path
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

  // fade helpers — kept intentionally simple and relied upon by other modules
  const fadeOut = (el) => {
    if (!el) return;
    if (el.classList.contains('invisible')) {
      el.style.display = 'none';
      return;
    }

    el.style.opacity = 1;
    el.style.transition = 'opacity 0.5s ease';
    el.style.pointerEvents = 'none';

    el.style.position = 'absolute';
    el.style.left = '-9999px';

    el.style.opacity = 0;
    el.classList.remove('visible');
    el.classList.add('invisible');

    setTimeout(() => {
      if (el.classList.contains('invisible')) {
        el.style.display = 'none';
        el.style.position = '';
        el.style.left = '';
      }
    }, 500);
  };

  function fadeIn(el) {
    if (!el) return;
    el.style.display = '';
    if (el.classList.contains('visible') && el.style.opacity !== '0') return;
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
  let isInitialLoad = true;
  function setLoggedIn(status) { loggedIn = !!status; }
  function isLoggedIn() { return !!loggedIn; }
  let authChecked = false;
  function isAuthChecked() { return authChecked; }

  window.setLoggedIn = setLoggedIn;
  window.isLoggedIn = isLoggedIn;

  // show a top-level section and hide others
  function showSection(sectionIdOrEl) {
    const secEl = (typeof sectionIdOrEl === 'string') ? document.getElementById(sectionIdOrEl) : sectionIdOrEl;
    if (!secEl) return;
    if (currentVisibleSection === secEl) return;

    const allSections = [
      mainContent,
      gallerySection,
      formMain,
      loginFormSection,
      accountWrapper,
      reservationSection,
      menuSection,
      document.getElementById('not-found')
    ].filter(Boolean);

    allSections.forEach(el => {
      if (el === secEl) {
        // show target section (do not change fadeIn implementation)
        fadeIn(el);
      } else {
        // hide others
        fadeOut(el);

        // when hiding account wrapper ensure all inner personal-account-content
        // are set to invisible so no inner block remains erroneously marked visible
        try {
          if (el === accountWrapper && accountWrapper instanceof Element) {
            const inner = accountWrapper.querySelectorAll('.personal-account-content');
            inner.forEach(ch => {
              ch.classList.remove('visible');
              ch.classList.add('invisible');
              // make sure element does not affect layout; safe fallback
              try { ch.style.display = 'none'; } catch (_) {}
            });
          }
        } catch (err) {
          console.warn('showSection: failed to sanitize account inner blocks', err);
        }
      }
    });

    currentVisibleSection = secEl;
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { }
  }

  // toggle 3D menu visibility
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
    '#about-us': mainContent,
    '#menu': menuSection,
    '#gallery': gallerySection,
    '#reservation': reservationSection,
    '#signin': formMain,
    '#register': loginFormSection,
    '#account': accountWrapper
  };

  async function handleRouting() {
    console.group('🔀 handleRouting');
    const hash = window.location.hash;
    const path = window.location.pathname;
    const BASE_PATH = '/~achilkem/';

    console.log('Path:', path);
    console.log('Hash:', hash);

    if (isInitialLoad && !authChecked) {
      console.warn('⏳ WAIT auth check (forced)');
      console.groupEnd();
      return;
    }

    let targetSection = null;

    const isBadPath = path !== BASE_PATH && path !== BASE_PATH + 'index.html';

    if (isBadPath) {
      console.warn('🚀 Bad Path detected (Server 404)');
      targetSection = document.getElementById('not-found');
    } else {
      targetSection = routes[hash];

      if (!targetSection && hash.length > 1) {
        try {
          const possibleEl = document.querySelector(hash);
          if (possibleEl && possibleEl.tagName === 'SECTION') targetSection = possibleEl;
        } catch (e) { }
      }

      if (!targetSection && hash.length > 1) {
        console.warn('⚠️ Bad Hash detected (Client 404)');
        targetSection = document.getElementById('not-found');
      }
    }

    if (!targetSection) {
      targetSection = mainContent;
    }

    if (!isLoggedIn() && targetSection === accountWrapper) {
      if (window.location.hash !== '#signin') {
        window.location.hash = '#signin';
        console.groupEnd();
      }
      return;
    }

    if (isLoggedIn() && (targetSection === formMain || targetSection === loginFormSection)) {
      if (window.location.hash !== '#account') window.location.hash = '#account';
      console.groupEnd();
      return;
    }

    if (targetSection === menuSection) {
      set3DMenuInvisible(false);
      if (typeof window.loadMenu === 'function') {
        try { await window.loadMenu(); } catch (err) { }
      }
    } else {
      set3DMenuInvisible(true);
    }

    showSection(targetSection);

    if (targetSection === accountWrapper && isLoggedIn()) {
      if (typeof window.initPersonalAccount === 'function') {
        await window.initPersonalAccount(window.user);
        if (typeof showAccountBlock === 'function') {
          const datesContent = document.querySelector('.personal-account-content.dates');
          showAccountBlock(datesContent);
        }
      }
    }

    console.log('✅ Final showSection:', targetSection?.id || targetSection?.className);
    console.groupEnd();

    if (hash === '#about-us' && targetSection === mainContent) {
      setTimeout(() => {
        const aboutSection = document.getElementById('about-us');
        if (aboutSection) aboutSection.scrollIntoView({ behavior: 'smooth' });
      }, 600);
    }
  }

  window.addEventListener('hashchange', () => {
    if (!authChecked) {
      console.warn('⏳ hashchange ignored (auth not ready)');
      return;
    }
    handleRouting();
  });

  if (loginButton) safeAdd(loginButton, 'click', (e) => {
    e.preventDefault();
    window.location.hash = isLoggedIn() ? '#account' : '#signin';
  });
  if (regestrationButton) safeAdd(regestrationButton, 'click', (e) => {
    e.preventDefault();
    window.location.hash = '#register';
  });
  if (logo) safeAdd(logo, 'click', async (e) => {
    e.preventDefault();
    if (window.location.hash === '') return;
    window.location.hash = '';
    history.pushState("", document.title, window.location.pathname + window.location.search);
  });
  [mainContent, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection].filter(Boolean).forEach(el => safeAdd(el, 'click', () => set3DMenuInvisible(true)));

  (async () => {
    try {
      if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
        safeCall(() => window.CSRFManager.init().catch(err => console.warn('CSRFManager init failed:', err)));
      }

      // start with top-level sections hidden
      [menuSection, gallerySection, formMain, loginFormSection, accountWrapper, reservationSection].filter(Boolean).forEach(el => {
        el.classList.remove('visible');
        el.classList.add('invisible');
      });

      try {
        if (autoCheckSession) {
          try {
            console.log('🔐 check_session: start');
            const res = await fetch('./php/check_session.php', {
              credentials: 'include'
            });

            const data = await res.json().catch(() => ({}));

            if (data.loggedIn && data.user) {
              const user = {
                id: data.user.id || null,
                name: data.user.name || '',
                email: data.user.email || ''
              };

              console.log('🔐 check_session: LOGGED IN', user);
              window.user = user;
              setLoggedIn(true);
              await updateLoginLabel();

              window.__AUTH_READY__ = true;
              window._autoLoginDone = true;

              if (!window.__USER_LOGIN_EVENT_SENT__) {
                window.__USER_LOGIN_EVENT_SENT__ = true;
                window.dispatchEvent(new CustomEvent('user:loggedin', {
                  detail: user
                }));
              }
            }
          } catch (err) {
            console.error('[check_session] error', err);
          } finally {
            authChecked = true;
            isInitialLoad = false;
            handleRouting();
            console.log('🔐 check_session: FINALLY');
            console.log('authChecked -> true');
            console.log('isInitialLoad -> false');
          }
        }

      } catch (err) {
        console.error('[check_session] error', err);
      }

      if (!window.__switchVisibilityRegisteredOnLogin) {
        const handler = async (user) => {
          setLoggedIn(true);
          await updateLoginLabel();

          if (user) {
            window.user = user;
            if (typeof window.initPersonalAccount === 'function') {
              await window.initPersonalAccount(user);
            }
          }

          if (window._autoLoginDone) return;

          window.location.hash = '#account';
        };

        const prev = typeof window.onLoginOrRegister === 'function' ? window.onLoginOrRegister : null;
        window.onLoginOrRegister = async function (user) {
          try { if (typeof prev === 'function') safeCall(prev, user); } catch (e) { console.warn(e); }
          try { await handler(user); } catch (e) { console.warn('handler error', e); }
        };
        if (window.__AUTH_READY__ && window.user) {
          safeCall(window.onLoginOrRegister, window.user);
        }
        window.__switchVisibilityRegisteredOnLogin = true;
      }

      if (window.AuthManager && typeof window.AuthManager.attachLogoutButton === 'function') {
        try { window.AuthManager.attachLogoutButton('.logout-account-btn'); } catch (e) { }
        document.querySelector('.logout-account-btn')?.addEventListener('click', () => {
          setLoggedIn(false);
          window.user = null;
          updateLoginLabel();
          accountInitialized = false;
          window.location.hash = '';
          history.pushState("", document.title, window.location.pathname + window.location.search);
        });
      }

    } catch (err) {
      console.warn('switch-visibility init failed', err);
    }
  })();

  if (!autoCheckSession) {
    authChecked = true;
    isInitialLoad = false;
    handleRouting();
  }

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
