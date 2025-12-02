// reservation.js — безопасная версия как ES module
export async function initReservation() {
  const reservationForm = document.getElementById("reservation-form");
  const reservationButton = document.querySelector(".reservation-submit-btn");
  const reservationMessage = document.getElementById("reservation-message");

  // guard
  if (!reservationForm) {
    console.warn("reservation-form not found in DOM");
    return;
  }

  const MAX_NAME = 100, MAX_PHONE = 30, MAX_EMAIL = 254, MAX_MESSAGE = 100, MIN_PEOPLE = 1, MAX_PEOPLE = 20;

  async function buildReservationFormData() {
    if (!reservationForm) throw new Error('Form not found');
    const formData = new FormData(reservationForm);
    try {
      if (window.CSRFManager && typeof window.CSRFManager.appendToFormData === 'function') {
        await window.CSRFManager.appendToFormData(formData);
      }
    } catch (e) {
      console.warn('CSRF append error (continuing without body token):', e);
    }
    return formData;
  }

  // init CSRF best-effort
  if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
    window.CSRFManager.init().catch(()=>{});
  }

  // helpers for errors
  function showFieldError(input, message) {
    if (!input || !input.parentElement) return;
    let errorEl = input.parentElement.querySelector('.error-message');
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.className = 'error-message';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = String(message || '');
    errorEl.classList.add('active');
  }
  function clearFieldError(input) {
    if (!input || !input.parentElement) return;
    const errorEl = input.parentElement.querySelector('.error-message');
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('active'); }
  }
  function showGlobalMessage(text, type = 'error') {
    if (!reservationMessage) return;
    reservationMessage.textContent = String(text || '');
    reservationMessage.style.display = 'block';
    reservationMessage.classList.remove('error','success');
    reservationMessage.classList.add(type === 'success' ? 'success' : 'error');
  }
  function clearGlobalMessage() {
    if (!reservationMessage) return;
    reservationMessage.textContent = ''; reservationMessage.style.display = 'none';
    reservationMessage.classList.remove('error','success');
  }
  function clearAllErrors() {
    reservationForm.querySelectorAll('.error-message').forEach(el => { el.textContent = ''; el.classList.remove('active'); });
    clearGlobalMessage();
  }

  // custom number +/- buttons
  document.querySelectorAll('.custom-number-inline').forEach(wrapper => {
    const input = wrapper.querySelector('input[type="number"]');
    const btnUp = wrapper.querySelector('.up');
    const btnDown = wrapper.querySelector('.down');
    if (!input) return;
    btnUp && btnUp.addEventListener('click', () => {
      const max = input.max ? parseInt(input.max, 10) : Infinity;
      input.value = Math.min(max, (parseInt(input.value, 10) || 0) + 1);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    btnDown && btnDown.addEventListener('click', () => {
      const min = input.min ? parseInt(input.min, 10) : -Infinity;
      input.value = Math.max(min, (parseInt(input.value, 10) || 0) - 1);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // validation on blur / input
  reservationForm.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
      const value = (input.value || '').trim();
      if (input.required && !value) { showFieldError(input, 'This field is required'); return; }

      if (input.type === 'email' && value) {
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) { showFieldError(input, 'Please enter a valid email'); } else clearFieldError(input);
      }
      if (input.type === 'tel' && value) {
        const phoneReg = /^[0-9+\s\-()]{7,20}$/u;
        if (!phoneReg.test(value)) showFieldError(input, 'Invalid phone format'); else clearFieldError(input);
      }
      if (input.type === 'number') {
        const num = parseInt(value, 10);
        const min = input.min ? parseInt(input.min, 10) : MIN_PEOPLE;
        const max = input.max ? parseInt(input.max, 10) : MAX_PEOPLE;
        if (isNaN(num) || num < min || num > max) showFieldError(input, `The number of guests must be between ${min} and ${max}`); else clearFieldError(input);
      }
    });
    input.addEventListener('input', () => clearFieldError(input));
  });

  // submit handler
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const name = (reservationForm.name?.value || '').trim();
    const phone = (reservationForm.phone?.value || '').trim();
    const email = (reservationForm.email?.value || '').trim();
    const date = (reservationForm.date?.value || '').trim();
    const time = (reservationForm.time?.value || '').trim();
    const peopleRaw = (reservationForm.people?.value || '').trim();
    const people = Number.isFinite(Number(peopleRaw)) ? Math.round(Number(peopleRaw)) : NaN;
    const message = (reservationForm.message?.value || '').trim();

    let valid = true;
    if (!name) { showFieldError(reservationForm.name, 'Enter the name'); valid = false; }
    if (!phone) { showFieldError(reservationForm.phone, 'Enter the phone number'); valid = false; }
    if (!email) { showFieldError(reservationForm.email, 'Enter the email'); valid = false; }
    if (!date) { showFieldError(reservationForm.date, 'Enter the date'); valid = false; }
    if (!time) { showFieldError(reservationForm.time, 'Enter the time'); valid = false; }
    if (!peopleRaw || Number.isNaN(people)) { showFieldError(reservationForm.people, 'Enter the number of guests'); valid = false; }

    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailReg.test(email)) { showFieldError(reservationForm.email, 'Enter a valid email'); valid = false; }

    const phoneReg = /^[0-9+\s\-()]{7,20}$/u;
    if (phone && !phoneReg.test(phone)) { showFieldError(reservationForm.phone, 'Invalid phone format'); valid = false; }

    const dateReg = /^\d{4}-\d{2}-\d{2}$/;
    if (date && (!dateReg.test(date) || isNaN(Date.parse(date)))) { showFieldError(reservationForm.date, 'Invalid date'); valid = false; }

    const timeReg = /^\d{2}:\d{2}$/;
    if (time && !timeReg.test(time)) { showFieldError(reservationForm.time, 'Invalid time'); valid = false; }

    if (!Number.isNaN(people) && (people < MIN_PEOPLE || people > MAX_PEOPLE)) { showFieldError(reservationForm.people, `The number of guests must be between ${MIN_PEOPLE} and ${MAX_PEOPLE}`); valid = false; }

    if (name.length > MAX_NAME) { showFieldError(reservationForm.name, `Name too long (max ${MAX_NAME}).`); valid = false; }
    if (phone.length > MAX_PHONE) { showFieldError(reservationForm.phone, `Phone too long (max ${MAX_PHONE}).`); valid = false; }
    if (email.length > MAX_EMAIL) { showFieldError(reservationForm.email, `Email too long (max ${MAX_EMAIL}).`); valid = false; }
    if (message.length > MAX_MESSAGE) { showFieldError(reservationForm.message, `Message too long (max ${MAX_MESSAGE}).`); valid = false; }

    if (!valid) { showGlobalMessage('⚠️ Please correct the errors in the form.'); return; }

    if (reservationButton) { reservationButton.disabled = true; reservationButton.classList.add('loading'); }

    try {
      async function doFetchWithManager(formData) {
        if (window.CSRFManager && typeof window.CSRFManager.fetchWithCsrf === 'function') {
          return window.CSRFManager.fetchWithCsrf("./php/reservation.php", { method: "POST", body: formData, credentials: "include" });
        } else {
          return fetch("./php/reservation.php", { method: "POST", body: formData, credentials: "include" });
        }
      }

      let formData = await buildReservationFormData();
      let response = await doFetchWithManager(formData);

      if (response && response.status === 403 && window.CSRFManager && typeof window.CSRFManager.refresh === 'function') {
        try {
          await window.CSRFManager.refresh();
          formData = await buildReservationFormData();
          response = await doFetchWithManager(formData);
        } catch (refreshErr) {
          console.warn('CSRF refresh failed:', refreshErr);
        }
      }

      if (!response) throw new Error('No response from server');

      let result;
      try { result = await response.json(); }
      catch (parseErr) {
        try { const text = await response.text(); result = text ? JSON.parse(text) : { success: false, error: 'invalid json' }; }
        catch (e) { result = { success: false, error: 'invalid json' }; }
      }

      if (result && (result.success || result.status === 'ok')) {
        reservationForm.reset();
        clearAllErrors();
        showGlobalMessage("✔️ Reservation has been successfully created!", 'success');
      } else {
        const errMsg = result && (result.error || result.message || result.err) ? (result.error || result.message || result.err) : 'Something went wrong.';
        showGlobalMessage("❌ Error: " + String(errMsg));
      }

    } catch (err) {
      console.error('reservation submit failed', err);
      showGlobalMessage("⚠️ Failed to connect to the server.");
    } finally {
      if (reservationButton) { reservationButton.disabled = false; reservationButton.classList.remove('loading'); }
    }
  });
}
/* ---------- START: i18n-aware reservations (uses SwitchLanguage API, no hardcoded translations) ---------- */

