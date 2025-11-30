// auth-ui.js — управление сессией / logout / checkSession на клиенте
// Зависимости: window.CSRFManager (опционально). Экспортирует window.AuthManager

(function () {
  const safeCall = (fn, ...args) => { try { return fn && fn(...args); } catch (e) { console.error(e); } };

  // helper: show simple alert/confirm wrappers (можно заменить i18n)
  function confirmDialog(text) {
    return confirm(text);
  }

  async function fetchJson(url, opts = {}) {
    const options = Object.assign({}, opts);
    // default credential include — server session relies on it
    options.credentials = options.credentials || 'include';
    const res = await fetch(url, options);
    // try to parse json safely
    let json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    return { ok: res.ok, status: res.status, body: json, raw: res };
  }

  async function logoutFlow({ confirmMessage } = {}) {
    const conf = confirmMessage || 'Do you really want to log out of your account?';
    if (!confirmDialog(conf)) return { success: false, cancelled: true };

    try {
      // Ensure CSRF present if manager exists
      if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
        try { await window.CSRFManager.init(); } catch (e) { console.warn('CSRFManager init before logout failed', e); }
      }

      // Best-effort include CSRF token in POST body using manager or simple JSON
      const bodyObj = (window.CSRFManager && typeof window.CSRFManager.appendToJson === 'function')
        ? window.CSRFManager.appendToJson({})
        : {};

      // prefer fetchWithCsrf if available (adds header), otherwise plain fetch with credentials
      const doFetch = (window.CSRFManager && typeof window.CSRFManager.fetchWithCsrf === 'function')
        ? window.CSRFManager.fetchWithCsrf
        : fetch;

      const res = await (doFetch === fetch
        ? fetch('./php/logout.php', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) })
        : window.CSRFManager.fetchWithCsrf('./php/logout.php', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) })
      );

      let data = null;
      try { data = await res.json(); } catch (_) { data = null; }

      if (!res.ok) {
        console.error('Logout failed, status', res.status, data);
        return { success: false, error: data || { status: res.status } };
      }

      if (data && data.success) {
        // attempt to refresh CSRF token if available
        if (window.CSRFManager && typeof window.CSRFManager.refresh === 'function') {
          try { await window.CSRFManager.refresh(); } catch (_) { /* ignore */ }
        }
        // clear client storages
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
        // reset client state
        if (typeof window.setLoggedIn === 'function') safeCall(window.setLoggedIn, false);
        if (typeof window.updateLoginLabel === 'function') safeCall(window.updateLoginLabel);
        // reload page to reflect logged-out state
        window.location.reload();
        return { success: true };
      } else {
        return { success: false, error: data || { message: 'Logout failed' } };
      }
    } catch (err) {
      console.error('Logout flow error', err);
      return { success: false, error: err };
    }
  }

  async function checkSession() {
    try {
      const r = await fetchJson('./php/check_session.php', { method: 'GET' });
      // Return parsed body even if !ok
      return { ok: r.ok, status: r.status, body: r.body };
    } catch (e) {
      console.error('checkSession error', e);
      return { ok: false, status: 0, body: null };
    }
  }

  // utility to attach logout button(s) automatically
  function attachLogoutButton(selector = '.logout-account-btn') {
    const btn = document.querySelector(selector);
    if (!btn) return;
    // remove prior listeners if needed by using a data attribute
    if (btn.dataset.authAttach === 'true') return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const result = await logoutFlow();
      if (result && !result.success && !result.cancelled) {
        alert('Ошибка при выходе: ' + (result.error && result.error.message ? result.error.message : 'Server error'));
      }
    });
    btn.dataset.authAttach = 'true';
  }

  // init: attach to existing logout buttons and optionally run checkSession auto handling
  async function init({ autoCheckSession = false, attachToLogout = true } = {}) {
    if (attachToLogout) attachLogoutButton('.logout-account-btn');

    if (autoCheckSession) {
      try {
        const s = await checkSession();
        if (s && s.body && s.body.loggedIn && s.body.user) {
          // return the body so caller can use it
          return { loggedIn: true, user: s.body.user };
        }
      } catch (e) { /* ignore */ }
    }
    return { loggedIn: false, user: null };
  }

  // Expose on window
  window.AuthManager = {
    init,
    checkSession,
    logout: logoutFlow,
    attachLogoutButton
  };
})();
