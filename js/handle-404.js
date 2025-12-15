



export default function initNotFoundHandler(options = {}) {
  const {
    basePath = '/~achilkem/',   // базовый путь сайта (должен завершаться /)
    cleanTo = '/~achilkem/',    // куда очищать URL
    autoClear = true,           // выполнять history.replaceState
    createIfMissing = true      // создавать блок, если его нет
  } = options;

  const ensureSlash = p => (p && p.endsWith('/') ? p : (p || '/') + '/');
  const BASE = ensureSlash(basePath);
  const CLEAN_TO = ensureSlash(cleanTo);

  
    const looksLikeAsset = p => /\.(?:js|mjs|css|html|c|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$/i.test(p);

  
  async function safeTranslate(key, fallback) {
    try {
      if (typeof window.getTranslation === 'function') {
        const v = await window.getTranslation(key);
        if (v) return String(v);
      }
    } catch (e) {
      
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
      
    }
  }

  
  
  function hideAppSectionsGracefully() {
    
    const selectors = [
      '#main',
      '.menu-all',
      '#account-wrapper',
      '#reservation-section',
      '#gallery-section',
      '.form-main',
      '.login-form-section'
    ];

    
    if (window.switchVisibility && typeof window.switchVisibility.makeInvisible === 'function') {
      for (const sel of selectors) {
        try {
          const el = document.querySelector(sel);
          if (el) {
            try {
              window.switchVisibility.makeInvisible(el);
            } catch (e) {
              
              el.classList.remove('visible');
              el.classList.add('invisible');
            }
          }
        } catch (e) { }
      }
      
      if (typeof window.switchVisibility.set3DMenuInvisible === 'function') {
        try { window.switchVisibility.set3DMenuInvisible(true); } catch (e) {}
      }
      return;
    }

    
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

    
    try {
      if (window.menu3D && typeof window.menu3D.stop === 'function') window.menu3D.stop();
    } catch (e) {}
  }

  async function handleOnce() {
    const path = decodePathSafe(location.pathname || '/');
    if (path === BASE) return;               
    if (looksLikeAsset(path)) return;        

    const section = document.getElementById('not-found') || (createIfMissing ? createNotFoundNode() : null);
    if (!section) return;

    
    await localizeNode(section);

    
    hideAppSectionsGracefully();

    
    const homeBtn = section.querySelector('#nf-home');
    const backBtn = section.querySelector('#nf-back');

    if (homeBtn && !homeBtn._bound) {
      homeBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        hideNotFound(section);

        
        if (window.switchVisibility && typeof window.switchVisibility.showSection === 'function') {
          try {
            
            const mainEl = document.getElementById('main') || 'main';
            window.switchVisibility.showSection(mainEl);
          } catch (err) {
            
            window.location.href = CLEAN_TO;
          }
        } else {
          
          try {
            
            history.replaceState({}, document.title, CLEAN_TO);
            
            const mainEl = document.getElementById('main');
            if (mainEl) {
              mainEl.classList.remove('invisible');
              mainEl.classList.add('visible');
            } else {
              
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
          
          if (window.switchVisibility && typeof window.switchVisibility.showSection === 'function') {
            try { window.switchVisibility.showSection(document.getElementById('main') || 'main'); } catch (e) { window.location.href = CLEAN_TO; }
          } else {
            window.location.href = CLEAN_TO;
          }
        }
      }, { passive: true });
      backBtn._bound = true;
    }

    
    showNotFound(section);

    
    if (autoClear) {
      try {
        history.replaceState({}, document.title, CLEAN_TO);
        
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

  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setTimeout(handleOnce, 0); }, { once: true });
  } else {
    
    setTimeout(handleOnce, 0);
  }

  
  return {
    init: handleOnce,
    base: BASE,
    cleanTo: CLEAN_TO
  };
}
