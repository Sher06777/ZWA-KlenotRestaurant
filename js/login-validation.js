const loginForm = document.querySelector('.login-form');
const loginBtn = document.querySelector('.form-submit-button--register');
let loginInProgress = false;

if (!loginForm) {
  console.warn("login-form not found");
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

  // Проверка совпадения пароля и confirm password
  function validateConfirmPassword() {
    const passwordInput = loginForm.querySelector('input[name="password"]');
    const confirmInput = loginForm.querySelector('input[name="password_confirm"]');
    if (!passwordInput || !confirmInput) return true;

    const password = (passwordInput.value || '').trim();
    const confirm = (confirmInput.value || '').trim();

    if (confirm && password !== confirm) {
      showFieldError(confirmInput, 'Пароли не совпадают');
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
        showFieldError(input, `Поле ${input.name} обязательно`);
        return;
      }

      if (input.type === 'email' && value) {
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) {
          showFieldError(input, 'Введите корректный email');
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
        showFieldError(input, `Поле ${input.name} обязательно`);
        valid = false;
      }

      if (input.type === 'email' && value) {
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) {
          showFieldError(input, 'Введите корректный email');
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
      const res = await fetch("login.php", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      const result = await res.json();

      if (result.success) {
        if (typeof window.onLoginOrRegister === "function") {
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
          showFieldError(passwordInput, result.message || "Неверный логин или пароль");
        }
      }

    } catch (err) {
      console.error(err);
      const passwordInput = loginForm.password;
      showFieldError(passwordInput, "Ошибка сервера");
    } finally {
      loginInProgress = false;
      loginBtn.disabled = false;
    }
  });
}