function _lookupInDict(dict, keyPath) {
  if (!dict || !keyPath) return undefined;
  const parts = String(keyPath).split('.');
  let cur = dict;
  for (const p of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
    else return undefined;
  }
  return cur;
}

async function _getDictSafe() {
  try {
    if (window.i18n && typeof window.i18n._loadDict === 'function') {
      const lang = (typeof window.i18n.getLang === 'function') ? window.i18n.getLang() : (localStorage.getItem('site_lang') || 'eng');
      return await window.i18n._loadDict(lang).catch(()=>null);
    }
  } catch (e) { /* ignore */ }
  return null;
}

export function createLabeledParagraph(labelKey, valueText, dict = null) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');

  // mark for i18n tooling & later global translation passes
  strong.setAttribute('data-i18n', labelKey);
  p.appendChild(strong);
  p.appendChild(document.createTextNode(' '));

  // set the value (user data)
  if (typeof valueText !== 'string' || valueText.length === 0) {
    p.appendChild(document.createTextNode(''));
  } else {
    const parts = valueText.split(/\r?\n/);
    parts.forEach((part, idx) => {
      p.appendChild(document.createTextNode(part));
      if (idx < parts.length - 1) p.appendChild(document.createElement('br'));
    });
  }

  // Try to translate the label immediately using provided dict (preferred)
  (async () => {
    try {
      let localDict = dict;
      if (!localDict) localDict = await _getDictSafe();
      const translated = _lookupInDict(localDict, labelKey);
      if (translated != null) {
        strong.textContent = String(translated) + ' ';
      } else {
        // If no dict available, leave data-i18n for later bulk translation;
        // as a last-resort UX fallback, put a neutral English label (very minimal)
        const minimalFallbacks = {
          'personal-account.name': 'Name:',
          'personal-account.phone': 'Phone:',
          'personal-account.email': 'Email:',
          'personal-account.guest': 'Guests:',
          'personal-account.comment': 'Comment:'
        };
        if (minimalFallbacks[labelKey]) strong.textContent = minimalFallbacks[labelKey] + ' ';
        else strong.textContent = labelKey + ' ';
      }
    } catch (e) {
      // keep data-i18n attribute for global translator to pick up later
      try { strong.textContent = labelKey + ' '; } catch(_) {}
    }
  })();

  return p;
}

