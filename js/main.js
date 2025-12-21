// main.js — application bootstrap (module)
// Loaded in HTML as: <script type="module" src="js/main.js"></script>

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
    // 0) i18n — initial load so elements with data-i18n can be resolved early
    try {
      await initI18n(); // resolves after initial dictionary load
      console.log('✅ i18n initialized');
    } catch (e) { console.warn('initI18n failed', e); }

    // 1) init CSRF early (best-effort; not fatal)
    try {
      await CSRFManager.init();
      console.log('✅ CSRFManager initialized (token stored securely inside module).');
    } catch (err) {
      console.warn('Failed to retrieve the CSRF token when loading the page:', err);
    }

    // 2) routing/visibility helpers (needs i18n/CSRF status)
    try {
      initSwitchVisibility({ autoCheckSession: true });
    } catch (e) { console.warn('initSwitchVisibility failed', e); }

    // 2.1) simple not-found handler
    try {
      initNotFoundHandler({
        basePath: '/~abdimshe/',
        cleanTo: '/~abdimshe/',
        autoClear: true
      });
    } catch (e) { console.warn('initNotFoundHandler failed', e); }

    // 3) visual helpers / animations
    try { initAnimations(); } catch (e) { console.warn('initAnimations failed', e); }

    // 4) UI components (safe best-effort inits)
    try { initLanguageDropdown(); } catch (e) { console.warn('initLanguageDropdown failed', e); }
    try { initMenu(); } catch (e) { console.warn('initMenu failed', e); }
    try { initGallery(); } catch (e) { console.warn('initGallery failed', e); }
    try { initReviews(); } catch (e) { console.warn('initReviews failed', e); }
    try { initMobileMenu(); } catch (e) { console.warn('initMobileMenu failed', e); }

    // 5) auth & admin related modules
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

    // 8) attach logout if available
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
