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
  _initialized = true;
  return _token;
}

const CSRFManager = {
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

  /**
   * 
   * @param {string} token
   */
  setToken: function (token) {
    if (!token) return;
    _token = String(token);
    _initialized = true;
  },

  getHeader: function () {
    return _token ? { 'X-CSRF-Token': _token } : {};
  },

  appendToFormData: async function(formData) {
    if (!formData || typeof formData.append !== 'function') throw new Error('Invalid formData');
    if (!_token) await this.init();
    
    try { formData.delete && formData.delete('csrf_token'); } catch(e){/*ignore*/}
    formData.append('csrf_token', _token);
  },

  appendToJson: async function (obj = {}) {
    if (!_token) {
      try { await this.init(); } catch (e) { console.warn('CSRF init failed', e); }
    }
    return { ...obj, csrf_token: _token };
  },

  fetchWithCsrf: async function (url, opts = {}) {
    await this.init().catch(()=>{});
    const options = Object.assign({}, opts);
    options.credentials = options.credentials || 'include';
    options.headers = Object.assign({}, options.headers || {}, this.getHeader());
    return fetch(url, options);
  },


  fetchWithCsrfRetry: async function (url, opts = {}) {
    // 1) первый защищённый запрос через fetchWithCsrf (он сам вызывает init())
    let res = await this.fetchWithCsrf(url, opts);
    if (res.status !== 403) return res;

    // 2) получили 403 — попробуем извлечь новый токен из тела или заголовка
    try {
      let newTok = null;

      const body = await res.clone().json().catch(()=>null);
      if (body && body.new_csrf) newTok = String(body.new_csrf);

      const hdrTok = (res.headers && typeof res.headers.get === 'function') ? res.headers.get('X-CSRF-Token') : null;
      if (!newTok && hdrTok) newTok = String(hdrTok);

      if (newTok) {
        // если есть публичный сеттер, используем его, иначе пытаемся обновить локальную переменную
        if (typeof this.setToken === 'function') {
          try { this.setToken(newTok); } catch(e) { /* ignore */ }
        } else {
          // попытка записать в внутренний токен (работает если функция в том же замыкании)
          try { _token = String(newTok); } catch(e) { /* ignore */ }
        }
      } else {
        // иначе попытаемся явно получить новый токен с сервера
        try { await this.refresh(); } catch(e) { /* ignore */ }
      }

      // 3) сформируем опции для повторного запроса — shallow clone и гарантируем credentials
      const retryOpts = Object.assign({}, opts);
      retryOpts.credentials = retryOpts.credentials || 'include';

      // Если тело - FormData, обновим поле csrf_token (не выставляем Content-Type)
      try {
        if (retryOpts.body && typeof FormData !== 'undefined' && retryOpts.body instanceof FormData) {
          // удаляем старое (если есть) и добавляем актуальное
          try { retryOpts.body.delete('csrf_token'); } catch(e) {}
          // Получаем текущий токен (через getHeader или _token)
          const headerObj = (typeof this.getHeader === 'function') ? this.getHeader() : {};
          const tokFromHeader = headerObj['X-CSRF-Token'] || headerObj['x-csrf-token'] || null;
          const tokenToAppend = tokFromHeader || (typeof _token !== 'undefined' ? _token : null);
          if (tokenToAppend) {
            try { retryOpts.body.append('csrf_token', String(tokenToAppend)); } catch(e) {}
          }
        } else {
          // Если JSON: добавляем поле csrf_token внутрь JSON, если body - строка JSON
          const hdrs = Object.assign({}, retryOpts.headers || {});
          const contentType = (hdrs['Content-Type'] || hdrs['content-type'] || '').toLowerCase();
          if (contentType.indexOf('application/json') !== -1) {
            if (typeof retryOpts.body === 'string') {
              try {
                const parsed = JSON.parse(retryOpts.body || '{}');
                const headerObj = (typeof this.getHeader === 'function') ? this.getHeader() : {};
                const tokFromHeader = headerObj['X-CSRF-Token'] || headerObj['x-csrf-token'] || null;
                parsed.csrf_token = tokFromHeader || (typeof _token !== 'undefined' ? _token : parsed.csrf_token);
                retryOpts.body = JSON.stringify(parsed);
              } catch(e) { /* ignore JSON parse error */ }
            } else if (typeof retryOpts.body === 'object' && retryOpts.body !== null) {
              // если caller передал объект вместо строки
              try {
                const headerObj = (typeof this.getHeader === 'function') ? this.getHeader() : {};
                const tokFromHeader = headerObj['X-CSRF-Token'] || headerObj['x-csrf-token'] || null;
                retryOpts.body.csrf_token = tokFromHeader || (typeof _token !== 'undefined' ? _token : retryOpts.body.csrf_token);
                // caller может ожидать объект или строку — не меняем тип
              } catch(e) {}
            }
          } else {
            // во всех остальных случаях — просто добавим заголовок X-CSRF-Token (без явного Content-Type)
            retryOpts.headers = Object.assign({}, retryOpts.headers || {}, this.getHeader());
          }
        }
      } catch(e) {
        // не критично — поймаем ниже
      }

      // 4) повторяем запрос (используем fetch напрямую чтобы не повторно добавлять init/логирование)
      res = await fetch(url, retryOpts);
    } catch (e) {
      // в случае ошибки — просто вернём первоначальный 403-ответ (res может быть 403)
      return res;
    }

    return res;
  },

  isInitialized: function () {
    return _initialized && !!_token;
  }
};


if (!window.CSRFManager) window.CSRFManager = CSRFManager;
export default CSRFManager;