export async function loadUserReservations(userId, page = 1) {
  const container = document.getElementById('user-reservations');
  const pagination = document.getElementById('user-reservations-pagination');
  if (!container) return;

  container.innerHTML = '<p data-i18n="personal-account.loading">Loading your reservations...</p>';
  // If account-level translator exists, let it translate loading text
  try { if (typeof window.translatePersonalAccount === 'function') await window.translatePersonalAccount(container); } catch(e){}

  // try to obtain dict once for this rendering
  const dict = await _getDictSafe();

  try {
    const resp = await fetch(`./php/get_user_reservations.php?page=${encodeURIComponent(page)}`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await resp.json().catch(() => ({ success: false, reservations: [] }));
    container.innerHTML = '';

    if (!data.success || !Array.isArray(data.reservations) || data.reservations.length === 0) {
      container.innerHTML = '<p class="empty-reservations" data-i18n="personal-account.no-reservations">You have no active reservations.</p>';
      try { if (typeof window.translatePersonalAccount === 'function') await window.translatePersonalAccount(container); } catch(e){}
      if (pagination) pagination.innerHTML = '';
      return;
    }

    const currentPage = data.page || 1;
    const totalPages = data.totalPages || 1;

    for (const r of data.reservations) {
      const item = document.createElement('div');
      item.className = 'reservation-item';

      const h4 = document.createElement('h4');
      h4.textContent = `${r.date} ${ (r.time ? 'в ' + r.time : '') }`.trim();
      item.appendChild(h4);

      item.appendChild(createLabeledParagraph('personal-account.name', String(r.name || ''), dict));
      item.appendChild(createLabeledParagraph('personal-account.phone', String(r.phone || ''), dict));
      item.appendChild(createLabeledParagraph('personal-account.email', String(r.email || ''), dict));
      item.appendChild(createLabeledParagraph('personal-account.guest', String(r.people || ''), dict));

      if (r.message && String(r.message).trim().length > 0) {
        item.appendChild(createLabeledParagraph('personal-account.comment', String(r.message), dict));
      }

      // cancel button: set data-i18n and try to set translated label immediately
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'cancel-reservation-btn';
      const rid = Number(r.id);
      cancelBtn.dataset.id = Number.isFinite(rid) ? String(rid) : '';
      cancelBtn.setAttribute('data-i18n', 'personal-account.cancel');

      // immediate label attempt using dict
      (async () => {
        const key = 'personal-account.cancel';
        let translated = null;
        try { translated = _lookupInDict(dict, key); } catch(e){}
        if (translated != null) {
          cancelBtn.textContent = String(translated);
        } else {
          // do minimal English fallback (no heavy localization in code)
          cancelBtn.textContent = 'Cancel';
        }
      })();

      cancelBtn.addEventListener('click', () => {
        try { if (typeof window.cancelReservation === 'function') window.cancelReservation(cancelBtn.dataset.id, userId); else cancelReservation(cancelBtn.dataset.id, userId); } catch(e){}
      });
      item.appendChild(cancelBtn);

      container.appendChild(item);

      // Let account-level translator translate the whole item if available
      try { if (typeof window.translatePersonalAccount === 'function') await window.translatePersonalAccount(item); } catch(e){}
    }

    // pagination
    if (pagination) {
      pagination.innerHTML = '';

      const prev = document.createElement('button');
      prev.textContent = '←';
      prev.disabled = currentPage <= 1;
      prev.onclick = () => loadUserReservations(userId, currentPage - 1);
      pagination.appendChild(prev);

      const maxButtons = 3;
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, start + maxButtons - 1);
      if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

      for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.className = 'active-page';
        btn.onclick = () => loadUserReservations(userId, i);
        pagination.appendChild(btn);
      }

      const next = document.createElement('button');
      next.textContent = '→';
      next.disabled = currentPage >= totalPages;
      next.onclick = () => loadUserReservations(userId, currentPage + 1);
      pagination.appendChild(next);
    }

  } catch (err) {
    console.error('loadUserReservations error', err);
    container.innerHTML = '<p class="empty-reservations" data-i18n="personal-account.error-loading">Error loading reservations.</p>';
    try { if (typeof window.translatePersonalAccount === 'function') await window.translatePersonalAccount(container); } catch(e){}
  }
}

