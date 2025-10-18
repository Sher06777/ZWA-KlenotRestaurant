const registerForm = document.querySelector('#register-form');
const registerButton = document.querySelector('.form-submit-button--register');
let registering = false;

registerButton.addEventListener('click', async () => {
  if (registering) return; // предотвращаем повторную отправку
  registering = true;
  registerButton.disabled = true;

  const formData = new FormData(registerForm);

  try {
    const response = await fetch('register.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      // Здесь открываем секцию My Account
      if (typeof window.onLoginOrRegister === 'function') {
        window.onLoginOrRegister();
      }
    } else {
      alert(result.message);
    }

  } catch (err) {
    console.error(err);
    alert('Ошибка сервера');
  } finally {
    registering = false;
    registerButton.disabled = false;
  }
});