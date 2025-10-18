// js/menu-3d.js
document.addEventListener('DOMContentLoaded', () => {
  const heroWrap = document.getElementById('menu-3d-hero');
  const container = document.getElementById('menu-3d-container');
  const enterBtn = document.getElementById('menu-3d-enter');
  const skipBtn = document.getElementById('menu-3d-skip');
  const menuAll = document.getElementById('menu-all');

  if (!heroWrap || !container) return;

  // ------------------------
  // Параллакс мышью с плавной интерполяцией
  // ------------------------
  let rotX = 0, rotY = 0;
  let targetRotX = 0, targetRotY = 0;

  const handleMove = (e) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    targetRotY = (e.clientX - cx) * -0.008; // множитель поворота по X
    targetRotX = (e.clientY - cy) * 0.015;   // множитель поворота по Y
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) handleMove(e.touches[0]);
  };

  const animate = () => {
    // плавное приближение к цели
    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;
    container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    requestAnimationFrame(animate);
  };

  animate();

  // ------------------------
  // Функция скрытия hero
  // ------------------------
  const closeHero = () => {
    heroWrap.classList.add('hidden');
    // убираем обработчики мыши/тач
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('touchmove', handleTouchMove, {passive:true});
    // сброс transform для контейнера
    container.style.transform = '';
  };

  // ------------------------
  // Кнопки Enter и Skip
  // ------------------------
  enterBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeHero();
    if (menuAll) menuAll.scrollIntoView({behavior:'smooth'});
  });

  skipBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    closeHero();
  });


  // ------------------------
  // Первый скролл тоже закрывает hero
  // ------------------------

  // ------------------------
  // Подключаем события мыши/тач
  // ------------------------
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('touchmove', handleTouchMove, {passive:true});
});
