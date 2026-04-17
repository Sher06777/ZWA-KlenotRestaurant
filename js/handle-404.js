export default function initNotFoundHandler(options = {}) {
  const {
    basePath = '/~base/',
    cleanTo = '/~base/',
    autoClear = true,
    createIfMissing = true
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
    } catch (e) { }
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
    section.style.display = 'none';
    section.setAttribute('role', 'alert');
    section.setAttribute('aria-hidden', 'true');

    const wrapper = document.createElement('div');
    wrapper.className = 'nf-card';
    wrapper.setAttribute('tabindex', '-1');

    const ill = document.createElement('div');
    ill.className = 'nf-illustration';
    ill.textContent = '🚧';

    const title = document.createElement('h1');
    title.id = 'nf-title';
    title.textContent = '404';

    const desc = document.createElement('p');
    desc.className = 'nf-desc';

    const sub = document.createElement('p');
    sub.className = 'nf-sub';

    const actions = document.createElement('div');
    actions.className = 'nf-actions';

    const homeBtn = createButton('Home', 'btn nf-home');
    homeBtn.id = 'nf-home';

    const backBtn = createButton('Back', 'btn btn-ghost nf-back');
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

  // localize the 404 node with i18n if available
  async function localizeNode(section) {
    if (!section) return;
    const title = section.querySelector('#nf-title');
    const homeBtn = section.querySelector('#nf-home');
    const backBtn = section.querySelector('#nf-back');
    const desc = section.querySelector('.nf-desc');
    const sub = section.querySelector('.nf-sub');

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
  }

  async function handleOnce() {
    const path = decodePathSafe(location.pathname || '/');

    const section = document.getElementById('not-found') || (createIfMissing ? createNotFoundNode() : null);
    if (!section) return;

    await localizeNode(section);

    const homeBtn = section.querySelector('#nf-home');
    const backBtn = section.querySelector('#nf-back');

    if (homeBtn && !homeBtn._bound) {
      homeBtn.addEventListener('click', (e) => {
        e.preventDefault();

        history.pushState("", document.title, CLEAN_TO);

        if (window.switchVisibility && typeof window.switchVisibility.showSection === 'function') {
          const mainEl = document.getElementById('main');
          window.switchVisibility.showSection(mainEl);
        } else {
          window.location.hash = '';
        }
      });
      homeBtn._bound = true;
    }

    if (backBtn && !backBtn._bound) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (history.length > 1) {
          history.back();
        } else {
          homeBtn.click();
        }
      });
      backBtn._bound = true;
    }

    if (autoClear && path !== BASE && !looksLikeAsset(path)) {
      setTimeout(() => {
        if (window.location.pathname !== BASE) {
          history.replaceState("", document.title, CLEAN_TO);
        }
      }, 2000);
    }
  }

  function decodePathSafe(p) {
    try {
      return decodeURIComponent(p || '/').replace(/\/+$/, '/');
    } catch (e) {
      return (p || '/');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(handleOnce, 50), { once: true });
  } else {
    setTimeout(handleOnce, 50);
  }

  return { init: handleOnce };
}
