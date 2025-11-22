(function () {
  const API_GET = './php/get_csrf_token.php';
  let _token = null;
  let _initialized = false;
  let _initPromise = null;

  async function _fetchToken() {
    const res = await fetch(API_GET, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch CSRF token');
    const data = await res.json();
    if (!data || !data.csrf_token) throw new Error('Invalid CSRF response');
    _token = String(data.csrf_token);
    return _token;
  }

  const CSRFManager = {
    // Инициализация (можно вызывать на загрузке страницы)
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

    // Форсированное обновление токена (например, после логина)
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

    // Возвращает заголовок для X-CSRF-Token (объект). Если нет токена — пустой объект.
    getHeader: function () {
      return _token ? { 'X-CSRF-Token': _token } : {};
    },

    // Добавляет токен в FormData (мутирует переданный объект)
    appendToFormData: async function(formData) {
      if (!formData || typeof formData.append !== 'function') throw new Error('...');
      if (!_token) await this.init();
      formData.append('csrf_token', _token);
    },

    // Возвращает новый объект, копию obj с добавленным поле csrf_token.
    // Не мутирует исходный объект.
    appendToJson: function (obj = {}) {
      if (!_token) return { ...obj };
      return { ...obj, csrf_token: _token };
    },

    // Удобная обёртка вокруг fetch, которая добавляет заголовок X-CSRF-Token автоматически.
    // opts будет клонирован (чтобы не мутировать), credentials по умолчанию include.
    fetchWithCsrf: async function (url, opts = {}) {
      const options = Object.assign({}, opts);
      options.credentials = options.credentials || 'include';
      options.headers = Object.assign({}, options.headers || {}, this.getHeader());
      return fetch(url, options);
    },

    // для отладки: проверка инициализации (не раскрывает токен)
    isInitialized: function () {
      return _initialized && !!_token;
    }
  };

  // expose
  if (!window.CSRFManager) window.CSRFManager = CSRFManager;
})();