// --------- SPA с плавной анимацией ---------

// Получаем все основные элементы
const mainContent = document.getElementById('main');
const gallerySection = document.getElementById('gallery-section');
const formMain = document.querySelector('.form-main');
const loginFormSection = document.querySelector('.login-form-section');
const personalAccount = document.querySelector('.main-content-wrapper');
const header = document.getElementById('dropped-menu');
const footer = document.querySelector('footer');
const logo = document.querySelector('.logo');
const loginButton = document.querySelector('.login-btn');
const galleryBtn = document.querySelectorAll('.gallery-btn');
const regestrationButton = document.querySelector('.form-regestration-div');
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

window.onLoginOrRegister = function () {
  console.warn('onLoginOrRegister called but SPA not initialized yet.');
};

async function getTranslation(key) {
  try {
    const lang = (window.i18n && typeof window.i18n.getLang === 'function') ? window.i18n.getLang() : (localStorage.getItem('site_lang') || 'eng');
    const dict = (window.i18n && window.i18n._loadDict) ? await window.i18n._loadDict(lang) : null;
    if (!dict) return null;
    const parts = key.split('.');
    let cur = dict;
    for (const p of parts) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
      else { cur = undefined; break; }
    }
    return cur == null ? null : String(cur);
  } catch (err) {
    console.error('getTranslation error', err);
    return null;
  }
}

// ---- центральная функция для обновления надписи кнопки входа ----
async function updateLoginLabel() {
  const loginTextEl = document.querySelector('.login-btn .login-text');
  if (!loginTextEl) {
    return;
  }

  let key;
  if (isLoggedIn()) {
    key = 'main.menu-account-short';
  } else {
    key = 'main.menu-signin-button';
  }

  // обновляем и data-i18n, чтобы при смене языка подставлялся правильный текст
  loginTextEl.setAttribute('data-i18n', key);

  const txt = await getTranslation(key);
  loginTextEl.textContent = txt;
}

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
  if (value) {
    menuImg3D.classList.add('invisible');
    window.menu3D?.stop(); // выключаем анимацию
  } else {
    menuImg3D.classList.remove('invisible');
    window.menu3D?.start(); // включаем анимацию
  }
}

// --------- Инициализация SPA ---------
document.addEventListener('DOMContentLoaded', async () => {
  const logoutButton = document.querySelector('.logout-account-btn');
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

  loginButton?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (isLoggedIn()) {
      showSection(personalAccount);
      await updateLoginLabel();
    } else {
      showSection(formMain);
      await updateLoginLabel();
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
  window.onLoginOrRegister = async (user) => {
    setLoggedIn(true);
    await updateLoginLabel();

    if (user) {
      window.user = user; // сохраняем глобально
      initPersonalAccount(user); // подставляем данные в Personal Account
    }

    showSection(personalAccount);
    set3DMenuInvisible(true);
  };

  [mainContent, gallerySection, formMain, loginFormSection, personalAccount, reservationSection].forEach(el => {
    el?.addEventListener('click', () => set3DMenuInvisible(true));
  });

  // Инициализация сохранения входа в акаунт
  try {
    const res = await fetch('check_session.php', { credentials: 'include' });
    const data = await res.json();

    if (data.loggedIn && data.user) {
      const user = { name: data.user.name || '', email: data.user.email || '' };
      requestAnimationFrame(() => initPersonalAccount(user));
      setLoggedIn(true);

      // Обновляем текст кнопки сразу
      await updateLoginLabel();
    }
  } catch (err) {
    console.error('[check_session] error', err);
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', async (e) => {
      e.preventDefault();

      if (!confirm('Вы действительно хотите выйти из аккаунта?')) return;

      // обязательно: credentials чтобы передать cookie сессии
      try {
        const resp = await fetch('logout.php', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': window.csrfToken || '' //def CSRF (Cross-Site Request Forgery) - attack
          },
          body: JSON.stringify({ csrf_token: window.csrfToken || '' }) //def CSRF (Cross-Site Request Forgery) - attack
        });

        // если сервер вернул 403, покажем текст ответа для диагностики
        if (!resp.ok) {
          const text = await resp.text();
          console.error('Logout failed, status', resp.status, text);
          alert('Ошибка при выходе: сервер вернул ' + resp.status);
          return;
        }

        const data = await resp.json();

        if (data.success) {
          console.log('✅ Пользователь вышел из аккаунта');

          try { localStorage.clear(); sessionStorage.clear(); } catch (e) { console.warn(e); }
          if (typeof window.setLoggedIn === 'function') window.setLoggedIn(false);
          const loginText = document.querySelector('.login-text');
          if (loginText) {
            await updateLoginLabel();
          }

          window.location.reload();
        } else {
          alert('Ошибка при выходе: ' + (data.error || data.message || 'Попробуйте снова.'));
        }
      } catch (err) {
        console.error('Ошибка при выходе из аккаунта:', err);
        alert('Ошибка соединения при выходе.');
      }
    });
  }
  const aboutUsLink = document.querySelector('a[href="#about-us"]');
  const aboutUsSection = document.getElementById('about-us');

  if (aboutUsLink && aboutUsSection) {
    aboutUsLink.addEventListener('click', async (e) => {
      e.preventDefault();

      // Показываем главную страницу
      showSection(mainContent);
      set3DMenuInvisible(true);

      // Дадим время на анимацию появления mainContent
      await new Promise(resolve => setTimeout(resolve, 600));

      // Плавный скролл к блоку About Us
      aboutUsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

});

document.addEventListener('i18n:changed', async (ev) => {
  await updateLoginLabel();
});

// --------- Вспомогательные функции ---------
function makeVisible(el) {
  if (!el) return;
  el.classList.remove('invisible');
  el.classList.add('visible');
}

function makeInvisible(el) {
  if (!el) return;
  el.classList.remove('visible');
  el.classList.add('invisible');
}



