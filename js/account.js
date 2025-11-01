const personalAccountSection = document.getElementById('personal-account');
const editButton = document.querySelector('.edit-account-btn');
const userNameEl = document.querySelector('.user-name');
const datesContent = personalAccountSection.querySelector('.personal-account-content.dates');
const reservationContent = personalAccountSection.querySelector('.personal-account-content.reservation');
const adminContent = personalAccountSection.querySelector('.personal-account-content.admin');

const personalAccountButtons = {
  dates: personalAccountSection.querySelector('.personal-account-dates'),
  reservation: personalAccountSection.querySelector('.personal-account-reservation'),
  admin: personalAccountSection.querySelector('.personal-account-admin-panel')
};

const logoutButton = datesContent.querySelector('.logout-account-btn');

// --- Функция для показа только одного блока ---
function showAccountBlock(block) {
  [datesContent, reservationContent, adminContent].forEach(el => {
    if (el === block) {
      el.style.position = 'relative';
      el.style.top = '';
      el.style.left = '';
      el.classList.remove('invisible');
      el.classList.add('visible');
    } else {
      el.style.position = 'absolute';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
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
  const userNameSpan = datesContent.querySelector('.user-name');
  if (userNameSpan) userNameSpan.textContent = user.name;

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

  // Показываем только блок "Личные данные"
  showAccountBlock(datesContent);

  // --- Кнопки для переключения между блоками ---
  personalAccountButtons.dates.onclick = () => showAccountBlock(datesContent);
  personalAccountButtons.reservation.onclick = () => showAccountBlock(reservationContent);
  personalAccountButtons.admin.onclick = () => showAccountBlock(adminContent);
}

// --- Редактирование данных ---
if (editButton) {
  editButton.addEventListener('click', () => {
    if (document.querySelector('.edit-mode')) return; // уже редактируется

    const userLoginEl = datesContent.querySelector('.user-login');
    const userEmailEl = datesContent.querySelector('.user-email');
    const userPasswordEl = datesContent.querySelector('.user-password');

    const loginValue = userLoginEl.textContent.trim();
    const emailValue = userEmailEl.textContent.trim();

    // Создаём input для редактирования
    function createInput(type, value, placeholder = '') {
      const input = document.createElement('input');
      input.type = type;
      input.value = value;
      input.placeholder = placeholder;
      input.classList.add('edit-mode');
      input.style.background = 'rgba(46, 139, 87, 0.1)';
      input.style.padding = '3px 6px';
      input.style.borderRadius = '4px';
      input.style.fontWeight = '500';
      input.style.color = '#2e8b57';
      input.style.border = '1px solid #2e8b57';
      input.style.outline = 'none';
      input.style.fontSize = '18px';
      input.style.marginRight = '10px';
      input.classList.add('user-password--styled');
      return input;
    }

    const loginInput = createInput('text', loginValue);
    const emailInput = createInput('email', emailValue);
    const passwordInput = createInput('password', '', 'Введите новый пароль');

    userLoginEl.replaceWith(loginInput);
    userEmailEl.replaceWith(emailInput);
    userPasswordEl.replaceWith(passwordInput);

    // Создаём кнопки Сохранить и Отмена
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Сохранить';
    saveBtn.classList.add('edit-account-btn');

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '❌ Отмена';
    cancelBtn.classList.add('logout-account-btn');

    const buttonContainer = editButton.parentElement;
    editButton.style.display = 'none';
    buttonContainer.insertBefore(saveBtn, logoutButton);
    buttonContainer.insertBefore(cancelBtn, logoutButton);

    // --- Сохранение ---
    saveBtn.addEventListener('click', () => {
      const newLogin = loginInput.value.trim();
      const newEmail = emailInput.value.trim();
      const newPassword = passwordInput.value.trim();

      fetch('update_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ login: newLogin, email: newEmail, password: newPassword })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Обновляем отображение
            const newLoginSpan = document.createElement('span');
            newLoginSpan.className = 'user-login';
            newLoginSpan.textContent = newLogin;

            const newEmailSpan = document.createElement('span');
            newEmailSpan.className = 'user-email';
            newEmailSpan.textContent = newEmail;

            const newPasswordSpan = document.createElement('span');
            newPasswordSpan.className = 'user-password user-password--styled';
            newPasswordSpan.textContent = maskPassword(); // всегда 8 точек

            loginInput.replaceWith(newLoginSpan);
            emailInput.replaceWith(newEmailSpan);
            passwordInput.replaceWith(newPasswordSpan);

            userNameEl.textContent = newLogin;

            saveBtn.remove();
            cancelBtn.remove();
            editButton.style.display = 'inline-block';
            console.log('✅ Данные успешно обновлены');
          } else {
            alert('Ошибка: ' + (data.message || 'Не удалось обновить данные.'));
          }
        })
        .catch(err => {
          console.error('Ошибка при обновлении данных:', err);
          alert('Ошибка соединения с сервером.');
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
      oldPasswordSpan.textContent = maskPassword(); // всегда 8 точек

      loginInput.replaceWith(oldLoginSpan);
      emailInput.replaceWith(oldEmailSpan);
      passwordInput.replaceWith(oldPasswordSpan);

      saveBtn.remove();
      cancelBtn.remove();
      editButton.style.display = 'inline-block';
    });
  });
}
