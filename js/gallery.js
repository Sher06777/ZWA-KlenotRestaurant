document.addEventListener("DOMContentLoaded", () => {
    const ring = document.querySelector(".gallery-ring");
    const items = document.querySelectorAll(".gallery-item");
    let radius = 400; // исходный радиус

    // Обновление радиуса под ширину экрана
    const updateRadius = () => {
        const w = window.innerWidth;
        if (w <= 480) radius = 180;
        else if (w <= 768) radius = 250;
        else if (w <= 1024) radius = 350;
        else radius = 450;
    };
    updateRadius();
    window.addEventListener("resize", updateRadius);

    const total = items.length;

    // Расставляем карточки по окружности
    items.forEach((item, i) => {
        const angle = (i / total) * 360;
        item.dataset.angle = angle;
    });

    let currentRotation = 0;
    let autoRotateSpeed = 0.1;
    let isDragging = false;
    let lastX = 0;
    let autoRotate = true;

    // Анимация кольца
    function animate() {
        if (autoRotate) currentRotation += autoRotateSpeed;

        // Вращаем кольцо
        ring.style.transform = `rotateY(${currentRotation}deg)`;

        // Расставляем картинки по окружности и смотрят на пользователя
        items.forEach(item => {
            const angle = parseFloat(item.dataset.angle);
            const totalAngle = angle + currentRotation;
            const rad = (totalAngle * Math.PI) / 180;
            const x = radius * Math.sin(rad);
            const z = radius * Math.cos(rad);

            item.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${-currentRotation}deg)`;
        });

        requestAnimationFrame(animate);
    }
    animate();

    const startDrag = (x) => {
        isDragging = true;
        autoRotate = false;
        lastX = x;
    };

    const moveDrag = (x) => {
        if (!isDragging) return;
        const delta = (x - lastX) * 0.4;
        currentRotation += delta;
        lastX = x;
    };

    const endDrag = () => {
        isDragging = false;
        autoRotate = true;
    };

    ring.addEventListener("mousedown", e => startDrag(e.clientX));
    window.addEventListener("mousemove", e => moveDrag(e.clientX));
    window.addEventListener("mouseup", endDrag);

    ring.addEventListener("touchstart", e => startDrag(e.touches[0].clientX));
    ring.addEventListener("touchmove", e => {
        e.preventDefault();
        moveDrag(e.touches[0].clientX);
    }, { passive: false });
    ring.addEventListener("touchend", endDrag);

    // Zoom
    const zoom = document.getElementById("zoom");
    const zoomImg = document.getElementById("zoom-img");
    const zoomDesc = document.getElementById("zoom-description");
    const zoomClose = document.getElementById("zoom-close");

    // Открытие зума
    items.forEach(item => {
        item.addEventListener("click", (e) => {
            e.stopPropagation(); // оставляем, чтобы клик по картинке не срабатывал раньше
            const img = item.querySelector("img");
            zoomImg.src = img.src;
            zoomDesc.textContent = img.alt;

            zoomImg.style.transform = "scale(1)";
            zoom.style.display = "flex";
            requestAnimationFrame(() => zoom.classList.add("visible"));

            // теперь клик по самой картинке возвращает прежнее состояние
            zoomImg.onclick = closeZoom;
        });
    });

    // Закрытие зума
    const closeZoom = () => {
        zoom.classList.remove("visible");
        zoomImg.style.transform = "scale(1)";
        setTimeout(() => zoom.style.display = "none", 400);
    };
    zoom.addEventListener("click", closeZoom); // клик по фону
    zoomClose.addEventListener("click", closeZoom); // клик по кресту
    zoomImg.addEventListener("click", e => e.stopPropagation()); // клик по картинке не закрывает
});
