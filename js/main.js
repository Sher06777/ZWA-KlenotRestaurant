document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Проверяем сессию
    const sessionRes = await fetch('./php/check_session.php', { credentials: 'include' });
    const sessionData = await sessionRes.json();
    if (sessionData.loggedIn) {
      window.user = sessionData.user;
      initPersonalAccount(window.user);
    }

    // Инициализируем CSRFManager (не кладём токен в window)
    try {
      await window.CSRFManager?.init();
      console.log('✅ CSRFManager initialized (token stored securely inside module).');
    } catch (err) {
      console.warn('Не удалось получить CSRF токен при загрузке страницы:', err);
    }

  } catch (err) {
    console.error('Error initializing session/CSRF:', err);
  }

  if (window.CSRFManager) {
    window.CSRFManager.init().catch(err => console.error('CSRF init failed', err));
  }
});