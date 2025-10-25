// --------- SPA с плавной анимацией ---------

// Получаем все основные элементы
const mainContent = document.getElementById('main');
const gallerySection = document.getElementById('gallery-section');
const formMain = document.querySelector('.form-main');
const loginFormSection = document.querySelector('.login-form-section');
const personalAccount = document.querySelector('.personal-account');
const mainContentWrapper = document.querySelector('.main-content-wrapper');
const header = document.getElementById('dropped-menu');
const footer = document.querySelector('footer');
const logo = document.querySelector('.logo');
const loginButton = document.querySelector('.login-btn');
const galleryBtn = document.querySelectorAll('.gallery-btn');
const regestrationButton = document.querySelector('.form-regestration-div');
const loginText = document.querySelector('.login-text');
const reservationSection = document.getElementById('reservation-section');
const reservationBtn = document.querySelectorAll('.reservation-btn');
const menuBtn = document.querySelectorAll('.menu-btn');
const menuSection = document.querySelector('.menu-all');
const menuImg3D = document.querySelector('.menu-3d-hero');
const menuCard = document.querySelector('.menu-items')


// Проверка наличия элементов
if (!mainContent || !gallerySection || !formMain || !loginFormSection || !personalAccount || !reservationSection || !menuSection || !menuImg3D) {
  console.warn('Не все элементы SPA найдены на странице.');
}

window.onLoginOrRegister = function() {
  console.warn('onLoginOrRegister called but SPA not initialized yet.');
};

// --------- Функции анимации ---------
const fadeOut = (el, callback) => {
  if (!el) return;
  el.style.opacity = 1;
  el.style.transition = 'opacity 0.5s ease';
  el.style.pointerEvents = 'none';
  el.style.opacity = 0;

  el.classList.remove('visible');
  el.classList.add('invisible');

  if (callback) setTimeout(callback, 500); // ждём окончания анимации
};

const fadeIn = (el) => {
  if (!el) return;
  el.classList.remove('invisible');
  el.classList.add('visible');
  el.style.display = 'block';
  el.style.opacity = 0;

  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = 1;
    el.style.pointerEvents = 'auto';
  });
};


let loggedIn = false;

function setLoggedIn(status) {
  loggedIn = status;
}

function isLoggedIn() {
  return loggedIn;
}


// --------- Функция показа секции ---------
function showSection(section) {
  const allSections = [mainContent, gallerySection, formMain, loginFormSection, personalAccount, reservationSection, menuSection];

  allSections.forEach(el => {
    if (el === section) {
      fadeIn(el);
    } else {
      fadeOut(el);
    }
  });

  // Скролл наверх при переключении
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// --------- Видимость 3D-меню ---------
function set3DMenuInvisible(value) {
  if (!menuImg3D) return;
  if (value) menuImg3D.classList.add('invisible');
  else menuImg3D.classList.remove('invisible');
}

// --------- Инициализация SPA ---------
document.addEventListener('DOMContentLoaded', () => {
  // Начальное состояние: главная страница
  fadeIn(mainContent);
  [menuSection, gallerySection, formMain, loginFormSection, personalAccount, reservationSection].forEach(makeInvisible);

  // ---------- Кнопки ----------
  galleryBtn?.forEach(galleryButton => {
    galleryButton.addEventListener('click', e => {
      e.stopPropagation(); 
      e.preventDefault(); 
      showSection(gallerySection); 
      set3DMenuInvisible(true);
    });
  });

  logo?.addEventListener('click', e => {
    e.preventDefault();
    showSection(mainContent);
    set3DMenuInvisible(true);
  });

  loginButton?.addEventListener('click', e => {
    e.preventDefault();
    if (isLoggedIn()) {
      showSection(personalAccount);
      loginText.textContent = 'My Account';
    } else {
      showSection(formMain);
    }
    set3DMenuInvisible(true);
  });

  reservationBtn?.forEach(reservationButton => {
    reservationButton.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      showSection(reservationSection);
      set3DMenuInvisible(true);
    });
  })

  menuBtn?.forEach(menuButton => {
    menuButton.addEventListener('click', e => {
      e.stopPropagation()
      e.preventDefault();
      showSection(menuSection);
      set3DMenuInvisible(false);
      loadMenu();
    });
  });

  regestrationButton?.addEventListener('click', e => { 
    e.preventDefault(); 
    showSection(loginFormSection);
    set3DMenuInvisible(true); 
  });

  // ---------- Вход / регистрация ----------
  window.onLoginOrRegister = () => {
    showSection(personalAccount);
    loginText.textContent = 'My Account';
    setLoggedIn(true);
    set3DMenuInvisible(true);
  };

  [mainContent, gallerySection, formMain, loginFormSection, personalAccount, reservationSection].forEach(el => {
    el?.addEventListener('click', () => set3DMenuInvisible(true));
  });
});

// --------- Вспомогательные функции ---------
function makeVisible(el) { 
  if(!el) return; 
  el.classList.remove('invisible'); 
  el.classList.add('visible'); 
}

function makeInvisible(el) { 
  if(!el) return; 
  el.classList.remove('visible'); 
  el.classList.add('invisible'); 
}
