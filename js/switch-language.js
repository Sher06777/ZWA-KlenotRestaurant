(function () {
  const languageBtn = document.querySelector('.language-btn');
  if (!languageBtn) return;

  const label = languageBtn.querySelector('.lang-label');
  const options = languageBtn.querySelector('.language-options');

  // Toggle при клике на LANGUAGE
  languageBtn.addEventListener('click', e => {
    e.stopPropagation();
    languageBtn.classList.toggle('active');
  });

  // Клик на CZ/ENG
  options.querySelectorAll('span').forEach(opt => {
    opt.addEventListener('click', e => {
      languageBtn.classList.remove('active');
    });
  });

  // Клик вне кнопки закрывает список
  document.addEventListener('click', () => {
    languageBtn.classList.remove('active');
  });

  // Esc закрывает
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') languageBtn.classList.remove('active');
  });
})();