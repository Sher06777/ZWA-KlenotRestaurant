const registerForm = document.querySelector('.login-form'); // твоя форма регистрации
const registerButton = document.querySelector('.form-submit-button--register');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // предотвращаем стандартное поведение формы

  // собираем данные из формы
  const formData = new FormData(registerForm);

  // отправляем на сервер
  try {
    const response = await fetch('register.php', {
      method: 'POST',
      body: formData
    });

    const result = await response.text(); // сервер вернёт текстовое сообщение

    if (result.includes('Регистрация прошла успешно')) {
      // регистрация успешна — показываем личный кабинет
      showSection(personalAccount);
      loginText.textContent = 'My Account';
      mainContentWrapper?.classList.add('visible-padding');
      setLoggedIn(true);
    } else {
      // ошибка регистрации — показываем пользователю
      alert(result); // можно сделать красивый div с ошибкой
    }

  } catch (err) {
    console.error('Ошибка при регистрации:', err);
    alert('Произошла ошибка при подключении к серверу.');
  }
});