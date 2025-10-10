// --------- SPA с плавной анимацией ---------

// Получаем все основные элементы
const mainContent = document.getElementById('main');
const gallerySection = document.getElementById('gallery-section');
const formMain = document.querySelector('.form-main');
const loginFormSection = document.querySelector('.login-form-section');
const personalAccount = document.querySelector('.personal-account');
const mainContentWrapper = document.querySelector('.main-content-wrapper');
const header = document.getElementById('dropped-menu');
const footer = document.querySelector('footer');
const logo = document.querySelector('.logo');
const loginButton = document.querySelector('.login-btn');
const galleryBtn = document.querySelector('.gallery-btn');
const regestrationButton = document.querySelector('.form-regestration-btn');
const submitSigninButton = document.querySelector('.form-submit-button--signin');
const submitRegisterButton = document.querySelector('.form-submit-button--register');
const loginText = document.querySelector('.login-text');

// Проверка наличия элементов
if (!mainContent || !gallerySection || !formMain || !loginFormSection || !personalAccount) {
  console.warn('Не все элементы SPA найдены на странице.');
}

// --------- Функции анимации ---------
const fadeOut = (el, callback) => {
  if (!el) return;
  el.style.opacity = 1;
  el.style.transition = 'opacity 0.5s ease';
  el.style.pointerEvents = 'none';
  el.style.opacity = 0;

  el.classList.remove('visible');
  el.classList.add('invisible');

  if (callback) setTimeout(callback, 500); // ждём окончания анимации
};

const fadeIn = (el) => {
  if (!el) return;
  el.classList.remove('invisible');
  el.classList.add('visible');
  el.style.display = 'block';
  el.style.opacity = 0;

  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = 1;
    el.style.pointerEvents = 'auto';
  });
};


let loggedIn = false;

function setLoggedIn(status) {
  loggedIn = status;
}

function isLoggedIn() {
  return loggedIn;
}


// --------- Функция показа секции ---------
function showSection(section) {
  const allSections = [mainContent, gallerySection, formMain, loginFormSection, personalAccount];

  allSections.forEach(el => {
    if (el === section) {
      fadeIn(el);
    } else {
      fadeOut(el);
    }
  });

  // Скролл наверх при переключении
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --------- Инициализация SPA ---------
document.addEventListener('DOMContentLoaded', () => {
  // Начальное состояние: главная страница
  fadeIn(mainContent);
  [gallerySection, formMain, loginFormSection, personalAccount].forEach(makeInvisible);

  // ---------- Кнопки ----------
  galleryBtn?.addEventListener('click', e => { 
    e.preventDefault(); 
    showSection(gallerySection); 
    mainContentWrapper?.classList.remove('visible-padding');
  });

  logo?.addEventListener('click', e => {
    e.preventDefault();
    showSection(mainContent);
    mainContentWrapper?.classList.remove('visible-padding');
  });

  loginButton?.addEventListener('click', e => {
    e.preventDefault();
    if (isLoggedIn()) {
      showSection(personalAccount);
      loginText.textContent = 'Личный кабинет';
      mainContentWrapper?.classList.add('visible-padding');
    } else {
      showSection(formMain);
    }
  });

  regestrationButton?.addEventListener('click', e => { e.preventDefault(); showSection(loginFormSection); });

  // ---------- Вход / регистрация ----------
  const onLoginOrRegister = () => {
    showSection(personalAccount);
    loginText.textContent = 'Личный кабинет';
    mainContentWrapper?.classList.add('visible-padding');
    setLoggedIn(true); // сохраняем состояние входа в рамках SPA
  };

  submitRegisterButton?.addEventListener('click', e => { e.preventDefault(); onLoginOrRegister(); });
  submitSigninButton?.addEventListener('click', e => { e.preventDefault(); onLoginOrRegister(); });
});

// --------- Вспомогательные функции ---------
function makeVisible(el) { if(!el) return; el.classList.remove('invisible'); el.classList.add('visible'); }
function makeInvisible(el) { if(!el) return; el.classList.remove('visible'); el.classList.add('invisible'); }
