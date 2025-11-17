const personalAccountSection = document.getElementById('personal-account');
const editButton = document.querySelector('.edit-account-btn');
const userNameEl = document.querySelector('.user-name');
const datesContent = personalAccountSection.querySelector('.personal-account-content.dates');
const reservationContent = personalAccountSection.querySelector('.personal-account-content.reservation');
const adminPanelButton = document.querySelector('.personal-account-admin-panel');
const adminPanelSection = document.getElementById('admin-panel');

const personalAccountButtons = {
  dates: personalAccountSection.querySelector('.personal-account-dates'),
  reservation: personalAccountSection.querySelector('.personal-account-reservation'),
};

const personalAccountButton = [
  document.querySelector('.personal-account-dates'),
  document.querySelector('.personal-account-reservation')
];

personalAccountButton.forEach(btn => {
  if (!btn) return;
  btn.addEventListener('click', () => {
    hideAdminTables(); // скрываем все админ-таблицы
  });
});

let csrfToken = ''; //def CSRF (Cross-Site Request Forgery) - attack

// Получаем токен с сервера
fetch('./php/get_csrf_token.php', { credentials: 'include' })
  .then(res => res.json())
  .then(data => {
    csrfToken = data.csrf_token; //def CSRF (Cross-Site Request Forgery) - attack
    window.csrfToken = data.csrf_token;
    console.log('✅ CSRF Token получен:', window.csrfToken);
  })
  .catch(err => {
    console.error('Не удалось получить CSRF токен:', err);
  });

const logoutButton = datesContent.querySelector('.logout-account-btn');

function hideAdminTables() {
    // Скрываем все таблицы админ-панели

    // Таблица всех резерваций
    const allReservations = document.getElementById("admin-reservations-container");
    const allReservationsPagination = document.getElementById("admin-reservations-pagination");
    if (allReservations) allReservations.style.display = 'none';
    if (allReservationsPagination) allReservationsPagination.innerHTML = '';

    // Таблица всех пользователей
    const adminUsersTableWrap = document.querySelector('#admin-users-table .admin-users-table-wrap');
    const adminUsersPagination = document.getElementById('admin-users-table-pagination');
    const adminUsersContent = document.getElementById('admin-users-content');

    if (adminUsersTableWrap) {
        adminUsersTableWrap.innerHTML = '';
        delete adminUsersTableWrap.dataset.listenerAdded; // <--- Сбрасываем флаг
    }
    if (adminUsersPagination) adminUsersPagination.innerHTML = '';
}

async function translatePersonalAccount(section) {
  if (!section) return;
  const elements = section.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    await translateElement(el, key);
  }
}

// --- Функция для показа только одного блока ---
function showAccountBlock(block) {
  [datesContent, reservationContent].forEach(el => {
    if (el === block) {
      el.classList.remove('invisible');
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
      el.classList.add('invisible');
    }
  });
}

// --- Всегда показываем фиксированную маску для пароля ---
function maskPassword() {
  return '••••••••'; // фиксированная маска 8 точек
}

// --- Инициализация Personal Account ---
function initPersonalAccount(user) {
  // Показываем секцию Personal Account
  personalAccountSection.classList.remove('invisible');

  // Подставляем имя пользователя
  const welcomeUserName = document.querySelector('.personal-account-welcome .user-name');
  if (welcomeUserName) welcomeUserName.textContent = user.name; //def XSS - attack

  // Подставляем login и email
  const loginSpan = datesContent.querySelector('.user-login');
  const emailSpan = datesContent.querySelector('.user-email');
  const passwordSpan = datesContent.querySelector('.user-password');

  if (loginSpan) loginSpan.textContent = user.name; //def XSS - attack
  if (emailSpan) emailSpan.textContent = user.email; //def XSS - attack
  if (passwordSpan) {
    passwordSpan.textContent = maskPassword(); //def XSS - attack
    passwordSpan.classList.add('user-password--styled');
  };

  const passwordLabel = datesContent.querySelector('.user-password-label');
  if (passwordLabel) {
    getTranslation('personal-account.password').then(txt => {
      passwordLabel.textContent = txt || 'Heslo:';
    });
  }

  // Показываем только блок "Личные данные"
  showAccountBlock(datesContent);

  // --- Кнопки для переключения между блоками ---
  personalAccountButtons.dates.onclick = () => showAccountBlock(datesContent);
  personalAccountButtons.reservation.onclick = () => {
    showAccountBlock(reservationContent);
    loadUserReservations(user.id);
  };

  if (user.isAdmin) {
    initAdminPanel(user); // вызываем сразу, без import/export
  }
}

