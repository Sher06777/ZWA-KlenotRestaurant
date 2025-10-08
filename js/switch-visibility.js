// === switch-visibility-fixed.js ===

// Полная, рабочая версия кода

let isLoggedIn = false;

const loginButton = document.querySelector('.login-btn');
const logo = document.querySelector('.logo');
const main = document.querySelector('#main');
const form = document.querySelector('.form-main');
const personalAccount = document.querySelector('.personal-account');
const submitButton = document.querySelector('.form-submit-button');
const loginText = document.querySelector('.login-text');
const mainContentWrapper = document.querySelector('.main-content-wrapper');
const galleryButton = document.querySelector('.gallery-btn');
const gallery = document.querySelector('.gallery-section');

// Настройки анимации
const SHOW_DURATION = 260;
const HIDE_DURATION = 180;

// ---------- Универсальные функции для видимости ----------
function makeVisible(el) {
  if (!el) return;
  el.style.display = '';
  el.classList.remove('invisible', 'hidden');
  el.classList.add('visible');
}

function makeInvisible(el) {
  if (!el) return;
  el.classList.remove('visible');
  el.classList.add('invisible');
}

// ---------- Управление галереей ----------

// Показ галереи с анимацией
function showGallery(el, { duration = SHOW_DURATION } = {}) {
  if (!el) return Promise.resolve();

  // Если уже видна — выходим
  if (el.classList.contains('visible') && !el.classList.contains('invisible')) {
    return Promise.resolve();
  }

  el.classList.remove('hidden', 'invisible');
  el.style.display = '';
  el.style.overflow = 'hidden';
  el.style.transition = 'none';
  el.style.maxHeight = '0px';
  el.style.opacity = '0';
  el.style.paddingTop = '0px';
  el.style.paddingBottom = '0px';

  void el.offsetHeight;

  el.classList.add('visible');

  const targetHeight = el.scrollHeight;
  el.style.transition = `max-height ${duration}ms ease, opacity ${duration}ms ease, padding ${duration}ms ease`;
  el.style.maxHeight = targetHeight + 'px';
  el.style.opacity = '1';
  el.style.paddingTop = '120px';
  el.style.paddingBottom = '60px';

  return new Promise((resolve) => {
    const onEnd = (e) => {
      if (e.propertyName === 'max-height') {
        el.style.maxHeight = '';
        el.style.transition = '';
        el.style.overflow = '';
        el.removeEventListener('transitionend', onEnd);
        resolve();
      }
    };
    el.addEventListener('transitionend', onEnd);

    setTimeout(() => {
      el.style.maxHeight = '';
      el.style.transition = '';
      el.style.overflow = '';
      el.removeEventListener('transitionend', onEnd);
      resolve();
    }, duration + 100);
  });
}



async function showGallerySection() {
  // убираем padding персоналки, чтобы не влиять на галерею
  if (mainContentWrapper) mainContentWrapper.classList.remove('visible-padding');
  void mainContentWrapper?.offsetHeight;

  // скрываем остальные секции
  makeInvisible(main);
  makeInvisible(form);
  makeInvisible(personalAccount);

  // показываем галерею анимированно (если элемент найден)
  if (gallery) await showGallery(gallery);
}

// ---------- Логика переключений между секциями ----------

// Показ формы входа
async function showForm() {
  if (isLoggedIn) {
    makeInvisible(main);
    makeInvisible(form);
    makeVisible(personalAccount);
    mainContentWrapper.classList.add('visible-padding');
    return;
  }

  makeInvisible(main);
  makeVisible(form);

  makeInvisible(personalAccount);
  mainContentWrapper.classList.remove('visible-padding');

  if (gallery) await hideGallery(gallery, { immediate: true });
}

// Показ главной
async function showMain() {
  makeInvisible(form);
  makeVisible(main);
  makeInvisible(personalAccount);
  mainContentWrapper.classList.remove('visible-padding');
  if (gallery) await hideGallery(gallery, { immediate: true });
}

// Показ личного кабинета
function getGalleryElement() {
  return document.getElementById('gallery-section') || document.querySelector('.gallery-section');
}

function resetGalleryInlineStylesForce(el) {
  if (!el) return;
  // очищаем inline-стили, которые могли остаться
  el.style.transition = '';
  el.style.maxHeight = '';
  el.style.opacity = '';
  el.style.paddingTop = '';
  el.style.paddingBottom = '';
  el.style.overflow = '';
  // явно скрываем
  el.style.display = 'none';

  // очищаем классы видимости — оставляем только базовый класс
  el.classList.remove('visible', 'invisible', 'active');
  // ставим явный флаг hidden
  if (!el.classList.contains('hidden')) el.classList.add('hidden');
}

