export function initReviews() {
  const wrapper = document.querySelector('.reviews-columns-wrapper');
  if (!wrapper) return;
  const btnDown = document.querySelector('.scroll-down');
  const btnUp = document.querySelector('.scroll-up');
  if (!btnDown && !btnUp) return;
  const scrollAmount = wrapper.clientHeight * 0.9;
  btnDown?.addEventListener('click', () => { wrapper.scrollBy({ top: scrollAmount, behavior: 'smooth' }); });
  btnUp?.addEventListener('click', () => { wrapper.scrollBy({ top: -scrollAmount, behavior: 'smooth' }); });
}
