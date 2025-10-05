const slides = document.querySelectorAll('.slider-image-item');
const progressFill = document.querySelector('.slider-progress-fill');
const radios = [
    document.getElementById('slider-switch-1'),
    document.getElementById('slider-switch-2'),
    document.getElementById('slider-switch-3')
];

let current = 0;

const progressValues = [0.66, 0.33, 0];

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


document.addEventListener("DOMContentLoaded", () => {
    const galleryLink = document.querySelector(".main-menu-button:nth-child(4)");
    const aboutLink = document.querySelector('.main-menu-button a[href="#about-us"]');
    const logoLink = document.querySelector(".logo img");
    const gallerySection = document.getElementById("gallery-section");
    const allSections = document.querySelectorAll("section, .divider, .slider-wrapper");

    //  Переход в галерею 
    galleryLink.addEventListener('click', (e) => {
        e.preventDefault();

        startLoader(() => {
            // скрытие секций
            allSections.forEach(section => section.classList.add('hidden'));

            // отображение галереи
            setTimeout(() => {
                gallerySection.classList.add('active');
                gallerySection.classList.remove('hidden');
            }, 600);
        });
    });

    //  Возврат на главную по клику на логотип 
    const logo = document.querySelector('.logo img');

    logo.addEventListener('click', (e) => {
        e.preventDefault();

        startLoader(() => {    // скрываем галерею и показываем всё обратно
            document.getElementById('gallery-section').classList.remove('active');
            allSections.forEach(section => section.classList.remove('hidden'));
        });
    });

    //  Переход в "О нас" (если галерея открыта) 
    aboutLink.addEventListener("click", (e) => {
        e.preventDefault();
        startLoader(() => {
            if (gallerySection.classList.contains("active")) {
                gallerySection.classList.remove("active");
                gallerySection.classList.add("hidden");

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
    zoomContainer.classList.add('active');
    zoomContainer.style.display = 'flex';
};

const normalSize = () => {
    const zoomContainer = document.getElementById('zoom');
    zoomContainer.classList.remove('active');
    setTimeout(() => {
        zoomContainer.style.display = 'none';
    }, 400);
};

const showLoader = () => {
    const loader = document.getElementById('loader');
    loader.classList.add('active');
    loader.style.display = 'flex';
}

const hideLoader = () => {
    const loader = document.getElementById('loader');
    loader.classList.remove('active');
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

