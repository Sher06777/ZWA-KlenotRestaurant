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
            slide.classList.add('visible');
            radios[i].checked = true;
        } else {
            slide.classList.remove('visible');
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


const showLoader = () => {
    const loader = document.getElementById('loader');
    loader.classList.add('visible');
    loader.style.display = 'flex';
}

const hideLoader = () => {
    const loader = document.getElementById('loader');
    loader.classList.remove('visible');
    setTimeout(() => {
        loader.style.display = 'none';
    }, 300); // ждём пока opacity спадёт
}

const startLoader = (callback) => {
    showLoader();
    const minTime = 1000; // 1 секунда минимум
    const start = Date.now();

    Promise.resolve(callback()).then(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, minTime - elapsed);
        setTimeout(() => hideLoader(), remaining);
    });
}

const dateInput = document.getElementById('dateInput');
const timeInput = document.getElementById('timeInput');

dateInput.addEventListener('click', () => {
    if (dateInput.showPicker) dateInput.showPicker();
});

timeInput.addEventListener('click', () => {
    if (timeInput.showPicker) timeInput.showPicker();
});

document.addEventListener('DOMContentLoaded', () => {
  const heroWrap = document.getElementById('menu-3d-hero');
  const container = document.getElementById('menu-3d-container');

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


  const isMobile = /Mobi|Android/i.test(navigator.userAgent);

  if (isMobile && window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      // e.beta: наклон вперёд/назад (-180..180)
      // e.gamma: наклон влево/вправо (-90..90)
      // можно подстроить множители под желаемый эффект
      targetRotX = e.beta / 8;   // наклон вперёд/назад
      targetRotY = e.gamma / 8;  // наклон влево/вправо
    }, true);
  };

  const animate = () => {
    // плавное приближение к цели
    rotX += (targetRotX - rotX) * 0.1;
    rotY += (targetRotY - rotY) * 0.1;
    container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    requestAnimationFrame(animate);
  };


  animate();

  if (!isMobile) {
    // только для ПК
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleTouchMove, {passive:true});
  }
});