// --- Редактирование данных ---
if (editButton) {
  editButton.addEventListener('click', async () => {
    if (document.querySelector('.edit-mode')) return; // уже редактируется

    const userLoginEl = datesContent.querySelector('.user-login');
    const userEmailEl = datesContent.querySelector('.user-email');
    const userPasswordEl = datesContent.querySelector('.user-password');

    const loginValue = userLoginEl.textContent.trim();
    const emailValue = userEmailEl.textContent.trim();

    async function createInput(type, value, placeholderKey = '') {
      const input = document.createElement('input');
      input.type = type;
      input.value = value;
      input.classList.add('edit-mode', 'user-password--styled');
      input.style.background = 'rgba(46, 139, 87, 0.1)';
      input.style.padding = '3px 6px';
      input.style.borderRadius = '4px';
      input.style.fontWeight = '500';
      input.style.color = '#2e8b57';
      input.style.border = '1px solid #2e8b57';
      input.style.outline = 'none';
      input.style.fontSize = '18px';
      input.style.marginRight = '10px';

      if (placeholderKey) {
        input.setAttribute('data-i18n-placeholder', placeholderKey);
        const txt = await getTranslation(placeholderKey);
        if (txt) input.placeholder = txt;
      }

      return input;
    }

    const loginInput = await createInput('text', loginValue);
    const emailInput = await createInput('email', emailValue);
    const passwordInput = await createInput('password', '', 'personal-account.set-new-password');

    userLoginEl.replaceWith(loginInput);
    userEmailEl.replaceWith(emailInput);
    userPasswordEl.replaceWith(passwordInput);

    // --- Кнопки Save / Cancel с переводом ---
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.classList.add('edit-account-btn');
    saveBtn.setAttribute('data-i18n', 'personal-account.save'); // просто добавляем data-i18n
    saveBtn.textContent = '💾 Save'; 

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.classList.add('logout-account-btn');
    cancelBtn.setAttribute('data-i18n', 'personal-account.cancel');
    cancelBtn.textContent = '❌ Cancel';

    const buttonContainer = editButton.parentElement;
    editButton.style.display = 'none';
    buttonContainer.insertBefore(saveBtn, logoutButton);
    buttonContainer.insertBefore(cancelBtn, logoutButton);

// вызываем перевод для новых кнопок
translatePersonalAccount(buttonContainer);

    // --- Сохранение ---
    saveBtn.addEventListener('click', () => {
      const newLogin = loginInput.value.trim();
      const newEmail = emailInput.value.trim();
      const newPassword = passwordInput.value.trim();

      const formData = new FormData();
      formData.append('login', newLogin);
      formData.append('email', newEmail);
      formData.append('password', newPassword);
      formData.append('csrf_token', csrfToken);

      fetch('./php/update_user.php', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const newLoginSpan = document.createElement('span');
            newLoginSpan.className = 'user-login';
            newLoginSpan.textContent = newLogin;

            const newEmailSpan = document.createElement('span');
            newEmailSpan.className = 'user-email';
            newEmailSpan.textContent = newEmail;

            const newPasswordSpan = document.createElement('span');
            newPasswordSpan.className = 'user-password user-password--styled';
            newPasswordSpan.textContent = maskPassword();

            loginInput.replaceWith(newLoginSpan);
            emailInput.replaceWith(newEmailSpan);
            passwordInput.replaceWith(newPasswordSpan);

            userNameEl.textContent = newLogin;

            saveBtn.remove();
            cancelBtn.remove();
            editButton.style.display = 'inline-block';
          } else {
            alert('Ошибка: ' + (data.message || 'Failed to update data.'));
          }
        })
        .catch(err => {
          console.error('Failed to update data:', err);
          alert('Server connection error.');
        });
    });

    // --- Отмена ---
    cancelBtn.addEventListener('click', () => {
      const oldLoginSpan = document.createElement('span');
      oldLoginSpan.className = 'user-login';
      oldLoginSpan.textContent = loginValue;

      const oldEmailSpan = document.createElement('span');
      oldEmailSpan.className = 'user-email';
      oldEmailSpan.textContent = emailValue;

      const oldPasswordSpan = document.createElement('span');
      oldPasswordSpan.className = 'user-password user-password--styled';
      oldPasswordSpan.textContent = maskPassword();

      loginInput.replaceWith(oldLoginSpan);
      emailInput.replaceWith(oldEmailSpan);
      passwordInput.replaceWith(oldPasswordSpan);

      saveBtn.remove();
      cancelBtn.remove();
      editButton.style.display = 'inline-block';
    });
  });
}


