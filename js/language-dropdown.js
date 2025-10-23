document.addEventListener('DOMContentLoaded', () => {
  const languageBtn = document.querySelector('.language-btn');
  const languageOptions = document.querySelector('.language-options');

  if (!languageBtn || !languageOptions) return;

  // При клике на кнопку Language — показать / скрыть меню
  languageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    languageBtn.classList.toggle('active'); // <– добавляем или убираем класс
  });

  // Клик вне меню — закрывает меню
  document.addEventListener('click', () => {
    languageBtn.classList.remove('active');
  });
});

