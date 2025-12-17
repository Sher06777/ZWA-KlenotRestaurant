// language-dropdown.js

export function initLanguageDropdown() {
  const languageBtn = document.querySelector('.language-btn');
  if (!languageBtn) return;

  languageBtn.addEventListener('click', e => {
    e.stopPropagation();
    languageBtn.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    languageBtn.classList.remove('active');
  });
}
