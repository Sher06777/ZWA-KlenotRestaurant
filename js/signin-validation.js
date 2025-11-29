document.addEventListener('DOMContentLoaded', () => {
  const forms = Array.from(document.querySelectorAll('form'));
  const globalErrorBox = document.getElementById('reservation-message');

  const loginField = document.getElementById('main-name');
  const emailField = document.getElementById('main-email');
  const passwordField = document.getElementById('main-password');

  // ---------- Helpers ----------
  function getErrorEl(input) {
    if (!input || !input.parentElement) return null;
    return input.parentElement.querySelector(".error-message");
  }

  function showError(input, message) {
    if (!input) return;
    const errorEl = getErrorEl(input);
    if (!errorEl) return;
    errorEl.textContent = String(message || '');
    errorEl.classList.add('active');
  }

  function clearError(input) {
    if (!input) return;
    const errorEl = getErrorEl(input);
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.remove('active');
  }

  function validateRequired(input, message) {
    if (!input) return true;
    if (!String(input.value || '').trim()) {
      showError(input, message);
      return false;
    }
    clearError(input);
    return true;
  }

  // ---------- BLUR validation ----------
  loginField?.addEventListener("blur", () => {
    validateRequired(loginField, "Username field is required");
  });

  emailField?.addEventListener("blur", () => {
    if (!emailField) return;
    const val = String(emailField.value || '').trim();
    if (!val) {
      showError(emailField, "Email field is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      showError(emailField, "Please enter a valid email");
    } else {
      clearError(emailField);
    }
  });

  passwordField?.addEventListener("blur", () => {
    validateRequired(passwordField, "Password field is required");
  });

  // ---------- Submit validation ----------
  forms.forEach(form => {
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      clearErrors(form);
      let isValid = true;

      const inputs = Array.from(form.querySelectorAll('input, textarea'));

      if (globalErrorBox) {
        globalErrorBox.style.display = 'none';
        globalErrorBox.textContent = '';
      }

      // HTML5 validity (если атрибуты стоят)
      inputs.forEach(input => {
        if (!input || !input.checkValidity()) {
          isValid = false;
          const errorEl = getErrorEl(input);
          if (errorEl) {
            errorEl.textContent = getErrorMessage(input);
            errorEl.classList.add('active');
          }
        }
      });

      // 🔥 SIGN-IN строгая логика: login + email + password обязательны
      if (form.id === 'signin-form') {
        const login = form.querySelector('input[name="login"]');
        const email = form.querySelector('input[name="email"]');
        const password = form.querySelector('input[name="password"]');

        const loginVal = login ? String(login.value || '').trim() : '';
        const emailVal = email ? String(email.value || '').trim() : '';
        const passwordVal = password ? String(password.value || '').trim() : '';

        if (!loginVal) {
          showError(login, "Please enter a login");
          isValid = false;
        }

        if (!emailVal) {
          showError(email, "Please enter an email");
          isValid = false;
        } else {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(emailVal)) {
            showError(email, "Please enter a valid email");
            isValid = false;
          }
        }

        if (!passwordVal) {
          showError(password, "Please enter a password");
          isValid = false;
        }
      }

      if (isValid) {
        const evt = new CustomEvent("valid-form-submit", { bubbles: true, cancelable: true });
        form.dispatchEvent(evt);
      } else {
        if (globalErrorBox) {
          globalErrorBox.style.display = 'block';
          globalErrorBox.textContent = 'Please correct the highlighted errors.';
        }
      }
    });

    // Очистка ошибки при вводе
    form.addEventListener('input', (e) => {
      const input = e.target;
      if (!input || !(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;
      if (!form.contains(input)) return;
      clearError(input);
    });
  });

  // ---------- Utility ----------
  function clearErrors(form) {
    if (!form) return;
    const errors = Array.from(form.querySelectorAll('.error-message'));
    errors.forEach(el => {
      el.textContent = '';
      el.classList.remove('active');
    });
  }

  function getErrorMessage(input) {
    if (!input || !input.validity) return 'Invalid value';
    if (input.validity.valueMissing) return 'This field is required';
    if (input.validity.typeMismatch && input.type === 'email') return 'Please enter a valid email';
    if (input.validity.patternMismatch) return 'Invalid format';
    if (input.validity.tooShort) return `Minimum length: ${input.minLength}`;
    if (input.validity.tooLong) return `Maximum length: ${input.maxLength}`;
    return 'Invalid value';
  }
});
