// Client-side CSRF manager:
// - fetches token from server endpoint (assumed to return { csrf_token })
// - keeps token in module variable and exposes helpers to attach token to requests/forms
const API_GET = './php/get_csrf_token.php';
let _token = null;
let _initialized = false;
let _initPromise = null;

// Internal: fetch token from API and store it.
async function _fetchToken() {
  const res = await fetch(API_GET, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch CSRF token');
  const data = await res.json();
  if (!data || !data.csrf_token) throw new Error('Invalid CSRF response');
  _token = String(data.csrf_token);
  return _token;
}

const CSRFManager = {
  // Initialize once — returns token when resolved.
  init: function () {
    if (_initialized) return Promise.resolve(_token);
    if (_initPromise) return _initPromise;
    _initPromise = _fetchToken()
      .then(tok => {
        _initialized = true;
        _initPromise = null;
        return tok;
      })
      .catch(err => {
        _initPromise = null;
        console.error('CSRFManager.init error:', err);
        throw err;
      });
    return _initPromise;
  },

  // Force refresh token (useful after login/logout or server rotated token).
  refresh: async function () {
    try {
      const tok = await _fetchToken();
      _initialized = true;
      return tok;
    } catch (err) {
      console.error('CSRFManager.refresh error:', err);
      throw err;
    }
  },

  // Return header object to attach to fetch calls.
  getHeader: function () {
    return _token ? { 'X-CSRF-Token': _token } : {};
  },

  // Append token as form field (for form-based uploads).
  appendToFormData: async function(formData) {
    if (!formData || typeof formData.append !== 'function') throw new Error('Invalid formData');
    if (!_token) await this.init();
    formData.append('csrf_token', _token);
  },

  // Add token to JSON payload (returns a new object).
  appendToJson: function (obj = {}) {
    if (!_token) return { ...obj };
    return { ...obj, csrf_token: _token };
  },

  // Helper that sets header + keeps credentials — prefer this to centralize token handling.
  fetchWithCsrf: async function (url, opts = {}) {
    const options = Object.assign({}, opts);
    options.credentials = options.credentials || 'include';
    options.headers = Object.assign({}, options.headers || {}, this.getHeader());
    return fetch(url, options);
  },

  isInitialized: function () {
    return _initialized && !!_token;
  }
};

if (!window.CSRFManager) window.CSRFManager = CSRFManager;
export default CSRFManager;
