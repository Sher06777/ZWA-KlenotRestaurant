// --------- Логика кнопки "Войти" на главной ---------
const loginButton = document.querySelector('.login-btn');
if (loginButton) {
  loginButton.addEventListener('click', e => {
    e.preventDefault();

    // получаем путь текущей страницы
    const currentPath = window.location.pathname;

    // если мы уже на странице login/account.html, просто ничего не делаем
    if (currentPath.endsWith('login/account.html')) {
      // можно просто вернуть или перезагрузить страницу
      return;
    }

    // иначе делаем редирект
    window.location.href = 'login/account.html';
  });
}

// --------- Логика логотипа ---------
const logo = document.querySelector('.logo');
if(logo){
  logo.addEventListener('click', e => {
    e.preventDefault();
    window.location.href = '/index.html'; // всегда ведёт на главную сайта
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const galleryBtn = document.querySelector('.gallery-btn');
  const gallerySection = document.getElementById('gallery-section');
  const mainContent = document.getElementById('main');
  const header = document.getElementById('dropped-menu');
  const footer = document.querySelector('footer');
  const logo = document.querySelector('.logo');

  if (!gallerySection || !mainContent || !header || !footer) return;

  // Плавное скрытие элемента
  const fadeOut = (el, callback) => {
    if(!el) return;
    el.style.opacity = 1;
    el.style.transition = 'opacity 0.5s ease';
    el.style.pointerEvents = 'none';
    el.style.opacity = 0;

    el.classList.remove('visible');
    el.classList.add('invisible');
    if(callback) callback();
  };

  // Плавное появление элемента
  const fadeIn = (el) => {
    if(!el) return;
    el.classList.remove('invisible');
    el.classList.add('visible');
    el.style.display = 'block';
    el.style.opacity = 0;

    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = 1;
    });
  };

  // Показ галереи с анимацией
  const showGallery = () => {
    fadeOut(mainContent, () => {
      fadeIn(gallerySection);
      if(header) header.classList.add('visible');
      if(footer) footer.classList.add('visible');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Показ главного контента с анимацией (обратный путь из галереи)
  const showMainContent = () => {
    fadeOut(gallerySection, () => {
      fadeIn(mainContent);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Клик на кнопку "Галерея"
  if(galleryBtn){
    galleryBtn.addEventListener('click', e => {
      e.preventDefault();
      showGallery();
    });
  }

  // Клик на логотип
  if(logo){
    logo.addEventListener('click', e => {
      e.preventDefault();

      // Если сейчас видна галерея, анимируем обратно
      if(gallerySection.classList.contains('visible')){
        showMainContent();
      } else {
        // Иначе просто редирект на главную
        window.location.href = '/index.html';
      }
    });
  }
});

// --------- Если мы на login/account.html ---------
const formMain = document.querySelector('.form-main');
const loginFormSection = document.querySelector('.login-form-section');
const personalAccount = document.querySelector('.personal-account');
const regestrationButton = document.querySelector('.form-regestration-btn');
const submitSigninButton = document.querySelector('.form-submit-button--signin');
const submitRegisterButton = document.querySelector('.form-submit-button--register');
const loginText = document.querySelector('.login-text');
const mainContentWrapper = document.querySelector('.main-content-wrapper');

function makeVisible(el){ if(!el) return; el.classList.remove('invisible'); el.classList.add('visible'); }
function makeInvisible(el){ if(!el) return; el.classList.remove('visible'); el.classList.add('invisible'); }

function initAccountPageLogic(){
  if(!formMain) return; // если нет формы — не инициализируем

  // начальное состояние
  makeVisible(formMain);
  makeInvisible(loginFormSection);
  makeInvisible(personalAccount);

  // Don't have account? -> показать регистрацию
  if(regestrationButton){
    regestrationButton.addEventListener('click', e => {
      e.preventDefault();
      makeInvisible(formMain);
      makeVisible(loginFormSection);
    });
  }

  // Создать аккаунт -> показываем personal-account
  if(submitRegisterButton){
    submitRegisterButton.addEventListener('click', e => {
      e.preventDefault();
      makeInvisible(formMain);
      makeInvisible(loginFormSection);
      makeVisible(personalAccount);
      if(loginText) loginText.textContent = 'Личный кабинет';
      if(mainContentWrapper) mainContentWrapper.classList.add('visible-padding');
    });
  }

  // Войти -> показываем personal-account
  if(submitSigninButton){
    submitSigninButton.addEventListener('click', e => {
      e.preventDefault();
      makeInvisible(formMain);
      makeInvisible(loginFormSection);
      makeVisible(personalAccount);
      if(loginText) loginText.textContent = 'Личный кабинет';
      if(mainContentWrapper) mainContentWrapper.classList.add('visible-padding');
    });
  }
}

document.addEventListener('DOMContentLoaded', initAccountPageLogic);
