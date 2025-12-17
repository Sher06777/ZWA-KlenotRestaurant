// js/handle-404.js
// ES module — безопасный (без innerHTML). Возвращает объект с init().
// Использование: import initNotFoundHandler from './handle-404.js'; initNotFoundHandler(options);

export default function initNotFoundHandler(options = {}) {
  const {
    basePath = '/~abdimshe/',   // базовый путь сайта (должен завершаться /)
    cleanTo = '/~abdimshe/',    // куда очищать URL
    autoClear = true,           // выполнять history.replaceState
    createIfMissing = true      // создавать блок, если его нет
  } = options;

  const ensureSlash = p => (p && p.endsWith('/') ? p : (p || '/') + '/');
  const BASE = ensureSlash(basePath);
  const CLEAN_TO = ensureSlash(cleanTo);

  // не трогаем очевидные ассеты (css/js/img.ext)
    const looksLikeAsset = p => /\.(?:js|mjs|css|html|c|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$/i.test(p);

  // безопасный запрос перевода (если есть глобальная функция getTranslation)
  async function safeTranslate(key, fallback) {
    try {
      if (typeof window.getTranslation === 'function') {
        const v = await window.getTranslation(key);
        if (v) return String(v);
      }
    } catch (e) {
      // ignore
    }
    return fallback || '';
  }

  function createButton(text, cls = '') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = cls;
    btn.textContent = text;
    return btn;
  }

  function createNotFoundNode() {
    // если уже есть — вернуть
    const ex = document.getElementById('not-found');
    if (ex) return ex;

    const section = document.createElement('section');
    section.id = 'not-found';
    section.className = 'not-found invisible';
    section.setAttribute('role', 'alert');
    section.setAttribute('aria-hidden', 'true');
    section.setAttribute('aria-labelledby', 'nf-title');

    const wrapper = document.createElement('div');
    wrapper.className = 'nf-card';
    wrapper.setAttribute('tabindex', '-1');

    const ill = document.createElement('div');
    ill.className = 'nf-illustration';
    ill.setAttribute('aria-hidden', 'true');
    // emoji — безопасно через textContent
    ill.textContent = '🚧';

    const title = document.createElement('h1');
    title.id = 'nf-title';
    title.textContent = '404 — Page not found';

    const desc = document.createElement('p');
    desc.className = 'nf-desc';
    desc.textContent = 'Извините, запрошенная страница не найдена.';

    const sub = document.createElement('p');
    sub.className = 'nf-sub';
    sub.textContent = 'Адрес будет очищён, вы можете вернуться на главную.';

    const actions = document.createElement('div');
    actions.className = 'nf-actions';

    const homeBtn = createButton('Перейти на главную', 'btn nf-home');
    homeBtn.id = 'nf-home';

    const backBtn = createButton('Назад', 'btn btn-ghost nf-back');
    backBtn.id = 'nf-back';

    actions.appendChild(homeBtn);
    actions.appendChild(backBtn);

    wrapper.appendChild(ill);
    wrapper.appendChild(title);
    wrapper.appendChild(desc);
    wrapper.appendChild(sub);
    wrapper.appendChild(actions);

    section.appendChild(wrapper);

    // вставка перед футером, если есть, иначе в body
    const footer = document.querySelector('footer');
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(section, footer);
    } else {
      document.body.appendChild(section);
    }

    return section;
  }

  function showNotFound(section) {
    if (!section) return;
    section.classList.remove('invisible');
    section.classList.add('visible');
    section.setAttribute('aria-hidden', 'false');
    // фокусируем карточку для доступности
    const card = section.querySelector('.nf-card');
    if (card) card.focus();
  }

  function hideNotFound(section) {
    if (!section) return;
    section.classList.remove('visible');
    section.classList.add('invisible');
    section.setAttribute('aria-hidden', 'true');
  }

  async function localizeNode(section) {
    if (!section) return;
    const title = section.querySelector('#nf-title');
    const homeBtn = section.querySelector('#nf-home');
    const backBtn = section.querySelector('#nf-back');
    const desc = section.querySelector('.nf-desc');
    const sub = section.querySelector('.nf-sub');

    try {
      const tTitle = await safeTranslate('error.404.title', '404 — Page not found');
      const tHome = await safeTranslate('error.404.home', 'Go home');
      const tBack = await safeTranslate('error.404.back', 'Back');
      const tDesc = await safeTranslate('error.404.desc', 'Sorry, the requested page was not found.');
      const tSub = await safeTranslate('error.404.sub', 'Address cleaned - you can return to home.');

      if (title) title.textContent = tTitle;
      if (homeBtn) homeBtn.textContent = tHome;
      if (backBtn) backBtn.textContent = tBack;
      if (desc) desc.textContent = tDesc;
      if (sub) sub.textContent = tSub;
    } catch (e) {
      // ignore translation errors
    }
  }

  // попытка аккуратно скрыть "обычные" секции через public API switchVisibility,
  // иначе — применяем локальное скрытие (без innerHTML).
  function hideAppSectionsGracefully() {
    // список селекторов, которые обычно показывает switch-visibility
    const selectors = [
      '#main',
      '.menu-all',
      '#account-wrapper',
      '#reservation-section',
      '#gallery-section',
      '.form-main',
      '.login-form-section'
    ];

    // use switchVisibility API if available
    if (window.switchVisibility && typeof window.switchVisibility.makeInvisible === 'function') {
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel);
          if (el) {
            try {
              window.switchVisibility.makeInvisible(el);
            } catch (e) {
              // fallback to class manipulation
              el.classList.remove('visible');
              el.classList.add('invisible');
            }
          }
        } catch (e) { /* ignore individual errors */ }
      }
      // also hide possible 3D menu
      if (typeof window.switchVisibility.set3DMenuInvisible === 'function') {
        try { window.switchVisibility.set3DMenuInvisible(true); } catch (e) {}
      }
      return;
    }

    // fallback: if fadeOut helper exists, use it; otherwise apply class toggles
    const fadeOut = window.fadeOut;
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (!el) continue;
        if (typeof fadeOut === 'function') {
          try { fadeOut(el); } catch (e) { el.classList.remove('visible'); el.classList.add('invisible'); }
        } else {
          el.classList.remove('visible');
          el.classList.add('invisible');
        }
      } catch (e) {}
    }

    // try to stop 3d menu if present
    try {
      if (window.menu3D && typeof window.menu3D.stop === 'function') window.menu3D.stop();
    } catch (e) {}
  }

  async function handleOnce() {
    const path = decodePathSafe(location.pathname || '/');
    if (path === BASE) return;               // уже на корне — ничего не делаем
    if (looksLikeAsset(path)) return;        // ресурс — не вмешиваемся

    const section = document.getElementById('not-found') || (createIfMissing ? createNotFoundNode() : null);
    if (!section) return;

    // локализация карточки
    await localizeNode(section);

    // скрываем обычные секции (через switchVisibility, если есть)
    hideAppSectionsGracefully();

    // навесим обработчики idempotently
    const homeBtn = section.querySelector('#nf-home');
    const backBtn = section.querySelector('#nf-back');

    if (homeBtn && !homeBtn._bound) {
      homeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        // сначала скрываем карточку
        hideNotFound(section);

        // если есть switchVisibility, используем её showSection для main
        if (window.switchVisibility && typeof window.switchVisibility.showSection === 'function') {
          try {
            // prefer passing element
            const mainEl = document.getElementById('main') || 'main';
            window.switchVisibility.showSection(mainEl);
          } catch (err) {
            // fallback to changing URL
            window.location.href = CLEAN_TO;
          }
        } else {
          // fallback: делаем навигацию на главную (посредством replace/location)
          try {
            // коротко обновим URL и оставим страницу (без перехода)
            history.replaceState({}, document.title, CLEAN_TO);
            // try to show main if present
            const mainEl = document.getElementById('main');
            if (mainEl) {
              mainEl.classList.remove('invisible');
              mainEl.classList.add('visible');
            } else {
              // если main отсутствует — делаем переход
              window.location.href = CLEAN_TO;
            }
          } catch (err) {
            window.location.href = CLEAN_TO;
          }
        }
      }, { passive: true });
      homeBtn._bound = true;
    }

    if (backBtn && !backBtn._bound) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideNotFound(section);
        if (history.length > 1) {
          try { history.back(); } catch (err) { window.location.href = CLEAN_TO; }
        } else {
          // no history -> go to home via switchVisibility or direct
          if (window.switchVisibility && typeof window.switchVisibility.showSection === 'function') {
            try { window.switchVisibility.showSection(document.getElementById('main') || 'main'); } catch (e) { window.location.href = CLEAN_TO; }
          } else {
            window.location.href = CLEAN_TO;
          }
        }
      }, { passive: true });
      backBtn._bound = true;
    }

    // показать карточку (сохранить заменённый URL ниже)
    showNotFound(section);

    // опционально очистить URL (replaceState не создаёт новую запись в истории)
    if (autoClear) {
      try {
        history.replaceState({}, document.title, CLEAN_TO);
        // опционально изменить title коротко
        document.title = (await safeTranslate('error.404.title', '404 — Not found')) || document.title;
      } catch (err) {
        console.warn('handle404.replaceState failed', err);
      }
    }
  }

  function decodePathSafe(p) {
    try {
      return decodeURIComponent(p || '/').replace(/\s+/g, ' ').trim().replace(/\/+$/, '/') ;
    } catch (e) {
      return (p || '/');
    }
  }

  // запуск при DOMContentLoaded или сразу если DOM уже готов
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setTimeout(handleOnce, 0); }, { once: true });
  } else {
    // небольшой timeout чтобы дать другим init'ам шанс выполниться
    setTimeout(handleOnce, 0);
  }

  // API
  return {
    init: handleOnce,
    base: BASE,
    cleanTo: CLEAN_TO
  };
}
