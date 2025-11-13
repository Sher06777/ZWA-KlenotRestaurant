// const head = document.querySelector('head');
// const myBlock = document.getElementById('dropped-menu');

// function showBlock() {
//   myBlock.classList.add('visible');
// }

// setTimeout(showBlock, 100);

const menu = document.getElementById('dropped-menu');
const triggerPoint = menu.offsetHeight / 3; // 1/3 высоты меню

window.addEventListener('scroll', () => {
  if (window.scrollY > triggerPoint) {
    menu.classList.add('scrolled');
  } else {
    menu.classList.remove('scrolled');
  }
});


const menuHeight = 120; // высота меню
const hero = document.querySelector('.hero');

window.addEventListener('wheel', (e) => {
  e.preventDefault(); // предотвращаем стандартный скролл

  const currentScroll = window.scrollY;

  if (e.deltaY > 0) {
    // скроллим вниз на один шаг = высота меню
    window.scrollTo({
      top: currentScroll + menuHeight,
      behavior: 'smooth'
    });
  } else {
    // скроллим вверх
    window.scrollTo({
      top: currentScroll - menuHeight,
      behavior: 'smooth'
    });
  }
}, { passive: false });