// signin.js — fixed: show 429 message + countdown and show messages next to signin button (form-submit-wrap)

const signinForm = document.querySelector('#signin-form');
const signinButton = document.querySelector('.form-submit-button--signin');
let signingIn = false;

// try {
//   localStorage.removeItem('myApp:tempData');
//   sessionStorage.removeItem('myApp:tempSession');
//   console.log("🧹 LocalStorage и SessionStorage очищены");
// } catch (e) {
//   console.warn("Не удалось очистить localStorage:", e);
// }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('./php/check_session.php', { credentials: 'include' });
    const data = await response.json();

    if (data.loggedIn) {
      console.log('✅ Пользователь уже вошёл:', data.user.name);
      window.user = data.user;
      initPersonalAccount(data.user);
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

/* -------------------------
   Helpers: local message area
   ------------------------- */
function getSubmitWrapEl() {
  if (signinButton) {
    return signinButton.closest('.form-submit-wrap') || signinButton.parentElement;
  }
  return null;
}

function getOrCreateSubmitMessageEl() {
  const wrap = getSubmitWrapEl();
  if (wrap) {
    const next = wrap.nextElementSibling;
    if (next && next.classList && next.classList.contains('form-submit-message')) {
      return next;
    }
    const msg = document.createElement('p');
    msg.className = 'form-submit-message error-message';
    wrap.insertAdjacentElement('afterend', msg);
    return msg;
  }
  let global = document.getElementById('reservation-message');
  if (global) return global;
  return null;
}

function showSubmitMessage(text, type = 'error') {
  const el = getOrCreateSubmitMessageEl();
  if (!el) return;
  el.textContent = String(text || '');
  el.style.display = 'block';
  el.classList.remove('error', 'success');
  el.classList.add(type === 'success' ? 'success' : 'error');
}

function clearSubmitMessage() {
  const wrap = getSubmitWrapEl();
  if (wrap) {
    const next = wrap.nextElementSibling;
    if (next && next.classList && next.classList.contains('form-submit-message')) {
      next.textContent = '';
      next.style.display = 'none';
      next.classList.remove('error', 'success');
    }
    return;
  }
  const global = document.getElementById('reservation-message');
  if (global) {
    global.textContent = '';
    global.style.display = 'none';
    global.classList.remove('error', 'success');
  }
}

/* -------------------------
   Main submit handler
   ------------------------- */
signinForm && signinForm.addEventListener('valid-form-submit', async (e) => {
  e.preventDefault?.();

  if (signingIn) return;
  signingIn = true;

  // Блокируем кнопку, но НЕ меняем её текст (чтобы при блокировке было "SIGN IN")
  if (signinButton) {
    signinButton.disabled = true;
    // сохраняем текст на всякий случай, но не изменяем сейчас
    signinButton.dataset.oldText = signinButton.dataset.oldText || signinButton.textContent;
  }

  // очистим старые клиентские ошибки и локальное сообщение
  const clearAll = () => {
    const errors = signinForm.querySelectorAll('.error-message');
    errors.forEach(el => { el.textContent = ''; el.classList.remove('active'); });
    clearSubmitMessage();
  };
  clearAll();

  // формируем formData и добавляем CSRF (через менеджер)
  const formData = new FormData(signinForm);
  try {
    await window.CSRFManager?.appendToFormData(formData);
  } catch (err) {
    console.warn('CSRF append failed (will still try):', err);
  }

  let earlyHandled = false;
  let countdownIntervalId = null;
  let countdownTimeoutId = null;

  try {
    const resp = await fetch('./php/signin.php', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (resp.status === 429) {
      earlyHandled = true;

      let json = null;
      try {
        json = await resp.json();
      } catch (_) {
        json = { message: 'Too many attempts. Try again later.' };
      }

      const message = json && json.message ? json.message : 'Too many attempts. Try again later.';

      // предпочтительно используем retry_after из JSON, иначе из заголовка Retry-After, иначе fallback = 300
      let retrySeconds = null;
      if (json && typeof json.retry_after === 'number') {
        retrySeconds = parseInt(json.retry_after, 10);
      }
      if (retrySeconds === null) {
        const ra = resp.headers && resp.headers.get ? resp.headers.get('Retry-After') : null;
        if (ra) {
          const raInt = parseInt(ra, 10);
          if (!Number.isNaN(raInt) && raInt > 0) retrySeconds = raInt;
        }
      }
      if (retrySeconds === null) retrySeconds = 300;

      const msgEl = getOrCreateSubmitMessageEl();
      if (msgEl) {
        let remaining = retrySeconds;
        const format = (s) => {
          const mm = Math.floor(s / 60).toString().padStart(2, '0');
          const ss = (s % 60).toString().padStart(2, '0');
          return `${mm}:${ss}`;
        };

        msgEl.textContent = `${message} Повтор через ${format(remaining)}.`;
        msgEl.style.display = 'block';
        msgEl.classList.remove('success');
        msgEl.classList.add('error');

        countdownIntervalId = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
            msgEl.textContent = `${message} Попробуйте снова.`;
          } else {
            msgEl.textContent = `${message} Повтор через ${format(remaining)}.`;
          }
        }, 1000);

        countdownTimeoutId = setTimeout(() => {
          if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
          // восстановим кнопку и уберём сообщение
          signingIn = false;
          if (signinButton) {
            signinButton.disabled = false;
            if (signinButton.dataset.oldText) signinButton.textContent = signinButton.dataset.oldText;
          }
          msgEl.textContent = '';
          msgEl.style.display = 'none';
          msgEl.classList.remove('error');
        }, retrySeconds * 1000);
      } else {
        console.log(message);
        signingIn = false;
        if (signinButton) {
          signinButton.disabled = false;
          if (signinButton.dataset.oldText) signinButton.textContent = signinButton.dataset.oldText;
        }
      }

      return;
    }

    if (resp.status === 403) {
      let json = { success: false, message: 'Invalid CSRF token' };
      try { json = await resp.json(); } catch (e) {}

      // Показываем сообщение
      showSubmitMessage(json.message || 'Security error. Please refresh the page.', 'error');

      // Обновим CSRF: сначала попробуем CSRFManager.refresh(), иначе запросим get_csrf_token.php
      try {
        if (window.CSRFManager && typeof window.CSRFManager.refresh === 'function') {
          await window.CSRFManager.refresh();
        } else {
          const tokenResp = await fetch('./php/get_csrf_token.php', { credentials: 'include' });
          const tok = await tokenResp.json().catch(()=>null);
          // если есть у вас CSRFManager API для установки токена, можно его вызвать тут, например:
          // if (tok && tok.csrf_token && window.CSRFManager && typeof window.CSRFManager.setToken === 'function') {
          //   window.CSRFManager.setToken(tok.csrf_token);
          // }
          // иначе — просто сохраняем в переменную, CSRFManager.appendToFormData должно заново запросить токен или использовать refresh
          if (tok && tok.csrf_token) {
            window.__csrf_token = tok.csrf_token;
          }
        }
      } catch (err) {
        console.warn('Failed to refresh CSRF after 403:', err);
      }

      // разблокируем кнопку (и не скрываем сообщение)
      signingIn = false;
      if (signinButton) {
        signinButton.disabled = false;
        if (signinButton.dataset.oldText) signinButton.textContent = signinButton.dataset.oldText;
      }
      return;
    }

    const result = await resp.json().catch(() => ({ success: false, message: 'Invalid server response' }));

    if (result.success) {
      // Устанавливаем глобального пользователя и инициализируем UI
      window.user = {
        id: result.user_id,
        name: result.user_name,
        email: result.user_email,
        password_mask: result.password_mask
      };

      initPersonalAccount(window.user);

      try {
        await window.CSRFManager?.refresh();
      } catch (err) {
        console.warn('CSRF refresh after login failed:', err);
      }

      clearSubmitMessage();

      // ---- НОВОЕ: явно скрываем форму входа и показываем секцию аккаунта ----
      try {
        // Скрыть секцию входа (если есть)
        const signinSection = document.getElementById('signin-section') || signinForm.closest('section') || document.querySelector('.form-main');
        if (signinSection) {
          signinSection.classList.remove('visible');
          signinSection.classList.add('invisible');
          signinSection.style.pointerEvents = 'none';
          signinSection.style.opacity = 0;
        }

        // Показать секцию личного кабинета (если есть)
        const personalEl = document.querySelector('.main-content-wrapper') || document.getElementById('personal-account') || document.getElementById('account-section');
        if (personalEl) {
          personalEl.classList.remove('invisible');
          personalEl.classList.add('visible');
          personalEl.style.pointerEvents = 'auto';
          personalEl.style.opacity = 1;
          // чуть прокручиваем наверх
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Попробуем вызвать глобальный хук (если есть) — всё равно безопасно
        window.dispatchEvent(new CustomEvent('user:loggedin', { detail: window.user }));
      } catch (e) {
        try { if (typeof window.onLoginOrRegister === 'function') window.onLoginOrRegister(window.user); } catch (ee) { console.warn('onLogin fallback failed', ee); }
      }
    } else {
      if (Array.isArray(result.fields) && result.fields.length) {
        result.fields.forEach(fName => {
          const field = signinForm.querySelector(`[name="${fName}"]`);
          if (field) {
            const errEl = field.parentElement.querySelector('.error-message');
            if (errEl) {
              errEl.textContent = result.message || 'This field is required';
              errEl.classList.add('active');
            }
          }
        });
      } else if (result.field) {
        const field = signinForm.querySelector(`[name="${result.field}"]`);
        if (field) {
          const errEl = field.parentElement.querySelector('.error-message');
          if (errEl) {
            errEl.textContent = result.message || 'Invalid value';
            errEl.classList.add('active');
          }
        } else {
          showSubmitMessage(result.message || 'Login failed', 'error');
        }
      } else if (result.message) {
        showSubmitMessage(result.message, 'error');
      } else {
        showSubmitMessage('Login failed', 'error');
      }
    }
  } catch (err) {
    console.error('Signin request failed:', err);
    showSubmitMessage('Server error. Try later.', 'error');
  } finally {
    // если ранняя обработка была выполнена, не стираем сообщение (earlyHandled блокирует "финальный" сброс)
    if (earlyHandled) {
      return;
    }

    signingIn = false;
    if (signinButton) {
      signinButton.disabled = false;
      if (signinButton.dataset.oldText) signinButton.textContent = signinButton.dataset.oldText;
    }

    if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
    if (countdownTimeoutId) { clearTimeout(countdownTimeoutId); countdownTimeoutId = null; }
  }
});
