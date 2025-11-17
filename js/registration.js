const registerForm = document.querySelector('#register-form');
const registerButton = document.querySelector('.form-submit-button--register');
let registering = false;

if (!registerForm) {
  console.warn("register-form not found");
} else {

  // Показываем ошибку под input
  function showFieldError(input, message) {
    let errorEl = input.parentElement.querySelector('.error-message');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'error-message';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.classList.add('active');
  }

  // Очистка ошибки
  function clearFieldError(input) {
    const errorEl = input.parentElement.querySelector('.error-message');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('active');
    }
  }

  // Очистка всех ошибок
  function clearAllErrors() {
    registerForm.querySelectorAll('input').forEach(input => clearFieldError(input));
  }

  // Клиентская проверка одного поля
  function validateInput(input) {
    const value = (input.value || '').trim();
    clearFieldError(input);

    if (input.required && !value) {
      showFieldError(input, `Поле ${input.name} обязательно`);
      return false;
    }

    if (input.type === 'email' && value) {
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(value)) {
        showFieldError(input, 'Введите корректный email');
        return false;
      }
    }

    return true;
  }

  // Валидация по blur
  registerForm.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => validateInput(input));
    input.addEventListener('input', () => clearFieldError(input));
  });

  // Submit формы
  registerButton.addEventListener('click', async (e) => {
    e.preventDefault();
    if (registering) return;

    clearAllErrors();
    let valid = true;

    // Клиентская валидация всех полей
    registerForm.querySelectorAll('input').forEach(input => {
      if (!validateInput(input)) valid = false;
    });

    // --- Проверка совпадения паролей ---
    const passwordInput = registerForm.querySelector('[name="password"]');
    const confirmInput = registerForm.querySelector('[name="password_confirm"]');

    const password = passwordInput ? passwordInput.value.trim() : '';
    const confirmPassword = confirmInput ? confirmInput.value.trim() : '';

    if (passwordInput && confirmInput && password !== confirmPassword) {
      showFieldError(confirmInput, 'Пароли не совпадают');
      valid = false; // помечаем форму как невалидную
    }

    // Если есть хоть одна ошибка, прекращаем отправку
    if (!valid) return;

    registering = true;
    registerButton.disabled = true;

    try {
      const formData = new FormData(registerForm);
      formData.append('csrf_token', window.csrfToken);

      const response = await fetch('./php/register.php', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (!window.csrfToken) {
        showGlobalMessage("⚠️ CSRF токен ещё не получен, попробуйте чуть позже.");
        return;
      }

      if (result.success) {
        if (result.user) {
          window.user = result.user;
        } else {
          window.user = {
            id: result.user_id || null,
            name: result.user_name || registerForm.login?.value || '',
            email: result.user_email || registerForm.email?.value || ''
          };
        }

        if (typeof window.onLoginOrRegister === 'function') {
          window.onLoginOrRegister(window.user);
        } else {
          if (typeof initPersonalAccount === 'function') {
            initPersonalAccount(window.user);
          }
        }
      } else {
        // Серверная валидация
        if (Array.isArray(result.fields) && result.fields.length) {
          result.fields.forEach(fieldName => {
            const input = registerForm.querySelector(`[name="${fieldName}"]`);
            if (input) showFieldError(input, `Поле ${fieldName} обязательно`);
          });
        } else if (result.field) {
          const input = registerForm.querySelector(`[name="${result.field}"]`);
          // Если сервер вернул конкретное поле и сообщение, показываем его
          if (input && result.message) {
            showFieldError(input, result.message);
          } else if (input) {
            showFieldError(input, 'Некорректное значение');
          }
        } else if (result.message) {
          // Обработка специфических сообщений
            if (result.field === 'password_confirm') {
              const confirmInput = registerForm.querySelector('[name="password_confirm"]');
              if (confirmInput) showFieldError(confirmInput, result.message);
            } else if (result.field === 'email') {
              const emailInput = registerForm.querySelector('[name="email"]');
              if (emailInput) showFieldError(emailInput, result.message);
            } else {
              // общий fallback — под первым input
              const firstInput = registerForm.querySelector('input');
              if (firstInput) showFieldError(firstInput, result.message);
            }
        }
      }

    } catch (err) {
      console.error(err);
      const firstInput = registerForm.querySelector('input');
      if (firstInput) showFieldError(firstInput, 'Ошибка сервера');
    } finally {
      registering = false;
      registerButton.disabled = false;
    }
  });
}
