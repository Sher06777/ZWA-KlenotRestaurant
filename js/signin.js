const signinForm = document.querySelector('#signin-form');
const signinButton = document.querySelector('.form-submit-button--signin');
let signingIn = false;

signinButton.addEventListener('click', async () => {

  if (signingIn) return;
  signingIn = true;
  signinButton.disabled = true;

  const formData = new FormData(signinForm);

  try {
    const response = await fetch('signin.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (result.success) {
      // Успешный вход — показываем My Account
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
    signingIn = false;
    signinButton.disabled = false;
  }
});