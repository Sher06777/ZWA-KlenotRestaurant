// --------- SPA с плавной анимацией ---------

// Получаем все основные элементы
const mainContent = document.getElementById('main');
const gallerySection = document.getElementById('gallery-section');
const formMain = document.querySelector('.form-main');
const loginFormSection = document.querySelector('.login-form-section');
const personalAccount = document.querySelector('.personal-account');
const mainContentWrapper = document.querySelector('.main-content-wrapper'); // account-wrapper
const header = document.getElementById('dropped-menu');
const footer = document.querySelector('footer');
const logo = document.querySelector('.logo');
const loginButton = document.querySelector('.login-btn');
const galleryBtn = document.querySelector('.gallery-btn');
const regestrationButton = document.querySelector('.form-regestration-btn');
const submitSigninButton = document.querySelector('.form-submit-button--signin');
const submitRegisterButton = document.querySelector('.form-submit-button--register');
const loginText = document.querySelector('.login-text');

// Проверка наличия элементов (только предупреждение)
if (!mainContent || !gallerySection || !formMain || !loginFormSection || !personalAccount) {
  console.warn('Не все элементы SPA найдены на странице.');
}

// --------- Функции анимации (фикс: скрываем display после fadeOut) ---------
const ANIM_MS = 500;

const fadeOut = (el, callback) => {
  if (!el) { if (callback) callback(); return; }

  // если уже скрыт — ничего не делаем
  const computed = window.getComputedStyle(el);
  if (computed.display === 'none' || el.classList.contains('invisible')) {
    if (callback) callback();
    return;
  }

  el.style.transition = `opacity ${ANIM_MS}ms ease`;
  el.style.pointerEvents = 'none';
  // триггерим реальную анимацию
  requestAnimationFrame(() => {
    el.style.opacity = '0';
    el.classList.remove('visible');
    el.classList.add('invisible');
  });

  // По завершении ставим display:none чтобы элемент не занимал место
  setTimeout(() => {
    el.style.display = 'none';
    if (typeof callback === 'function') callback();
  }, ANIM_MS);
};

const fadeIn = (el) => {
  if (!el) return;

  // если уже виден — ничего не делаем
  const computed = window.getComputedStyle(el);
  if (computed.display !== 'none' && el.classList.contains('visible')) {
    return;
  }

  // делаем элемент видимым и запускаем анимацию
  el.style.display = '';         // пусто — пусть CSS определяет, можно поставить 'block' если нужно
  el.style.opacity = '0';
  el.style.pointerEvents = 'none';
  el.classList.remove('invisible');
  el.classList.add('visible');

  requestAnimationFrame(() => {
    el.style.transition = `opacity ${ANIM_MS}ms ease`;
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
  });
};

// --------- Состояние входа (в рамках текущей сессии / SPA) ---------
let loggedIn = false;
function setLoggedIn(status) { loggedIn = !!status; }
function isLoggedIn() { return !!loggedIn; }

// --------- Управление отображением блока account-wrapper ---------
function showAccountWrapper() {
  if (!mainContentWrapper) return;
  mainContentWrapper.classList.remove('invisible');
  mainContentWrapper.classList.add('visible');
  mainContentWrapper.style.display = ''; // покажем
}

function hideAccountWrapper() {
  if (!mainContentWrapper) return;
  mainContentWrapper.classList.remove('visible');
  mainContentWrapper.classList.add('invisible');
  mainContentWrapper.style.display = 'none';
}

// --------- Функция показа секции ---------
function showSection(section) {
  const allSections = [mainContent, gallerySection, formMain, loginFormSection, personalAccount].filter(Boolean);

  allSections.forEach(el => {
    if (el === section) fadeIn(el);
    else fadeOut(el);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------- Инициализация SPA ---------
document.addEventListener('DOMContentLoaded', () => {
  // стартовое состояние
  fadeIn(mainContent);
  [gallerySection, formMain, loginFormSection, personalAccount].forEach(el => { if (el) { el.classList.add('invisible'); el.style.display = 'none'; el.style.opacity = '0'; } });
  hideAccountWrapper();

  // ---------- Кнопки ----------
  galleryBtn?.addEventListener('click', e => {
    e.preventDefault();
    showSection(gallerySection);
    hideAccountWrapper();
  });

  logo?.addEventListener('click', e => {
    e.preventDefault();
    // если галерея показана — анимируем назад; иначе просто показываем main
    if (gallerySection && gallerySection.classList.contains('visible')) {
      showSection(mainContent);
    } else {
      showSection(mainContent);
    }
    hideAccountWrapper();
  });

  loginButton?.addEventListener('click', e => {
    e.preventDefault();
    if (isLoggedIn()) {
      showSection(personalAccount);
      loginText && (loginText.textContent = 'Личный кабинет');
      showAccountWrapper();
    } else {
      showSection(formMain);
      hideAccountWrapper(); // при показе формы скрываем account-wrapper
    }
  });

  regestrationButton?.addEventListener('click', e => {
    e.preventDefault();
    showSection(loginFormSection);
    hideAccountWrapper();
  });

  // ---------- Вход / регистрация ----------
  const onLoginOrRegister = () => {
    setLoggedIn(true);
    showSection(personalAccount);
    loginText && (loginText.textContent = 'Личный кабинет');
    showAccountWrapper();
  };

  submitRegisterButton?.addEventListener('click', e => { e.preventDefault(); onLoginOrRegister(); });
  submitSigninButton?.addEventListener('click', e => { e.preventDefault(); onLoginOrRegister(); });
});

// --------- Вспомогательные функции (не используются в анимации но оставлю) ---------
function makeVisible(el) { if(!el) return; el.classList.remove('invisible'); el.classList.add('visible'); el.style.display = ''; el.style.opacity = '1'; el.style.pointerEvents = 'auto'; }
function makeInvisible(el) { if(!el) return; el.classList.remove('visible'); el.classList.add('invisible'); el.style.display = 'none'; el.style.opacity = '0'; el.style.pointerEvents = 'none'; }
