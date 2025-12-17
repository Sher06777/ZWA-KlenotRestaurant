// animations.js — module version: exports initAnimations + helpers

export function initAnimations() {
  // Слайдер
  const slides = document.querySelectorAll('.slider-image-item');
  const progressFill = document.querySelector('.slider-progress-fill');
  const progressValues = [0.66, 0.33, 0];
  const radios = [
      document.getElementById('slider-switch-1'),
      document.getElementById('slider-switch-2'),
      document.getElementById('slider-switch-3')
  ];

  if (slides && slides.length && progressFill) {
    let current = 0;
    const showSlide = (index) => {
      current = index;
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('visible');
          if (radios[i]) radios[i].checked = true;
        } else {
          slide.classList.remove('visible');
          if (radios[i]) radios[i].checked = false;
        }
      });
      progressFill.style.transform = `scaleY(${progressValues[index]})`;
    };

    const nextSlide = () => showSlide((current + 1) % slides.length);

    if (Array.isArray(radios)) {
      radios.forEach((radio, i) => { if (radio) radio.addEventListener('change', () => showSlide(i)); });
    }

    showSlide(current);
    setInterval(nextSlide, 7000);
  }

  // border animation per-button
  const addBorderAnimation = (containerSelector, pathSelector) => {
    const container = document.querySelector(containerSelector);
    if(!container) return;
    const path = container.querySelector(pathSelector);
    if(!path) return;
    const svg = container.querySelector('svg');
    if(!svg) return;

    container.addEventListener('mouseenter', () => {
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

      const topToBottom = `
        M ${width/2} 0
        L ${width} 0
        L ${width} ${height}
        L ${width/2} ${height}
      `;
      const bottomToTop = `
        M ${width/2} ${height}
        L 0 ${height}
        L 0 0
        L ${width/2} 0
      `;
      path.setAttribute('d', topToBottom + bottomToTop);
      const pathLength = path.getTotalLength();
      path.style.strokeDasharray = pathLength;
      path.style.strokeDashoffset = pathLength;
      path.style.transition = 'none';
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
  };

  const loginBtn = document.querySelector('.login-btn');
  if(loginBtn) addBorderAnimation('.login-btn', '.border-path');

  const logoWrap = document.querySelector('.logo-wrap');
  if(logoWrap) addBorderAnimation('.logo-wrap', '.logo-border-path');

  const regDiv = document.querySelector('.form-regestration-div');
  if(regDiv) addBorderAnimation('.form-regestration-div', '.form-regestration-border-path');

  // loader helpers (exported later)
  // date/time pickers
  const dateInput = document.getElementById('dateInput');
  const timeInput = document.getElementById('timeInput');
  if (dateInput) {
    dateInput.addEventListener('click', () => { if (dateInput.showPicker) dateInput.showPicker(); });
  }
  if (timeInput) {
    timeInput.addEventListener('click', () => { if (timeInput.showPicker) timeInput.showPicker(); });
  }

  // 3D Menu
  const heroWrap = document.getElementById('menu-3d-hero');
  const container = document.getElementById('menu-3d-container');
  if (heroWrap && container) {
    let rotX = 0, rotY = 0;
    let targetRotX = 0, targetRotY = 0;
    let animFrameId = null;
    let active = false;

    const handleMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetRotY = (e.clientX - cx) * -0.006;
      targetRotX = (e.clientY - cy) * 0.015;
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) handleMove(e.touches[0]);
    };

    const animate = () => {
      if (!active) return;
      rotX += (targetRotX - rotX) * 0.1;
      rotY += (targetRotY - rotY) * 0.1;
      container.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
      animFrameId = requestAnimationFrame(animate);
    };

    const start3D = () => {
      if (active) return;
      active = true;
      if (!(/Mobi|Android/i.test(navigator.userAgent))) {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
      }
      animate();
    };

    const stop3D = () => {
      active = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };

    window.menu3D = { start: start3D, stop: stop3D };

    if (!heroWrap.classList.contains('invisible')) start3D();
  }
}

// loader helpers (exported)
export function showLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.add('visible');
  loader.style.display = 'flex';
}

export function hideLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.remove('visible');
  setTimeout(() => {
    loader.style.display = 'none';
  }, 300);
}

export function startLoader(callback) {
  showLoader();
  const minTime = 1000;
  const start = Date.now();

  Promise.resolve(callback()).then(() => {
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minTime - elapsed);
    setTimeout(() => hideLoader(), remaining);
  });
}
