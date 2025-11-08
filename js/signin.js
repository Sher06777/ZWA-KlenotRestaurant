const signinForm = document.querySelector('#signin-form');
const signinButton = document.querySelector('.form-submit-button--signin');
let signingIn = false;

try {
  localStorage.clear();
  sessionStorage.clear();
  console.log("🧹 LocalStorage и SessionStorage очищены");
} catch (e) {
  console.warn("Не удалось очистить localStorage:", e);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Проверяем активную сессию
    const response = await fetch('check_session.php', { credentials: 'include' });
    const data = await response.json();

    if (data.loggedIn) {
      console.log('✅ Пользователь уже вошёл:', data.user.name);
      window.user = data.user;
      initPersonalAccount(data.user);
      // Обновляем SPA
      if (typeof window.onLoginOrRegister === 'function') {
        window.onLoginOrRegister();
      }
    } else {
      console.log('👤 Пользователь не вошёл');
    }
  } catch (err) {
    console.error('Ошибка при проверке сессии:', err);
  }
});

// ---------- ВАЖНО: запускаем fetch только при "valid-form-submit" ----------
signinForm && signinForm.addEventListener('valid-form-submit', async (e) => {
  e.preventDefault?.();

  if (signingIn) return;
  signingIn = true;
  signinButton.disabled = true;

  // очищаем предыдущие ошибки (на всякий случай)
  const clearAll = () => {
    const errors = signinForm.querySelectorAll('.error-message');
    errors.forEach(el => { el.textContent = ''; el.classList.remove('active'); });
  };
  clearAll();

  const formData = new FormData(signinForm);

  try {
    const response = await fetch('signin.php', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      // Сохраняем глобально
      window.user = {
        id: result.user_id,
        name: result.user_name,
        email: result.user_email,
        password_mask: result.password_mask
      };

      // Инициализируем личный кабинет с данными
      initPersonalAccount(window.user);

      // Уведомляем SPA, что пользователь вошёл
      requestAnimationFrame(() => {
        if (typeof window.onLoginOrRegister === 'function') {
          window.onLoginOrRegister();
        }
      });
    } else {
      // показываем ошибки под конкретными полями, если поле указано
      if (result.field) {
        const field = signinForm.querySelector(`[name="${result.field}"]`);
        if (field) {
          const errorEl = field.nextElementSibling;
          if (errorEl && errorEl.classList.contains('error-message')) {
            errorEl.textContent = result.message;
            errorEl.classList.add('active');
          }
        } else {
          // fallback: показываем в первом error-message
          const firstError = signinForm.querySelector('.error-message');
          if (firstError) {
            firstError.textContent = result.message;
            firstError.classList.add('active');
          }
        }
      } else if (Array.isArray(result.fields) && result.fields.length) {
        // сервер вернул массив пропущенных полей
        result.fields.forEach(fName => {
          const field = signinForm.querySelector(`[name="${fName}"]`);
          if (field) {
            const errorEl = field.nextElementSibling;
            if (errorEl && errorEl.classList.contains('error-message')) {
              errorEl.textContent = 'Это поле обязательно';
              errorEl.classList.add('active');
            }
          }
        });
      } else if (result.message && /все поля|обязател/i.test(result.message.toLowerCase())) {
        // если сервер пишет "Все поля обязательны" — пометим все required поля
        const reqs = signinForm.querySelectorAll('input[required]');
        reqs.forEach(inp => {
          const errorEl = inp.nextElementSibling;
          if (errorEl && errorEl.classList.contains('error-message')) {
            if (!errorEl.textContent) {
              errorEl.textContent = 'Это поле обязательно';
              errorEl.classList.add('active');
            }
          }
        });
      } else {
        // универсальный fallback: показать сообщение в ближайшем .error-message под паролем (обычно это логичней)
        const pwd = signinForm.querySelector('input[name="password"]');
        if (pwd) {
          const errorEl = pwd.nextElementSibling;
          if (errorEl && errorEl.classList.contains('error-message')) {
            errorEl.textContent = result.message || 'Ошибка входа';
            errorEl.classList.add('active');
          }
        } else {
          const firstError = signinForm.querySelector('.error-message');
          if (firstError) {
            firstError.textContent = result.message || 'Ошибка входа';
            firstError.classList.add('active');
          }
        }
      }
    }
  } catch (err) {
    console.error(err);
    const firstError = signinForm.querySelector('.error-message');
    if (firstError) {
      firstError.textContent = 'Ошибка сервера. Попробуйте позже.';
      firstError.classList.add('active');
    }
  } finally {
    signingIn = false;
    signinButton.disabled = false;
  }
});