document.addEventListener('DOMContentLoaded', () => {
  const mobileToggle = document.querySelector('.menu-mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileClose = mobileMenu.querySelector('.mobile-menu-close');

    mobileToggle.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    document.querySelector('main').classList.add('invisible');  // скрываем основной контент
    });

    mobileClose.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    document.querySelector('main').classList.remove('invisible'); // показываем обратно
    });

  // закрыть по клику на фон
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) mobileMenu.classList.remove('active');
  });
});