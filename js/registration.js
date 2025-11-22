const registerForm = document.querySelector('#register-form');
const registerButton = document.querySelector('.form-submit-button--register');
let registering = false;

if (!registerForm) {
  console.warn("register-form not found");
} else {

  if (window.CSRFManager) {
    window.CSRFManager.init().catch(()=>{});
  }

  // Показываем ошибку под input (безопасно через textContent)
  function showFieldError(input, message) {
    if (!input || !input.parentElement) return;
    let errorEl = input.parentElement.querySelector('.error-message');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'error-message';
      input.parentElement.appendChild(errorEl);
    }
    // всегда используем textContent — безопасно
    errorEl.textContent = String(message || '');
    errorEl.classList.add('active');
  }

  // Очистка ошибки
  function clearFieldError(input) {
    if (!input || !input.parentElement) return;
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
    if (!input) return true;
    const value = (input.value || '').trim();
    clearFieldError(input);

    if (input.required && !value) {
      showFieldError(input, `The ${input.name} field is required`);
      return false;
    }

    if (input.type === 'email' && value) {
      const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailReg.test(value)) {
        showFieldError(input, 'Please enter a valid email');
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

  // Защита: убедимся, что есть кнопка
  if (!registerButton) {
    console.warn('register button not found');
  }

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
      showFieldError(confirmInput, 'Passwords do not match');
      valid = false;
    }

    // Дополнительная рекомендуемая проверка: минимальная длина пароля
    if (passwordInput && password.length > 0 && password.length < 8) {
      showFieldError(passwordInput, 'Password must be at least 8 characters');
      valid = false;
    }

    if (!valid) return;

    registering = true;
    registerButton.disabled = true;

    try {
      // Сначала создаём formData и ИЗВЕСТНО добавляем CSRF (await!)
      let formData = new FormData(registerForm);
      try {
        if (window.CSRFManager && typeof window.CSRFManager.appendToFormData === 'function') {
          await window.CSRFManager.appendToFormData(formData);
        }
      } catch (err) {
        console.warn('CSRF append failed for register (will still try):', err);
      }

      // Выполняем fetch — используем let resp (можно перезаписать при retry)
      let resp;
      if (window.CSRFManager && typeof window.CSRFManager.fetchWithCsrf === 'function') {
        resp = await window.CSRFManager.fetchWithCsrf('./php/register.php', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      } else {
        resp = await fetch('./php/register.php', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
      }

      // Если сервер ответил 403 — попытаемся обновить токен и повторить один раз
      if (resp && resp.status === 403 && window.CSRFManager && typeof window.CSRFManager.refresh === 'function') {
        try {
          await window.CSRFManager.refresh();
          // создаём заново FormData и добавляем свежий токен
          formData = new FormData(registerForm);
          await window.CSRFManager.appendToFormData(formData);
          if (window.CSRFManager && typeof window.CSRFManager.fetchWithCsrf === 'function') {
            resp = await window.CSRFManager.fetchWithCsrf('./php/register.php', {
              method: 'POST',
              credentials: 'include',
              body: formData
            });
          } else {
            resp = await fetch('./php/register.php', {
              method: 'POST',
              credentials: 'include',
              body: formData
            });
          }
        } catch (err) {
          console.warn('Retry after CSRF refresh failed:', err);
        }
      }

      const result = await (resp && resp.json ? resp.json().catch(() => ({ success: false, error: 'invalid json' })) : Promise.resolve({ success: false, error: 'no response' }));

      if (window.CSRFManager && typeof window.CSRFManager.isInitialized === 'function') {
        if (!window.CSRFManager.isInitialized()) {
          console.warn('CSRFManager not initialized at registration time.');
        }
      }

      if (result.success) {
        // Получили успешный ответ — записываем user (сервер должен вернуть безопасные поля)
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
        } else if (typeof initPersonalAccount === 'function') {
          initPersonalAccount(window.user);
        }
      } else {
        // Обработка ошибок от сервера — result.fields | result.field | result.message
        if (Array.isArray(result.fields) && result.fields.length) {
          result.fields.forEach(fieldName => {
            const input = registerForm.querySelector(`[name="${fieldName}"]`);
            if (input) showFieldError(input, `The ${fieldName} field is required`);
          });
        } else if (result.field) {
          const input = registerForm.querySelector(`[name="${result.field}"]`);
          if (input) {
            // показываем сообщение от сервера, но оно выводится через textContent — безопасно
            showFieldError(input, result.message || 'Invalid value');
          }
        } else if (result.message) {
          const firstInput = registerForm.querySelector('input');
          if (firstInput) showFieldError(firstInput, result.message);
        } else {
          const firstInput = registerForm.querySelector('input');
          if (firstInput) showFieldError(firstInput, 'Registration failed');
        }
      }

    } catch (err) {
      console.error('Registration error:', err);
      const firstInput = registerForm.querySelector('input');
      if (firstInput) showFieldError(firstInput, 'Server error');
    } finally {
      registering = false;
      registerButton.disabled = false;
    }
  });
}
