
const addBorderAnimation = (containerSelector, pathSelector) => {
  const container = document.querySelector(containerSelector);
  if(!container) return; // элемент отсутствует — выходим
  const path = container.querySelector(pathSelector);
  if(!path) return; // путь отсутствует — выходим
  const svg = container.querySelector('svg');
  if(!svg) return;

  container.addEventListener('mouseenter', () => {
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    // Обновляем viewBox под размер кнопки
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    // Первая линия (сверху вниз)
    const topToBottom = `
      M ${width/2} 0
      L ${width} 0
      L ${width} ${height}
      L ${width/2} ${height}
    `;
    // Вторая линия (снизу вверх)
    const bottomToTop = `
      M ${width/2} ${height}
      L 0 ${height}
      L 0 0
      L ${width/2} 0
    `;

    // Объединяем обе линии в один path
    path.setAttribute('d', topToBottom + bottomToTop);

    // Длина пути
    //  stroke-dasharray создает пунктиры: 
    // Сначала вы используете stroke-dasharray для задания массива значений, которые определяют длину "штрихов" (dash) и "пробелов" (gap) на обводке.
    //   Постепенно увеличивая stroke-dashoffset от значения, равного полной длине контура, до 0, вы делаете линию видимой, будто она рисуется. 
    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = pathLength;
    path.style.strokeDashoffset = pathLength;
    // Сбрасываем transition перед первой анимацией
    path.style.transition = 'none';


      // Запускаем анимацию через двойной requestAnimationFrame
      // Почему два раза? 
      // Первый requestAnimationFrame даёт браузеру время зарегистрировать предыдущие изменения (strokeDasharray и strokeDashoffset).
      // Второй requestAnimationFrame запускает реальную анимацию, устанавливая transition и уменьшая strokeDashoffset до 0.
      // Это создаёт эффект пошаговой анимации, а не мгновенной отрисовки.
      // Без двойного requestAnimationFrame браузер может «объединить» изменения и показать линию сразу полностью
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset 1s ease';
        path.style.strokeDashoffset = 0;
      });
    });
  });

  container.addEventListener('mouseleave', () => {
    const pathLength = path.getTotalLength();
    path.style.transition = 'stroke-dashoffset 0.5s ease';
    path.style.strokeDashoffset = pathLength;
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('.login-btn');
  if(loginBtn) addBorderAnimation('.login-btn', '.border-path');

  const logoWrap = document.querySelector('.logo-wrap');
  if(logoWrap) addBorderAnimation('.logo-wrap', '.logo-border-path');

  const regDiv = document.querySelector('.form-regestration-div');
  if(regDiv) addBorderAnimation('.form-regestration-div', '.form-regestration-border-path');
});