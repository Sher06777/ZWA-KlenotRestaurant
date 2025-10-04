const loginButton = document.querySelector('.login-btn');
const logo = document.querySelector('.logo');
const main = document.querySelector('#main');
const form = document.querySelector('.form-main');

// Появление формы с анимацией
const showForm = () => {
  main.classList.add('invisible');
  main.classList.remove('visible');

  form.classList.add('visible');
  form.classList.remove('invisible');
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

  // Форсируем браузер применить изменения
  void form.offsetHeight;

  // Возвращаем transition сразу
  form.style.transition = '';
  main.style.transition = '';
};

loginButton.addEventListener('click', showForm);
logo.addEventListener('click', showMainInstant);