export async function cancelReservation(reservationId, userId) {
  const id = parseInt(reservationId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    alert('Invalid reservation id.');
    return;
  }

  if (!confirm('Вы уверены, что хотите отменить эту резервацию?')) return;

  try {
    if (window.CSRFManager) {
      if (!window.CSRFManager.isInitialized || !window.CSRFManager.isInitialized()) {
        await window.CSRFManager.init();
      }
    }
  } catch (err) {
    console.warn('Failed to init CSRFManager before cancelReservation:', err);
  }

  const payload = { id };
  const payloadWithCsrf = window.CSRFManager ? window.CSRFManager.appendToJson(payload) : payload;

  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    window.CSRFManager ? window.CSRFManager.getHeader() : {}
  );

  try {
    const res = await fetch('./php/cancel_reservation.php', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payloadWithCsrf)
    });

    const data = await res.json().catch(() => ({ success: false, error: 'invalid json' }));
    if (data.success) {
      try { await loadUserReservations(userId); } catch(e){}
    } else {
      alert('Ошибка при отмене резервации: ' + (data.error || data.message || 'Неизвестная ошибка'));
    }
  } catch (err) {
    console.error('Ошибка при запросе cancel_reservation:', err);
    alert('Ошибка соединения с сервером.');
  }
}

// expose as globals for legacy callers (account.js expects loadUserReservations/cancelReservation)
try {
  if (typeof window !== 'undefined') {
    if (!window.loadUserReservations) window.loadUserReservations = loadUserReservations;
    if (!window.cancelReservation) window.cancelReservation = cancelReservation;
  }
} catch (e) {
  console.warn('Failed to attach reservation helpers to window', e);
}

/* ---------- END: i18n-aware reservations ---------- */
