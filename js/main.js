document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Проверяем сессию
    const sessionRes = await fetch('check_session.php', { credentials: 'include' });
    const sessionData = await sessionRes.json();
    if (sessionData.loggedIn) {
      window.user = sessionData.user;
      initPersonalAccount(window.user);
    }

    // Получаем CSRF токен (один раз)
    const tokenRes = await fetch('get_csrf_token.php', { credentials: 'include' });
    const tokenData = await tokenRes.json();
    window.csrfToken = tokenData.csrf_token;
    console.log('✅ CSRF Token получен при загрузке страницы:', window.csrfToken);

  } catch (err) {
    console.error('Ошибка при инициализации сессии/CSRF:', err);
  }
});