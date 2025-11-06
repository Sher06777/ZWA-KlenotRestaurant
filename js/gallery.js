document.addEventListener("DOMContentLoaded", () => {
    // --- Конфигурация ---
    const DRAG_SENSITIVITY = 0.4;
    const INERTIA_DAMPING = 0.98;
    const BASE_AUTOROTATE_SPEED = 0.05;
    const ZOOM_TRANSITION_DURATION = 400;
    const KEYBOARD_NUDGE = 2;

    // --- Выборка DOM-элементов ---
    const gallerySection = document.getElementById("gallery-section");
    const ring = document.querySelector(".gallery-ring");
    const items = document.querySelectorAll(".gallery-item");
    const zoom = document.getElementById("zoom");
    const zoomImg = document.getElementById("zoom-img");
    const zoomDesc = document.getElementById("zoom-description");
    const zoomClose = document.getElementById("zoom-close");
    const zoomPrev = document.getElementById("zoom-prev");
    const zoomNext = document.getElementById("zoom-next");

    if (!gallerySection || !ring || !items.length || !zoom || !zoomPrev || !zoomNext) {
        console.warn("Галерея или ее компоненты (включая #zoom-prev/next) не найдены.");
        return;
    }

    // --- Состояние (State) ---
    let radius = 450;
    const total = items.length;
    const itemData = [];
    let currentRotation = 0;
    let velocity = BASE_AUTOROTATE_SPEED;
    let isDragging = false;
    let lastX = 0;
    let autoRotate = true;
    let isPaused = false;
    let currentZoomIndex = 0;

    // ID для старта/остановки анимации
    let animationFrameId = null;

    // Состояния для Observer'ов (для остановки анимации)
    let isIntersecting = false; // Виден ли во вьюпорте
    let isVisible = !gallerySection.classList.contains('invisible'); // Нет ли класса invisible

    const RAD_FACTOR = Math.PI / 180;
    const roundTo = v => Math.round(v * 2) / 2;
    function debounce(func, wait = 100) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // --- Инициализация ---

    // Адаптивный радиус
    const updateRadius = () => {
        const w = window.innerWidth;
        if (w <= 480) radius = 230;
        else if (w <= 768) radius = 300;
        else if (w <= 1024) radius = 400;
        else radius = 450;
    };
    updateRadius();
    window.addEventListener("resize", debounce(updateRadius));

    //  Кэширование данных элементов (включая src и alt для лайтбокса)
    items.forEach((item, i) => {
        const angle = (i / total) * 360;
        const img = item.querySelector("img");
        itemData.push({
            el: item,
            angle: angle,
            src: img ? img.src : '',
            alt: img ? img.alt : ''
        });
    });

    // --- Логика Анимации ---

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        if (isPaused) { velocity = 0; }
        else if (isDragging) { /* Cкорость обновляется в moveDrag */ }
        else if (autoRotate) { velocity = BASE_AUTOROTATE_SPEED; }
        else {
            velocity *= INERTIA_DAMPING; // Затухание
            if (Math.abs(velocity) < 0.01) {
                velocity = 0;
                autoRotate = true;
            }
        }
        currentRotation += velocity;

        itemData.forEach(itemInfo => {
            const angle = itemInfo.angle;
            const totalAngle = angle + currentRotation; // Полный угол
            const rad = totalAngle * RAD_FACTOR;

            const x = roundTo(radius * Math.sin(rad));
            const z = roundTo(radius * Math.cos(rad));

            itemInfo.el.style.transform = `translate3d(${x}px, 0, ${z}px)`;
        });
    }

    function startAnimation() {
        if (!animationFrameId && isIntersecting && isVisible) {
            animate();
        }
    }

    function stopAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // Центральная функция для принятия решения
    function checkAnimationState() {
        if (isIntersecting && isVisible) {
            startAnimation();
        } else {
            stopAnimation();
        }
    }

    // --- Обработчики Перетаскивания (Drag) ---
    const startDrag = (x) => {
        isDragging = true;
        autoRotate = false;
        velocity = 0;
        lastX = x;
    };
    const moveDrag = (x) => {
        if (!isDragging) return;
        const delta = (x - lastX);
        const rotationDelta = delta * DRAG_SENSITIVITY;
        currentRotation += rotationDelta;
        velocity = rotationDelta;
        lastX = x;
    };
    const endDrag = () => { isDragging = false; };

    ring.addEventListener("mousedown", e => startDrag(e.clientX));
    window.addEventListener("mousemove", e => moveDrag(e.clientX));
    window.addEventListener("mouseup", endDrag);
    ring.addEventListener("touchstart", e => startDrag(e.touches[0].clientX), { passive: true });
    ring.addEventListener("touchmove", e => { e.preventDefault(); moveDrag(e.touches[0].clientX); }, { passive: false });
    ring.addEventListener("touchend", endDrag);

    // --- Обработчики Zoom ---

    // Функция для отображения/смены картинки в зуме
    const showZoomedImage = (index) => {
        if (index < 0 || index >= total) return;

        const item = itemData[index];
        currentZoomIndex = index;

        // Плавная смена через opacity (убедитесь, что в CSS есть transition)
        zoomImg.style.opacity = 0;
        zoomDesc.style.opacity = 0;

        setTimeout(() => {
            zoomImg.src = item.src;
            zoomDesc.textContent = item.alt;
            zoomImg.style.opacity = 1;
            zoomDesc.style.opacity = 1;
        }, 150); // Чуть меньше, чем transition duration
    };

    // Закрытие
    const closeZoom = () => {
        zoom.classList.remove("visible");
        zoomImg.style.transform = "scale(1)";
        setTimeout(() => {
            zoom.style.display = "none";
            zoomImg.src = "";
        }, ZOOM_TRANSITION_DURATION);
    };

    // Открытие (назначаем на кэшированные данные)
    itemData.forEach((itemInfo, index) => {
        itemInfo.el.addEventListener("click", (e) => {
            e.stopPropagation();
            showZoomedImage(index); // Открываем по индексу

            zoomImg.style.transform = "scale(1)";
            zoom.style.display = "flex";
            requestAnimationFrame(() => zoom.classList.add("visible"));
        });
    });

    // Обработчики закрытия и навигации в зуме
    zoom.addEventListener("click", closeZoom);
    zoomClose.addEventListener("click", closeZoom);

    zoomNext.addEventListener("click", (e) => {
        e.stopPropagation();
        const nextIndex = (currentZoomIndex + 1) % total; // Зацикливание
        showZoomedImage(nextIndex);
    });

    zoomPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        const prevIndex = (currentZoomIndex - 1 + total) % total; // Зацикливание
        showZoomedImage(prevIndex);
    });

    // --- Обработчики Доступности (A11y) ---

    window.addEventListener("keydown", (e) => {
        // Сначала проверяем, открыт ли зум
        if (zoom.classList.contains("visible")) {
            if (e.key === "ArrowRight") {
                e.preventDefault();
                const nextIndex = (currentZoomIndex + 1) % total;
                showZoomedImage(nextIndex);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                const prevIndex = (currentZoomIndex - 1 + total) % total;
                showZoomedImage(prevIndex);
            } else if (e.key === "Escape") {
                closeZoom();
            }
            return; // Не даем управлять кольцом, пока открыт зум
        }

        // Если зум не открыт, управляем кольцом
        if (e.key === "ArrowRight") {
            autoRotate = false;
            velocity = -KEYBOARD_NUDGE;
        } else if (e.key === "ArrowLeft") {
            autoRotate = false;
            velocity = KEYBOARD_NUDGE;
        }
    });

    const pauseBtn = document.getElementById("gallery-pause-btn");

    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            isPaused = !isPaused;
            autoRotate = !isPaused;

            pauseBtn.classList.toggle('is-paused', isPaused);

            pauseBtn.setAttribute("aria-label", isPaused ? "Возобновить анимацию" : "Приостановить анимацию");


        });
    }

    // --- Intersection & Mutation Observers (Запуск/Остановка анимации) ---

    // 1. Intersection Observer (Следит за Скроллом)
    const galleryObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        isIntersecting = entry.isIntersecting; // Обновляем состояние
        checkAnimationState(); // Вызываем проверку
    }, {
        threshold: 0
    });
    galleryObserver.observe(gallerySection);

    // 2. Mutation Observer (Следит за классом 'invisible')
    const mutationObserver = new MutationObserver((mutations) => {
        isVisible = !gallerySection.classList.contains('invisible'); // Обновляем состояние
        checkAnimationState(); // Вызываем проверку
    });

    mutationObserver.observe(gallerySection, {
        attributes: true,
        attributeFilter: ['class'] // Следим только за изменениями атрибута 'class'
    });
});