// Более жёсткое скрытие галереи (гарантирует, что visible не останется)
function hideGallery(el, { duration = HIDE_DURATION, immediate = false } = {}) {
  const node = getGalleryElement() || el;
  if (!node) return Promise.resolve();

  // если immediate — делаем принудительно и мгновенно
  if (immediate) {
    node.classList.remove('visible', 'invisible', 'active');
    node.classList.add('hidden');
    resetGalleryInlineStylesForce(node);

    // двойная проверка: на следующем кадре ещё раз убираем visible, если кто-то успел его добавить
    requestAnimationFrame(() => {
      node.classList.remove('visible');
      node.style.display = 'none';
    });

    // и ещё немного позже (защита от setTimeouts в других скриптах)
    setTimeout(() => {
      node.classList.remove('visible');
      node.style.display = 'none';
      resetGalleryInlineStylesForce(node);
    }, 50);

    return Promise.resolve();
  }

  // плавное скрытие (как раньше), но с последующим жёстким финалом
  node.style.overflow = 'hidden';
  node.style.maxHeight = node.scrollHeight + 'px';
  void node.offsetHeight;

  node.style.transition = `max-height ${duration}ms ease, opacity ${duration}ms ease, padding ${duration}ms ease`;
  node.style.maxHeight = '0px';
  node.style.opacity = '0';
  node.style.paddingTop = '0px';
  node.style.paddingBottom = '0px';

  node.classList.remove('visible', 'active');
  node.classList.add('invisible');

  return new Promise((resolve) => {
    const onEnd = (e) => {
      if (e.propertyName === 'max-height') {
        node.classList.remove('visible', 'invisible', 'active');
        node.classList.add('hidden');
        resetGalleryInlineStylesForce(node);
        node.removeEventListener('transitionend', onEnd);
        resolve();
      }
    };
    node.addEventListener('transitionend', onEnd);

    // fallback если transitionend не произойдёт
    setTimeout(() => {
      node.classList.remove('visible', 'invisible', 'active');
      node.classList.add('hidden');
      resetGalleryInlineStylesForce(node);
      node.removeEventListener('transitionend', onEnd);
      resolve();
    }, duration + 160);
  });
}

// Показ личного кабинета — сначала гарантированно закрываем галерею (force), потом показываем кабинет
async function showPersonalAccount(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();

  // Сначала надёжно закрываем галерею
  const galleryNode = getGalleryElement();
  if (galleryNode) {
    // используем immediate hide, чтобы не оставить inline-стилей/visible
    await hideGallery(galleryNode, { immediate: true });
  }

  // Теперь переключаемся в личный кабинет
  isLoggedIn = true;
  if (loginText) loginText.textContent = 'Личный кабинет';

  if (mainContentWrapper) mainContentWrapper.classList.add('visible-padding');
  void mainContentWrapper?.offsetHeight;

  makeInvisible(main);
  makeInvisible(form);
  makeVisible(personalAccount);
}

// Показ галереи
async function showGallery(el, { duration = SHOW_DURATION } = {}) {
  if (!el) return Promise.resolve();

  // если уже видна, ничего не делаем
  if (el.classList.contains('visible') && !el.classList.contains('invisible')) {
    return Promise.resolve();
  }

  // очистим потенциальные конфликтующие классы
  el.classList.remove('hidden', 'invisible');
  el.style.display = '';
  el.style.overflow = 'hidden';
  el.style.transition = 'none';
  el.style.maxHeight = '0px';
  el.style.opacity = '0';
  el.style.paddingTop = '0px';
  el.style.paddingBottom = '0px';
  void el.offsetHeight;

  el.classList.add('visible');

  const targetHeight = el.scrollHeight;
  el.style.transition = `max-height ${duration}ms ease, opacity ${duration}ms ease, padding ${duration}ms ease`;
  el.style.maxHeight = targetHeight + 'px';
  el.style.opacity = '1';
  el.style.paddingTop = '120px';
  el.style.paddingBottom = '60px';

  return new Promise((resolve) => {
    const onEnd = (e) => {
      if (e.propertyName === 'max-height') {
        el.style.maxHeight = '';
        el.style.transition = '';
        el.style.overflow = '';
        el.removeEventListener('transitionend', onEnd);
        resolve();
      }
    };
    el.addEventListener('transitionend', onEnd);

    setTimeout(() => {
      el.style.maxHeight = '';
      el.style.transition = '';
      el.style.overflow = '';
      el.removeEventListener('transitionend', onEnd);
      resolve();
    }, duration + 100);
  });
}

// ---------- Обработчики ----------
if (loginButton) loginButton.addEventListener('click', showForm);
if (logo) logo.addEventListener('click', showMain);
if (submitButton) submitButton.addEventListener('click', showPersonalAccount);
if (galleryButton) galleryButton.addEventListener('click', showGallerySection);

/* Debug: раскомментируйте на время, чтобы увидеть кто меняет gallery */
const debugGallery = getGalleryElement();
if (debugGallery) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.type === 'attributes') {
        console.log('[DEBUG] gallery mutation:', m.attributeName, '->', debugGallery.className, debugGallery.getAttribute('style'));
      }
    });
  });
  observer.observe(debugGallery, { attributes: true, attributeFilter: ['class','style'] });
  // Для продакшена - отключите observer.disconnect();
}