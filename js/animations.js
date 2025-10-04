// ====================== СЛАЙДЕР ======================
const slides = document.querySelectorAll('.slider-image-item');
const progressFill = document.querySelector('.slider-progress-fill');
const progressValues = [0.66, 0.33, 0];
const radios = [
  document.getElementById('slider-switch-1'),
  document.getElementById('slider-switch-2'),
  document.getElementById('slider-switch-3')
];


let current = 0;
const showSlide = (index) => {
    current = index;

    slides.forEach((slide, i) => {
        if (i === index) {
            slide.classList.add('active');
            radios[i].checked = true;
        } else {
            slide.classList.remove('active');
            radios[i].checked = false;
        }
    });

    
    progressFill.style.transform = `scaleY(${progressValues[index]})`;

}

const nextSlide = () => {
    showSlide((current + 1) % slides.length);
}

radios.forEach((radio, i) => {
    radio.addEventListener('change', () => {
        showSlide(i);
    });
});

showSlide(current);
setInterval(nextSlide, 7000);


// ====================== АНИМАЦИЯ КНОПКИ ======================
const btn = document.querySelector('.login-btn');
const path = btn.querySelector('.border-path');

btn.addEventListener('mouseenter', () => {
  const width = btn.offsetWidth;
  const height = btn.offsetHeight;
  const svg = btn.querySelector('svg');

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

btn.addEventListener('mouseleave', () => {
  const pathLength = path.getTotalLength();
  path.style.transition = 'stroke-dashoffset 0.5s ease';
  path.style.strokeDashoffset = pathLength;
});