let currentUserReservationsPage = 1;

function loadUserReservations(userId, page = 1) {
  const container = document.getElementById('user-reservations');
  const pagination = document.getElementById('user-reservations-pagination');
  if (!container) return;

  container.innerHTML = '<p data-i18n="personal-account.loading">Loading your reservations...</p>';
  translatePersonalAccount(container);

  fetch(`./php/get_user_reservations.php?page=${page}`, {
    method: 'GET',
    credentials: 'include'
  })
    .then(res => res.json())
    .then(async data => {
      container.innerHTML = '';

      if (!data.success || !data.reservations.length) {
        container.innerHTML = '<p class="empty-reservations" data-i18n="personal-account.no-reservations">You have no active reservations.</p>';
        translatePersonalAccount(container);
        pagination.innerHTML = '';
        return;
      }

      currentUserReservationsPage = data.page;

      for (const r of data.reservations) {
        const item = document.createElement('div');
        item.className = 'reservation-item';
        item.innerHTML = `
          <h4>${r.date} в ${r.time}</h4>
          <p><strong data-i18n="personal-account.name">Name:</strong> ${r.name}</p>
          <p><strong data-i18n="personal-account.phone">Phone number:</strong> ${r.phone}</p>
          <p><strong data-i18n="personal-account.email">Email:</strong> ${r.email}</p>
          <p><strong data-i18n="personal-account.guest">Guests:</strong> ${r.people}</p>
          ${r.message ? `<p><strong data-i18n="personal-account.comment">Comment:</strong> ${r.message}</p>` : ''}
        `;
        container.appendChild(item);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'cancel-reservation-btn';
        cancelBtn.dataset.id = r.id;
        cancelBtn.textContent = '❌';
        cancelBtn.setAttribute('data-i18n', 'personal-account.cancel');
        cancelBtn.addEventListener('click', () => cancelReservation(r.id, userId));
        item.appendChild(cancelBtn);

        // Переводим новый элемент
        await translatePersonalAccount(item);
      }

      // PAGINATION BUTTONS
      pagination.innerHTML = '';

      const prev = document.createElement('button');
      prev.textContent = '←';
      prev.disabled = data.page <= 1;
      prev.onclick = () => loadUserReservations(userId, data.page - 1);
      pagination.appendChild(prev);

      const maxButtons = 3;
      let start = Math.max(1, data.page - 1);
      let end = Math.min(data.totalPages, start + maxButtons - 1);

      if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

      for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = (i === data.page) ? 'active-page' : '';
        btn.onclick = () => loadUserReservations(userId, i);
        pagination.appendChild(btn);
      }

      const next = document.createElement('button');
      next.textContent = '→';
      next.disabled = data.page >= data.totalPages;
      next.onclick = () => loadUserReservations(userId, data.page + 1);
      pagination.appendChild(next);
    })
    .catch(async err => {
      console.error(err);
      container.innerHTML = '<p class="empty-reservations" data-i18n="personal-account.error-loading">Error loading reservations.</p>';
      await translatePersonalAccount(container);
    });
}

function cancelReservation(reservationId, userId) {
  if (!confirm('Вы уверены, что хотите отменить эту резервацию?')) return;

  // обязательно отправляем куки сессии и csrf токен
  fetch('./php/cancel_reservation.php', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken // auth.php ищет этот заголовок //def CSRF (Cross-Site Request Forgery) - attack
    },
    body: JSON.stringify({ id: reservationId, csrf_token: csrfToken }) //def CSRF (Cross-Site Request Forgery) - attack
  })
    .then(res => res.json().catch(() => ({ success: false, error: 'invalid json' })))
    .then(data => {
      console.log('cancel_reservation response', data);
      if (data.success) {
        loadUserReservations(userId);
      } else {
        alert('Ошибка при отмене резервации: ' + (data.error || data.message || 'Неизвестная ошибка'));
      }
    })
    .catch(err => {
      console.error('Ошибка при запросе cancel_reservation:', err);
      alert('Ошибка соединения с сервером.');
    });
}