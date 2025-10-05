let isLoggedIn = false;
const loginButton = document.querySelector('.login-btn');
const logo = document.querySelector('.logo');
const main = document.querySelector('#main');
const form = document.querySelector('.form-main');
const personalAccount = document.querySelector('.personal-account')
const submitButton = document.querySelector('.form-submit-button')
const loginText = document.querySelector('.login-text')
const mainContentWrapper = document.querySelector('.main-content-wrapper');


// Появление формы с анимацией
const showForm = () => {
  if (isLoggedIn) {
    // если уже вошёл — сразу показываем личный кабинет
    main.classList.add('invisible');
    main.classList.remove('visible');

    form.classList.add('invisible');
    form.classList.remove('visible');

    personalAccount.classList.add('visible');
    personalAccount.classList.remove('invisible');
    mainContentWrapper.classList.add('active-padding');
    return;
  }

  main.classList.add('invisible');
  main.classList.remove('visible');

  form.classList.add('visible');
  form.classList.remove('invisible');

  personalAccount.classList.add('invisible');
  personalAccount.classList.remove('visible');

  mainContentWrapper.classList.remove('active-padding');
};

// Показ main мгновенно (без анимации)
const showMainInstant = () => {
  // Убираем transition временно
  form.style.transition = 'none';
  main.style.transition = 'none';

  form.classList.remove('visible');
  form.classList.add('invisible');

  main.classList.remove('invisible');
  main.classList.add('visible');

  personalAccount.classList.remove('visible');
  personalAccount.classList.add('invisible');

  mainContentWrapper.classList.remove('active-padding');

  // Форсируем браузер применить изменения
  void form.offsetHeight;

  // Возвращаем transition сразу
  form.style.transition = '';
  main.style.transition = '';
};

const showPersonalAccount = (e) => {
  e.preventDefault();
  isLoggedIn = true;

  form.classList.add('invisible');
  form.classList.remove('visible');
  loginText.innerHTML = 'Личный кабинет';
  

  personalAccount.classList.add('visible');
  personalAccount.classList.remove('invisible');

  mainContentWrapper.classList.add('active-padding');
}


// Обработчики
loginButton.addEventListener('click', showForm);
logo.addEventListener('click', showMainInstant);
submitButton.addEventListener('click', showPersonalAccount);