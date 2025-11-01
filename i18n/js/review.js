(function() {
  // контейнер с отзывами
  const wrapper = document.querySelector('.reviews-columns-wrapper');
  if (!wrapper) return;

  // кнопки прокрутки
  const btnDown = document.querySelector('.scroll-down');
  const btnUp = document.querySelector('.scroll-up');

  if (!btnDown && !btnUp) return;

  // на сколько прокручиваем за один клик (90% высоты видимой области)
  const scrollAmount = wrapper.clientHeight * 0.9;

  // прокрутка вниз
  btnDown?.addEventListener('click', () => {
    wrapper.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  });

  // прокрутка вверх
  btnUp?.addEventListener('click', () => {
    wrapper.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
  });

})();

