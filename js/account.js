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

if (window.CSRFManager) {
  window.CSRFManager.init().catch(err => {
    console.warn('CSRFManager init failed in account.js:', err);
  });
}

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

// --- переводит элементы в секции ---
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

  // Подставляем имя пользователя — безопасно через textContent (нет XSS)
  const welcomeUserName = document.querySelector('.personal-account-welcome .user-name');
  if (welcomeUserName) welcomeUserName.textContent = user.name;

  // Подставляем login и email
  const loginSpan = datesContent.querySelector('.user-login');
  const emailSpan = datesContent.querySelector('.user-email');
  const passwordSpan = datesContent.querySelector('.user-password');

  if (loginSpan) loginSpan.textContent = user.name;
  if (emailSpan) emailSpan.textContent = user.email;
  if (passwordSpan) {
    passwordSpan.textContent = maskPassword();
    passwordSpan.classList.add('user-password--styled');
  }

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
    window.isAdmin = true;  // <<< ЭТО НУЖНО
    initAdminPanel(user);
  } else {
    window.isAdmin = false;
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
    saveBtn.addEventListener('click', async () => {
      const newLogin = loginInput.value.trim();
      const newEmail = emailInput.value.trim();
      const newPassword = passwordInput.value.trim();

      // Простая валидация на клиенте (не заменяет серверную валидацию!)
      if (!newLogin || newLogin.length < 2) {
        alert('Login too short.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        alert('Invalid email.');
        return;
      }

      const formData = new FormData();
      formData.append('login', newLogin);
      formData.append('email', newEmail);
      // если пользователь оставил пароль пустым — не отправляем пустое поле (сервер решает, оставлять ли старый)
      if (newPassword.length > 0) {
        formData.append('password', newPassword);
      }

      try {
        if (window.CSRFManager) {
          await window.CSRFManager.appendToFormData(formData);
        }
      } catch (err) {
        console.warn('CSRF append failed for update_user:', err);
      }

      try {
        const res = await fetch('./php/update_user.php', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON from server' }));

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

          if (userNameEl) userNameEl.textContent = newLogin;

          saveBtn.remove();
          cancelBtn.remove();
          editButton.style.display = 'inline-block';
        } else {
          alert('Ошибка: ' + (data.message || 'Failed to update data.'));
        }
      } catch (err) {
        console.error('Failed to update data:', err);
        alert('Server connection error.');
      }
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

// Вспомогательная: безопасно создаёт элемент <p><strong>label</strong> value</p>.
// valueText — строка (будет безопасно записана через textContent). Если valueText содержит переводы строк, они будут преврашены в <br>.
function createLabeledParagraph(labelKey, valueText) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.setAttribute('data-i18n', labelKey);
  // label (текст в <strong>) будет заполнен translatePersonalAccount позже
  p.appendChild(strong);
  p.appendChild(document.createTextNode(' ')); // пробел между label и value

  if (typeof valueText !== 'string' || valueText.length === 0) {
    p.appendChild(document.createTextNode(''));
    return p;
  }

  // поддержка переносов: вставляем текст + <br> как элементы, но текст вставляется через textContent
  const parts = valueText.split(/\r?\n/);
  parts.forEach((part, idx) => {
    p.appendChild(document.createTextNode(part));
    if (idx < parts.length - 1) p.appendChild(document.createElement('br'));
  });

  return p;
}

async function loadUserReservations(userId, page = 1) {
  const container = document.getElementById('user-reservations');
  const pagination = document.getElementById('user-reservations-pagination');
  if (!container) return;

  container.innerHTML = '<p data-i18n="personal-account.loading">Loading your reservations...</p>';
  translatePersonalAccount(container);

  try {
    const resp = await fetch(`./php/get_user_reservations.php?page=${encodeURIComponent(page)}`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await resp.json().catch(() => ({ success: false, reservations: [] }));
    container.innerHTML = '';

    if (!data.success || !Array.isArray(data.reservations) || data.reservations.length === 0) {
      container.innerHTML = '<p class="empty-reservations" data-i18n="personal-account.no-reservations">You have no active reservations.</p>';
      translatePersonalAccount(container);
      if (pagination) pagination.innerHTML = '';
      return;
    }

    currentUserReservationsPage = data.page || 1;

    for (const r of data.reservations) {
      const item = document.createElement('div');
      item.className = 'reservation-item';

      // Заголовок: безопасно через textContent
      const h4 = document.createElement('h4');
      h4.textContent = `${r.date} в ${r.time}`;
      item.appendChild(h4);

      // Name
      item.appendChild(createLabeledParagraph('personal-account.name', String(r.name || '')));

      // Phone
      item.appendChild(createLabeledParagraph('personal-account.phone', String(r.phone || '')));

      // Email
      item.appendChild(createLabeledParagraph('personal-account.email', String(r.email || '')));

      // Guests
      item.appendChild(createLabeledParagraph('personal-account.guest', String(r.people || '')));

      // Message / comment (безопасно)
      if (r.message && String(r.message).trim().length > 0) {
        item.appendChild(createLabeledParagraph('personal-account.comment', String(r.message)));
      }

      container.appendChild(item);

      // Cancel button (валидация id, безопасное присваивание)
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'cancel-reservation-btn';
      // приводим id к числу и сохраняем как строку
      const rid = Number(r.id);
      cancelBtn.dataset.id = Number.isFinite(rid) ? String(rid) : '';
      cancelBtn.textContent = '❌';
      cancelBtn.setAttribute('data-i18n', 'personal-account.cancel');
      cancelBtn.addEventListener('click', () => cancelReservation(cancelBtn.dataset.id, userId));
      item.appendChild(cancelBtn);

      // Переводим новый элемент
      await translatePersonalAccount(item);
    }

    // PAGINATION BUTTONS
    if (pagination) {
      pagination.innerHTML = '';

      const prev = document.createElement('button');
      prev.textContent = '←';
      prev.disabled = (data.page || 1) <= 1;
      prev.onclick = () => loadUserReservations(userId, (data.page || 1) - 1);
      pagination.appendChild(prev);

      const maxButtons = 3;
      let start = Math.max(1, (data.page || 1) - 1);
      let end = Math.min(data.totalPages || 1, start + maxButtons - 1);

      if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

      for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === (data.page || 1)) btn.className = 'active-page';
        btn.onclick = () => loadUserReservations(userId, i);
        pagination.appendChild(btn);
      }

      const next = document.createElement('button');
      next.textContent = '→';
      next.disabled = (data.page || 1) >= (data.totalPages || 1);
      next.onclick = () => loadUserReservations(userId, (data.page || 1) + 1);
      pagination.appendChild(next);
    }

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="empty-reservations" data-i18n="personal-account.error-loading">Error loading reservations.</p>';
    await translatePersonalAccount(container);
  }
}

async function cancelReservation(reservationId, userId) {
  // reservationId должен быть положительным целым числом
  const id = parseInt(reservationId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    alert('Invalid reservation id.');
    return;
  }

  if (!confirm('Вы уверены, что хотите отменить эту резервацию?')) return;

  // Подготовим полезад (сервер будет проверять CSRF)
  const payload = { id };

  // Если CSRFManager есть, убедимся что он инициализирован и добавим токен
  try {
    if (window.CSRFManager) {
      // ensure token is present
      if (!window.CSRFManager.isInitialized || !window.CSRFManager.isInitialized()) {
        await window.CSRFManager.init();
      }
    }
  } catch (err) {
    console.warn('Failed to init CSRFManager before cancelReservation:', err);
  }

  const payloadWithCsrf = window.CSRFManager ? window.CSRFManager.appendToJson(payload) : payload;

  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    window.CSRFManager ? window.CSRFManager.getHeader() : {}
  );

  try {
    const res = await fetch('./php/cancel_reservation.php', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payloadWithCsrf)
    });

    const data = await res.json().catch(() => ({ success: false, error: 'invalid json' }));
    console.log('cancel_reservation response', data);
    if (data.success) {
      loadUserReservations(userId);
    } else {
      alert('Ошибка при отмене резервации: ' + (data.error || data.message || 'Неизвестная ошибка'));
    }
  } catch (err) {
    console.error('Ошибка при запросе cancel_reservation:', err);
    alert('Ошибка соединения с сервером.');
  }
}
