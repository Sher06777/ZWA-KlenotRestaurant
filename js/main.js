// main.js — bootstrapper (module)
// Нет русских комментавиев
import CSRFManager from './csrf.js';
import initNotFoundHandler from './handle-404.js';

import { initI18n } from './switch-language.js';
import { initSwitchVisibility } from './switch-visibility.js';

import { initAccountModule } from './account.js';
import * as admin from './admin-users.js';
import { initAnimations } from './animations.js';
import { initSignin } from './signin.js';
import { initSigninValidation } from './signin-validation.js';
import { initReservation } from './reservation.js';
import { initRegistration } from './registration.js';
import { initLoginValidation } from './login-validation.js';
import { initAdminReservations, adjustAccountSectionHeight as adjustResHeight } from './admin-reservations.js';
import { initGallery } from './gallery.js';
import { initLanguageDropdown } from './language-dropdown.js';
import { initAuthManager } from './logout.js';
import { initMenu } from './menu.js';
import { initReviews } from './review.js';
import { initMobileMenu } from './mobile/menu-dropdown.js';

async function boot() {
  window.__UI_READY = false;
  window.__AUTH_READY__ = false;
  try {
    // 0) i18n early (so data-i18n translations resolved before UI inits)
    try {
      await initI18n(); // returns a promise that resolves after initial load
      console.log('✅ i18n initialized');
    } catch (e) { console.warn('initI18n failed', e); }


    // 1) init CSRF early (best-effort)
    try {
      await CSRFManager.init();
      console.log('✅ CSRFManager initialized (token stored securely inside module).');
    } catch (err) {
      console.warn('Failed to retrieve the CSRF token when loading the page:', err);
    }

    // 2) init visibility / routing helpers (needs i18n + CSRF possibly)
    try {
      initSwitchVisibility({ autoCheckSession: true }); 
    } catch (e) { console.warn('initSwitchVisibility failed', e); }

    // 2.1 error-404
    try {
      initNotFoundHandler({
        basePath: '/~achilkem/',
        cleanTo: '/~achilkem/',
        autoClear: true
      });
    } catch (e) {
      console.warn('initNotFoundHandler failed', e);
    }

    // 3) init visual/animations
    try { initAnimations(); } catch (e) { console.warn('initAnimations failed', e); }

    // 4) small UI modules / controls
    try { initLanguageDropdown(); } catch (e) { console.warn('initLanguageDropdown failed', e); }
    try { initMenu(); } catch (e) { console.warn('initMenu failed', e); }
    try { initGallery(); } catch (e) { console.warn('initGallery failed', e); }
    try { initReviews(); } catch (e) { console.warn('initReviews failed', e); }
    try { initMobileMenu(); } catch (e) { console.warn('initMobileMenu failed', e); }

    // 5) auth/ui modules
    try { initAuthManager(); } catch (e) { console.warn('initAuthManager failed', e); }
    try { initAdminReservations(); } catch (e) { console.warn('initAdminReservations failed', e); }

    // 6) account + signin wiring
    try { initAccountModule(); } catch (e) { console.warn('initAccountModule failed', e); }
    try { initSignin(); } catch (e) { console.warn('initSignin failed', e); }
    try { initSigninValidation(); } catch (e) { console.warn('initSigninValidation failed', e); }

    // 7) forms & validation
    try { initReservation(); } catch (e) { console.warn('initReservation failed', e); }
    try { initRegistration(); } catch (e) { console.warn('initRegistration failed', e); }
    try { initLoginValidation(); } catch (e) { console.warn('initLoginValidation failed', e); }

    // 8) final check session + autologin (single source of truth)
    // NOTE: we intentionally DO NOT call window.onLoginOrRegister here to avoid forcing
    // a navigation to the account wrapper on page reload. We only restore user state
    // (init personal account data + update ui labels) so the UI reflects logged-in user,
    // but the visible section remains whatever the page currently shows (usually main).
    // try {
    //   const res = await fetch('./php/check_session.php', { credentials: 'include' });
    //   const data = await res.json().catch(()=>({}));
    //   if (data && data.loggedIn && data.user) {
    //     window.user = data.user;

    //     // initialize personal account data (idempotent) but DO NOT trigger navigation
    //     try {
    //       // prefer the named export if available
    //       const { initPersonalAccount } = await import('./account.js').catch(() => ({}));
    //       if (typeof initPersonalAccount === 'function') {
    //         await initPersonalAccount(window.user);
    //       }
    //     } catch (e) {
    //       console.warn('fallback initPersonalAccount failed', e);
    //     }

    //     // mark as logged in for other UI helpers and update login label
    //     try {
    //       if (typeof window.setLoggedIn === 'function') window.setLoggedIn(true);
    //       if (typeof window.updateLoginLabel === 'function') await window.updateLoginLabel();
    //     } catch (e) {
    //       console.warn('Failed to set loggedIn/updateLoginLabel after autologin:', e);
    //     }

    //     // set internal flag so any handlers that check it know autologin was performed
    //     window._autoLoginDone = true;
    //   }
    // } catch (err) {
    //   console.warn('check_session failed', err);
    // }
    // 9) attach any dynamic UI that needs user state / session
    try {
      if (window.AuthManager && typeof window.AuthManager.attachLogoutButton === 'function') {
        window.AuthManager.attachLogoutButton && window.AuthManager.attachLogoutButton('.logout-account-btn');
      }
    } catch (e) { /* ignore */ }

  } catch (err) {
    console.error('Boot failed', err);
  }
  window.__UI_READY = true;
}

document.addEventListener('DOMContentLoaded', boot);
