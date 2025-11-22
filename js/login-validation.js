const loginForm = document.querySelector('.login-form');
const loginBtn = document.querySelector('.form-submit-button--register');
let loginInProgress = false;

if (!loginForm) {
  console.warn("login-form not found");
} else {

  if (window.CSRFManager) {
    window.CSRFManager.init().catch(()=>{});
  }

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

  // Проверка совпадения пароля и confirm password
  function validateConfirmPassword() {
    const passwordInput = loginForm.querySelector('input[name="password"]');
    const confirmInput = loginForm.querySelector('input[name="password_confirm"]');
    if (!passwordInput || !confirmInput) return true;

    const password = (passwordInput.value || '').trim();
    const confirm = (confirmInput.value || '').trim();

    if (confirm && password !== confirm) {
      showFieldError(confirmInput, 'Passwords do not match');
      return false;
    } else {
      clearFieldError(confirmInput);
      return true;
    }
  }

  // Очистка всех ошибок формы
  function clearAllErrors() {
    loginForm.querySelectorAll('input').forEach(input => clearFieldError(input));
  }

  // Валидация по blur и input
  loginForm.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => {
      const value = (input.value || '').trim();

      if (input.required && !value) {
        showFieldError(input, `The ${input.name} field is required`);
        return;
      }

      if (input.type === 'email' && value) {
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) {
          showFieldError(input, 'Please enter a valid email');
        } else {
          clearFieldError(input);
        }
      }

      if (input.name === 'password_confirm') {
        validateConfirmPassword();
      }
    });

    input.addEventListener('input', () => {
      clearFieldError(input);
      if (input.name === 'password_confirm') validateConfirmPassword();
    });
  });

  // Submit формы
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (loginInProgress) return;

    clearAllErrors();

    let valid = true;

    loginForm.querySelectorAll('input').forEach(input => {
      const value = (input.value || '').trim();

      if (input.required && !value) {
        showFieldError(input, `The ${input.name} field is required`);
        valid = false;
      }

      if (input.type === 'email' && value) {
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) {
          showFieldError(input, 'Please enter a valid email');
          valid = false;
        }
      }
    });

    // Проверяем, что password и confirm совпадают
    if (!validateConfirmPassword()) valid = false;

    if (!valid) return;

    loginInProgress = true;
    loginBtn.disabled = true;

    try {
      const formData = new FormData(loginForm);
      try {
        window.CSRFManager?.appendToFormData(formData);
      } catch (err) {
        console.warn('CSRF append failed for login:', err);
      }

      let res = await (window.CSRFManager
        ? window.CSRFManager.fetchWithCsrf("./php/login.php", { method: "POST", body: formData, credentials: 'include' })
        : fetch("./php/login.php", { method: "POST", body: formData, credentials: 'include' }));

      if (res.status === 403) {
        // попробуем обновить токен и повторить 1 раз
        await window.CSRFManager?.refresh().catch(()=>{});
        res = await (window.CSRFManager
          ? window.CSRFManager.fetchWithCsrf("./php/login.php", { method: "POST", body: formData, credentials: 'include' })
          : fetch("./php/login.php", { method: "POST", body: formData, credentials: 'include' }));
      }

      const result = await res.json();

      if (result.success) {
        if (typeof window.onLoginOrRegister === "function") {
          // После успешного логина обновляем CSRF (чтобы получить свежий токен для авторизованных запросов)
          try { await window.CSRFManager?.refresh(); } catch (err) { console.warn('CSRF refresh after login failed', err); }
          window.onLoginOrRegister();
        }
        loginForm.reset();
      } else {
        if (result.field) {
          const fieldInput = loginForm.querySelector(`[name="${result.field}"]`);
          if (fieldInput) {
            showFieldError(fieldInput, result.message);
          }
        } else {
          const passwordInput = loginForm.password;
          showFieldError(passwordInput, result.message || "Invalid login or password");
        }
      }

    } catch (err) {
      console.error(err);
      const passwordInput = loginForm.password;
      showFieldError(passwordInput, "Server error");
    } finally {
      loginInProgress = false;
      loginBtn.disabled = false;
    }
  });
}