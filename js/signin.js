

export function getSubmitWrapEl(signinButton) {
  if (signinButton) {
    return signinButton.closest('.form-submit-wrap') || signinButton.parentElement;
  }
  return null;
}

export function getOrCreateSubmitMessageEl(signinButton) {
  const wrap = getSubmitWrapEl(signinButton);
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

export function showSubmitMessage(text, type = 'error', signinButton) {
  const el = getOrCreateSubmitMessageEl(signinButton);
  if (!el) return;
  el.textContent = String(text || '');
  el.style.display = 'block';
  el.classList.remove('error', 'success');
  el.classList.add(type === 'success' ? 'success' : 'error');
}

export function clearSubmitMessage(signinButton) {
  const wrap = getSubmitWrapEl(signinButton);
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

let signingIn = false;

export async function autologinCheck() {
  try {
    const response = await fetch('./php/check_session.php', { credentials: 'include' });
    const data = await response.json();
    console.log('[SIGNIN] initial check_session result:', data);
    if (data.loggedIn) {
      window.user = data.user;
      if (typeof window.onLoginOrRegister === 'function') {
        try { await window.onLoginOrRegister(data.user); } catch (e) { console.warn('[SIGNIN] onLoginOrRegister failed', e); }
      } else {
        try { if (typeof initPersonalAccount === 'function') initPersonalAccount(data.user); } catch (e) { console.warn('[SIGNIN] initPersonalAccount failed', e); }
      }
    } else {
      console.log('[SIGNIN] autologin: user not logged in');
    }
  } catch (err) {
    console.error('[SIGNIN] Ошибка при проверке сессии:', err);
  }
}

export function initSignin() {
  const signinForm = document.querySelector('#signin-form');
  const signinButton = document.querySelector('.form-submit-button--signin');

  if (!signinForm) return;

  signinForm.addEventListener('valid-form-submit', async (e) => {
    e.preventDefault?.();

    if (signingIn) return;
    signingIn = true;

    if (signinButton) {
      signinButton.disabled = true;
      signinButton.dataset.oldText = signinButton.dataset.oldText || signinButton.textContent;
    }

    const clearAll = () => {
      const errors = signinForm.querySelectorAll('.error-message');
      errors.forEach(el => { el.textContent = ''; el.classList.remove('active'); });
      clearSubmitMessage(signinButton);
    };
    clearAll();

    const formData = new FormData(signinForm);
    try { await window.CSRFManager?.appendToFormData(formData); } catch (err) { console.warn('CSRF append failed (will still try):', err); }

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
        try { json = await resp.json(); } catch (_) { json = { message: 'Too many attempts. Try again later.' }; }

        const message = json && json.message ? json.message : 'Too many attempts. Try again later.';
        let retrySeconds = null;
        if (json && typeof json.retry_after === 'number') retrySeconds = parseInt(json.retry_after, 10);
        if (retrySeconds === null) {
          const ra = resp.headers && resp.headers.get ? resp.headers.get('Retry-After') : null;
          if (ra) {
            const raInt = parseInt(ra, 10);
            if (!Number.isNaN(raInt) && raInt > 0) retrySeconds = raInt;
          }
        }
        if (retrySeconds === null) retrySeconds = 300;

        const msgEl = getOrCreateSubmitMessageEl(signinButton);
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
        showSubmitMessage(json.message || 'Security error. Please refresh the page.', 'error', signinButton);

        try {
          if (window.CSRFManager && typeof window.CSRFManager.refresh === 'function') {
            await window.CSRFManager.refresh();
          } else {
            const tokenResp = await fetch('./php/get_csrf_token.php', { credentials: 'include' });
            const tok = await tokenResp.json().catch(()=>null);
            if (tok && tok.csrf_token) window.__csrf_token = tok.csrf_token;
          }
        } catch (err) { console.warn('Failed to refresh CSRF after 403:', err); }

        signingIn = false;
        if (signinButton) {
          signinButton.disabled = false;
          if (signinButton.dataset.oldText) signinButton.textContent = signinButton.dataset.oldText;
        }
        return;
      }

      const result = await resp.json().catch(() => ({ success: false, message: 'Invalid server response' }));

      if (result.success) {
        window.user = {
          id: result.user_id,
          name: result.user_name,
          email: result.user_email,
          password_mask: result.password_mask
        };

        try { await window.CSRFManager?.refresh(); } catch (err) { console.warn('[SIGNIN] CSRF refresh after login failed:', err); }

        clearSubmitMessage(signinButton);

        try {
          const signinSection = document.getElementById('signin-section') || signinForm.closest('section') || document.querySelector('.form-main');
          if (signinSection) {
            signinSection.classList.remove('visible');
            signinSection.classList.add('invisible');
            signinSection.style.pointerEvents = 'none';
            signinSection.style.opacity = 0;
          }

          const personalEl = document.getElementById('account-wrapper') || document.querySelector('.main-content-wrapper') || document.getElementById('personal-account') || document.getElementById('account-section');
          if (personalEl) {
            
            personalEl.classList.remove('invisible');
            personalEl.classList.add('visible');
            personalEl.style.pointerEvents = 'auto';
            personalEl.style.opacity = 1;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            
            try { if (typeof initPersonalAccount === 'function') await initPersonalAccount(window.user); } catch (e) { console.warn('[SIGNIN] initPersonalAccount after show failed', e); }
          }

          
          window.dispatchEvent(new CustomEvent('user:loggedin', { detail: window.user }));

          if (typeof window.onLoginOrRegister === 'function') {
            try { await window.onLoginOrRegister(window.user); } catch (e) { console.warn('[SIGNIN] direct onLoginOrRegister call failed', e); }
          }
        } catch (e) {
          console.warn('[SIGNIN] post-login UI switch failed', e);
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
            showSubmitMessage(result.message || 'Login failed', 'error', signinButton);
          }
        } else if (result.message) {
          showSubmitMessage(result.message, 'error', signinButton);
        } else {
          showSubmitMessage('Login failed', 'error', signinButton);
        }
      }
    } catch (err) {
      console.error('Signin request failed:', err);
      showSubmitMessage('Server error. Try later.', 'error', signinButton);
    } finally {
      if (earlyHandled) return;
      signingIn = false;
      if (signinButton) {
        signinButton.disabled = false;
        if (signinButton.dataset.oldText) signinButton.textContent = signinButton.dataset.oldText;
      }
      if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
      if (countdownTimeoutId) { clearTimeout(countdownTimeoutId); countdownTimeoutId = null; }
    }
  });
}
