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

// --- Обработка клика на кнопку Войти ---
signinButton.addEventListener('click', async (e) => {
  e.preventDefault();
  if (signingIn) return;
  signingIn = true;
  signinButton.disabled = true;

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
      alert(result.message);
    }
  } catch (err) {
    console.error(err);
    alert('Ошибка сервера');
  } finally {
    signingIn = false;
    signinButton.disabled = false;
  }
});