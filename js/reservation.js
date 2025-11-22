// reservation.js — безопасная версия с CSRF retry и улучшенной валидацией

const reservationForm = document.getElementById("reservation-form");
const reservationButton = document.querySelector(".reservation-submit-btn");
const reservationMessage = document.getElementById("reservation-message");

// --- Политика ограничений на клиенте (для UX и быстрой защиты) ---
const MAX_NAME = 100;
const MAX_PHONE = 30;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 100;
const MIN_PEOPLE = 1;
const MAX_PEOPLE = 20;

// --- Создаём FormData и гарантируем, что CSRF (если есть) будет добавлен ---
async function buildReservationFormData() {
  if (!reservationForm) throw new Error('Form not found');
  const formData = new FormData(reservationForm);

  try {
    if (window.CSRFManager && typeof window.CSRFManager.appendToFormData === 'function') {
      // appendToFormData может быть асинхронным — ждём его
      await window.CSRFManager.appendToFormData(formData);
    }
  } catch (e) {
    // Не блокируем отправку при ошибке CSRF-manager на клиенте, но логируем
    console.warn('CSRF append error (continuing without body token):', e);
  }

  return formData;
}

if (!reservationForm) {
  console.warn("reservation-form not found in DOM");
} else {

  // Инициализируем CSRFManager, если он есть (не блокируем загрузку)
  if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
    window.CSRFManager.init().catch(() => {/* silently ignore */});
  }

  // --- UI: кастомные + / - кнопки для чисел ---
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

  // --- Сообщения об ошибках (вставляем только textContent) ---
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
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('active');
    }
  }

  function showGlobalMessage(text, type = 'error') {
    if (!reservationMessage) return;
    reservationMessage.textContent = String(text || '');
    reservationMessage.style.display = 'block';
    reservationMessage.classList.remove('error', 'success');
    reservationMessage.classList.add(type === 'success' ? 'success' : 'error');
  }

  function clearGlobalMessage() {
    if (!reservationMessage) return;
    reservationMessage.textContent = '';
    reservationMessage.style.display = 'none';
    reservationMessage.classList.remove('error', 'success');
  }

  function clearAllErrors() {
    const allErrors = reservationForm.querySelectorAll('.error-message');
    allErrors.forEach(el => {
      el.textContent = '';
      el.classList.remove('active');
    });
    clearGlobalMessage();
  }

  // --- Валидация по blur и очистка при вводе ---
  reservationForm.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
      const value = (input.value || '').trim();

      if (input.required && !value) {
        showFieldError(input, 'This field is required');
        return;
      }

      if (input.type === 'email' && value) {
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) {
          showFieldError(input, 'Please enter a valid email');
        } else {
          clearFieldError(input);
        }
      }

      if (input.type === 'tel' && value) {
        const phoneReg = /^[0-9+\s\-()]{7,20}$/u;
        if (!phoneReg.test(value)) {
          showFieldError(input, 'Invalid phone format');
        } else {
          clearFieldError(input);
        }
      }

      if (input.type === 'number') {
        const num = parseInt(value, 10);
        const min = input.min ? parseInt(input.min, 10) : MIN_PEOPLE;
        const max = input.max ? parseInt(input.max, 10) : MAX_PEOPLE;
        if (isNaN(num) || num < min || num > max) {
          showFieldError(input, `The number of guests must be between ${min} and ${max}`);
        } else {
          clearFieldError(input);
        }
      }
    });

    input.addEventListener('input', () => clearFieldError(input));
  });

  // --- Submit формы ---
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    // Считываем и нормализуем данные
    const name = (reservationForm.name?.value || '').trim();
    const phone = (reservationForm.phone?.value || '').trim();
    const email = (reservationForm.email?.value || '').trim();
    const date = (reservationForm.date?.value || '').trim();
    const time = (reservationForm.time?.value || '').trim();
    const peopleRaw = (reservationForm.people?.value || '').trim();
    const people = Number.isFinite(Number(peopleRaw)) ? Math.round(Number(peopleRaw)) : NaN;
    const message = (reservationForm.message?.value || '').trim();

    let valid = true;

    // Базовые проверки обязательных полей
    if (!name) { showFieldError(reservationForm.name, 'Enter the name'); valid = false; }
    if (!phone) { showFieldError(reservationForm.phone, 'Enter the phone number'); valid = false; }
    if (!email) { showFieldError(reservationForm.email, 'Enter the email'); valid = false; }
    if (!date) { showFieldError(reservationForm.date, 'Enter the date'); valid = false; }
    if (!time) { showFieldError(reservationForm.time, 'Enter the time'); valid = false; }
    if (!peopleRaw || Number.isNaN(people)) { showFieldError(reservationForm.people, 'Enter the number of guests'); valid = false; }

    // Формат и ограничения
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailReg.test(email)) { showFieldError(reservationForm.email, 'Enter a valid email'); valid = false; }

    const phoneReg = /^[0-9+\s\-()]{7,20}$/u;
    if (phone && !phoneReg.test(phone)) { showFieldError(reservationForm.phone, 'Invalid phone format'); valid = false; }

    const dateReg = /^\d{4}-\d{2}-\d{2}$/;
    if (date && (!dateReg.test(date) || isNaN(Date.parse(date)))) { showFieldError(reservationForm.date, 'Invalid date'); valid = false; }

    const timeReg = /^\d{2}:\d{2}$/;
    if (time && !timeReg.test(time)) { showFieldError(reservationForm.time, 'Invalid time'); valid = false; }

    if (!Number.isNaN(people) && (people < MIN_PEOPLE || people > MAX_PEOPLE)) {
      showFieldError(reservationForm.people, `The number of guests must be between ${MIN_PEOPLE} and ${MAX_PEOPLE}`);
      valid = false;
    }

    // Дополнительные ограничения длины (клиентский guard)
    if (name.length > MAX_NAME) { showFieldError(reservationForm.name, `Name too long (max ${MAX_NAME}).`); valid = false; }
    if (phone.length > MAX_PHONE) { showFieldError(reservationForm.phone, `Phone too long (max ${MAX_PHONE}).`); valid = false; }
    if (email.length > MAX_EMAIL) { showFieldError(reservationForm.email, `Email too long (max ${MAX_EMAIL}).`); valid = false; }
    if (message.length > MAX_MESSAGE) { showFieldError(reservationForm.message, `Message too long (max ${MAX_MESSAGE}).`); valid = false; }

    if (!valid) {
      showGlobalMessage('⚠️ Please correct the errors in the form.');
      return;
    }

    // Блокируем кнопку (предотвращаем double-submit)
    if (reservationButton) {
      reservationButton.disabled = true;
      reservationButton.classList.add('loading');
    }

    try {
      // Внутренняя функция отправки — принимает уже готовый FormData
      async function doFetchWithManager(formData) {
        if (window.CSRFManager && typeof window.CSRFManager.fetchWithCsrf === 'function') {
          return window.CSRFManager.fetchWithCsrf("./php/reservation.php", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
        } else {
          // plain fetch (FormData may contain csrf_token field if append succeeded)
          return fetch("./php/reservation.php", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
        }
      }

      // 1) первая попытка — строим FormData и отправляем
      let formData = await buildReservationFormData();
      let response = await doFetchWithManager(formData);

      // 2) если 403 — пробуем обновить CSRF и повторить (одна попытка)
      if (response && response.status === 403 && window.CSRFManager && typeof window.CSRFManager.refresh === 'function') {
        try {
          await window.CSRFManager.refresh();
          // rebuild formData so fresh token is appended
          formData = await buildReservationFormData();
          response = await doFetchWithManager(formData);
        } catch (refreshErr) {
          console.warn('CSRF refresh failed:', refreshErr);
          // продолжаем с тем ответом, который есть (скорее всего 403)
        }
      }

      if (!response) throw new Error('No response from server');

      // Пытаемся корректно распарсить JSON (устойчиво к HTML-ошибкам)
      let result;
      try {
        result = await response.json();
      } catch (parseErr) {
        // fallback — попробуем текст и попытаться распарсить
        try {
          const text = await response.text();
          result = text ? JSON.parse(text) : { success: false, error: 'invalid json' };
        } catch (e) {
          result = { success: false, error: 'invalid json' };
        }
      }

      // Обработка результата
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
      if (reservationButton) {
        reservationButton.disabled = false;
        reservationButton.classList.remove('loading');
      }
    }
  });
}
