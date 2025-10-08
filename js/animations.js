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
  const path = container.querySelector(pathSelector);
  const svg = container.querySelector('svg');

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

// Инициализация для кнопки "Войти"
addBorderAnimation('.login-btn', '.border-path');

// Инициализация для логотипа
addBorderAnimation('.logo-wrap', '.logo-border-path');



document.addEventListener("DOMContentLoaded", () => {
    // const galleryLink = document.querySelector(".main-menu-button:nth-child(4)");
    // const aboutLink = document.querySelector('.main-menu-button a[href="#about-us"]');
    // const logoLink = document.querySelector(".logo img");
    // const gallerySection = document.getElementById("gallery-section");
    // const allSections = document.querySelectorAll("section, .divider, .slider-wrapper");

    // //  Переход в галерею 
    // galleryLink.addEventListener('click', (e) => {
    //     e.preventDefault();

    //     startLoader(() => {
    //         // скрытие секций
    //         allSections.forEach(section => section.classList.add('hidden'));

    //         // отображение галереи
    //         setTimeout(() => {
    //             gallerySection.classList.add('active');
    //             gallerySection.classList.remove('hidden');
    //         }, 600);
    //     });
    // });

    // //  Возврат на главную по клику на логотип 
    // const logo = document.querySelector('.logo img');

    // logo.addEventListener('click', (e) => {
    //     e.preventDefault();

    //     startLoader(() => {    // скрываем галерею и показываем всё обратно
    //         document.getElementById('gallery-section').classList.remove('active');
    //         allSections.forEach(section => section.classList.remove('hidden'));
    //     });
    // });

    //  Переход в "О нас" (если галерея открыта) 
    aboutLink.addEventListener("click", (e) => {
        e.preventDefault();
        startLoader(() => {
            if (gallerySection.classList.contains("visible")) {
                // используем hideGallery, если предпочитаете — но минимум:
                gallerySection.classList.remove("visible");
                gallerySection.classList.add("invisible", "hidden");
                // и обязательно сброс inline-стилей
                gallerySection.style.opacity = '';
                gallerySection.style.paddingTop = '';
                gallerySection.style.paddingBottom = '';
                gallerySection.style.maxHeight = '';
                gallerySection.style.display = 'none';

                setTimeout(() => {
                    allSections.forEach((section) => section.classList.remove("hidden"));
                    document.querySelector("#about-us").scrollIntoView({ behavior: "smooth" });
                }, 400);
            } else {
                document.querySelector("#about-us").scrollIntoView({ behavior: "smooth" });
            }
        });
    });
});

//  Функции Zoom 
const zoom = (img) => {
    const description = img.alt || '';
    const zoomContainer = document.getElementById('zoom');
    const zoomImg = document.getElementById('zoom-img');
    const zoomDesc = document.getElementById('zoom-description');

    zoomImg.src = img.src;
    zoomDesc.textContent = description;
    zoomContainer.classList.add('visible');
    zoomContainer.style.display = 'flex';
};

const normalSize = () => {
    const zoomContainer = document.getElementById('zoom');
    zoomContainer.classList.remove('visible');
    setTimeout(() => {
        zoomContainer.style.display = 'none';
    }, 400);
};

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

