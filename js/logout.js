// No Russian comments

export function initAuthManager() {
  // Safe call wrapper to avoid throwing from optional callbacks.
  const safeCall = (fn, ...args) => { try { return fn && fn(...args); } catch (e) { console.error(e); } };

  function confirmDialog(text) { return confirm(text); }

  // Small wrapper that returns parsed JSON body + status info.
  async function fetchJson(url, opts = {}) {
    const options = Object.assign({}, opts);
    options.credentials = options.credentials || 'include';
    const res = await fetch(url, options);
    let json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    return { ok: res.ok, status: res.status, body: json, raw: res };
  }

  // Logout flow that optionally uses CSRFManager to attach token and to perform fetchWithCsrf.
  async function logoutFlow({ confirmMessage } = {}) {
    const conf = confirmMessage || 'Do you really want to log out of your account?';
    if (!confirmDialog(conf)) return { success: false, cancelled: true };

    try {
      if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
        try { await window.CSRFManager.init(); } catch (e) { console.warn('CSRFManager init before logout failed', e); }
      }

      const bodyObj = (window.CSRFManager && typeof window.CSRFManager.appendToJson === 'function')
        ? window.CSRFManager.appendToJson({})
        : {};

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
        // On success clear storages and update UI; refresh CSRF if available.
        if (window.CSRFManager && typeof window.CSRFManager.refresh === 'function') {
          try { await window.CSRFManager.refresh(); } catch (_) { }
        }
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
        if (typeof window.setLoggedIn === 'function') safeCall(window.setLoggedIn, false);
        if (typeof window.updateLoginLabel === 'function') safeCall(window.updateLoginLabel);
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
      return { ok: r.ok, status: r.status, body: r.body };
    } catch (e) {
      console.error('checkSession error', e);
      return { ok: false, status: 0, body: null };
    }
  }

  // Attach click handler to logout button (idempotent attach).
  function attachLogoutButton(selector = '.logout-account-btn') {
    const btn = document.querySelector(selector);
    if (!btn) return;
    if (btn.dataset.authAttach === 'true') return;
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const result = await logoutFlow();
      if (result && !result.success && !result.cancelled) {
        alert('Error during logout: ' + (result.error && result.error.message ? result.error.message : 'Server error'));
      }
    });
    btn.dataset.authAttach = 'true';
  }

  async function init({ autoCheckSession = false, attachToLogout = true } = {}) {
    if (attachToLogout) attachLogoutButton('.logout-account-btn');

    if (autoCheckSession) {
      try {
        const s = await checkSession();
        if (s && s.body && s.body.loggedIn && s.body.user) {
          return { loggedIn: true, user: s.body.user };
        }
      } catch (e) { }
    }
    return { loggedIn: false, user: null };
  }

  window.AuthManager = {
    init,
    checkSession,
    logout: logoutFlow,
    attachLogoutButton
  };

  // Auto attach if button exists on load.
  try { attachLogoutButton('.logout-account-btn'); } catch (_) {}
}
