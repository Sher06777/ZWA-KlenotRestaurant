document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  const globalErrorBox = document.getElementById('reservation-message');

  const loginField = document.getElementById('main-name');
  const emailField = document.getElementById('main-email');
  const passwordField = document.getElementById('main-password');

  // ---------- Helpers ----------
  function getErrorEl(input) {
    return input.parentElement.querySelector(".error-message");
  }

  function showError(input, message) {
    const errorEl = getErrorEl(input);
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.add('active');
  }

  function clearError(input) {
    const errorEl = getErrorEl(input);
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.remove('active');
  }

  function validateRequired(input, message) {
    if (!input.value.trim()) {
      showError(input, message);
      return false;
    }
    clearError(input);
    return true;
  }

  // ---------- BLUR validation ----------
  loginField?.addEventListener("blur", () => {
    validateRequired(loginField, "Поле логина обязательно");
  });

  emailField?.addEventListener("blur", () => {
    const val = emailField.value.trim();
    if (!val) {
      showError(emailField, "Поле Email обязательно");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      showError(emailField, "Введите корректный Email");
    } else {
      clearError(emailField);
    }
  });

  passwordField?.addEventListener("blur", () => {
    validateRequired(passwordField, "Поле пароля обязательно");
  });

  // ---------- Submit validation ----------
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      clearErrors(form);

      let isValid = true;
      const inputs = form.querySelectorAll('input, textarea');

      if (globalErrorBox) {
        globalErrorBox.style.display = 'none';
        globalErrorBox.textContent = '';
      }

      inputs.forEach(input => {
        const errorEl = getErrorEl(input);
        if (!input.checkValidity()) {
          isValid = false;
          if (errorEl) {
            errorEl.textContent = getErrorMessage(input);
            errorEl.classList.add('active');
          }
        }
      });

      // SIGN-IN form extra validation
      if (form.id === 'signin-form') {
        const login = form.querySelector('input[name="login"]');
        const email = form.querySelector('input[name="email"]');
        const password = form.querySelector('input[name="password"]');

        if (!login.value.trim()) {
          showError(login, "Введите логин");
          isValid = false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
          showError(email, "Введите email");
          isValid = false;
        } else if (!emailPattern.test(email.value.trim())) {
          showError(email, "Введите корректный email");
          isValid = false;
        }

        if (!password.value.trim()) {
          showError(password, "Введите пароль");
          isValid = false;
        }
      }

      if (isValid) {
        form.dispatchEvent(new Event("valid-form-submit", { cancelable: true }));
      }
    });

    // Очистка ошибки при вводе текста
    form.addEventListener('input', (e) => {
      const input = e.target;
      clearError(input);
    });
  });

  // ---------- Utility funcs ----------
  function clearErrors(form) {
    const errors = form.querySelectorAll('.error-message');
    errors.forEach(el => {
      el.textContent = '';
      el.classList.remove('active');
    });
  }

  function getErrorMessage(input) {
    if (input.validity.valueMissing) return 'Это поле обязательно';
    if (input.validity.typeMismatch && input.type === 'email') return 'Введите корректный email';
    if (input.validity.patternMismatch) return 'Неверный формат';
    if (input.validity.tooShort) return `Минимальная длина: ${input.minLength}`;
    if (input.validity.tooLong) return `Максимальная длина: ${input.maxLength}`;
    return 'Неверное значение';
  }
});
