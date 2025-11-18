const reservationForm = document.getElementById("reservation-form");
const reservationButton = document.querySelector(".reservation-submit-btn");
const reservationMessage = document.getElementById("reservation-message");

if (!reservationForm) {
  console.warn("reservation-form not found in DOM");
} else {

  // Кастомные кнопки + / -
  document.querySelectorAll('.custom-number-inline').forEach(wrapper => {
    const input = wrapper.querySelector('input[type="number"]');
    const btnUp = wrapper.querySelector('.up');
    const btnDown = wrapper.querySelector('.down');

    btnUp && btnUp.addEventListener('click', () => {
      const max = input.max ? parseInt(input.max, 10) : Infinity;
      input.value = Math.min(max, (parseInt(input.value, 10) || 0) + 1);
      input.dispatchEvent(new Event('change'));
    });

    btnDown && btnDown.addEventListener('click', () => {
      const min = input.min ? parseInt(input.min, 10) : -Infinity;
      input.value = Math.max(min, (parseInt(input.value, 10) || 0) - 1);
      input.dispatchEvent(new Event('change'));
    });
  });

  // Показываем локальную ошибку под полем
  function showFieldError(input, message) {
  // ищем существующий блок с ошибкой
    let errorEl = input.parentElement.querySelector('.error-message');

    if (!errorEl) {
      // если его нет — создаём
      errorEl = document.createElement('p');
      errorEl.className = 'error-message';
      input.parentElement.appendChild(errorEl);
    }

    errorEl.textContent = message;
    errorEl.classList.add('active');
  }

  // Очистка ошибки поля
  function clearFieldError(input) {
    const errorEl = input.parentElement.querySelector('.error-message');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('active');
      // опционально можно удалить элемент из DOM
      // errorEl.remove();
    }
  }

  // Показываем глобальное сообщение
  function showGlobalMessage(text, type = 'error') {
    if (!reservationMessage) return;
    reservationMessage.textContent = text;
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

  // Очистка всех ошибок формы
  function clearAllErrors() {
    const allErrors = reservationForm.querySelectorAll('.error-message');
    allErrors.forEach(el => {
      el.textContent = '';
      el.classList.remove('active');
    });
    clearGlobalMessage();
  }

  // Валидация поля по blur
  reservationForm.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => {
      const value = (input.value || '').trim();

      // Проверка обязательного поля
      if (input.required && !value) {
        showFieldError(input, 'This field is required');
        return;
      }

      // Дополнительная проверка формата
      if (input.type === 'email') {
        const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailReg.test(value)) {
          showFieldError(input, 'Please enter a valid email');
        } else {
          clearFieldError(input);
        }
      }

      if (input.type === 'tel') {
        const phoneReg = /^[0-9+\s\-()]{7,20}$/u;
        if (!phoneReg.test(value)) {
          showFieldError(input, 'Invalid phone format');
        } else {
          clearFieldError(input);
        }
      }

      if (input.type === 'number') {
        const num = parseInt(value, 10);
        const min = input.min ? parseInt(input.min, 10) : 0;
        const max = input.max ? parseInt(input.max, 10) : Infinity;
        if (isNaN(num) || num < min || num > max) {
          showFieldError(input, `The number of guests must be between ${min} and ${max}`);
        } else {
          clearFieldError(input);
        }
      }
    });

    // Очистка ошибки при вводе
    input.addEventListener('input', () => clearFieldError(input));
  });

  // Submit формы
  reservationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const name = (reservationForm.name?.value || '').trim();
    const phone = (reservationForm.phone?.value || '').trim();
    const email = (reservationForm.email?.value || '').trim();
    const date = (reservationForm.date?.value || '').trim();
    const time = (reservationForm.time?.value || '').trim();
    const peopleRaw = (reservationForm.people?.value || '').trim();
    const people = parseInt(peopleRaw, 10);
    const message = (reservationForm.message?.value || '').trim();

    let valid = true;

    // Проверка всех обязательных полей
    if (!name) { showFieldError(reservationForm.name, 'Enter the name'); valid = false; }
    if (!phone) { showFieldError(reservationForm.phone, 'Enter the phone number'); valid = false; }
    if (!email) { showFieldError(reservationForm.email, 'Enter the email'); valid = false; valid = false; }
    if (!date) { showFieldError(reservationForm.date, 'Enter the date'); valid = false; }
    if (!time) { showFieldError(reservationForm.time, 'Enter the time'); valid = false; }
    if (!peopleRaw || isNaN(people)) { showFieldError(reservationForm.people, 'Enter the number of guests'); valid = false; }

    // Формат полей
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailReg.test(email)) { showFieldError(reservationForm.email, 'Enter a valid email'); valid = false; }

    const phoneReg = /^[0-9+\s\-()]{7,20}$/u;
    if (phone && !phoneReg.test(phone)) { showFieldError(reservationForm.phone, 'Invalid phone format'); valid = false; }

    const dateReg = /^\d{4}-\d{2}-\d{2}$/;
    if (date && (!dateReg.test(date) || isNaN(Date.parse(date)))) { showFieldError(reservationForm.date, 'Invalid date'); valid = false; }

    const timeReg = /^\d{2}:\d{2}$/;
    if (time && !timeReg.test(time)) { showFieldError(reservationForm.time, 'Invalid time'); valid = false; }

    if (people && (people < 1 || people > 20)) { showFieldError(reservationForm.people, 'The number of guests must be between 1 and 20'); valid = false; }

    if (!valid) {
      showGlobalMessage('⚠️ Please correct the errors in the form.');
      return;
    }

    if (reservationButton) reservationButton.disabled = true;

    try {
      const formData = new FormData(reservationForm);
      formData.append('csrf_token', window.csrfToken);

      const response = await fetch("./php/reservation.php", {
        method: "POST",
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        showGlobalMessage("✔️ Reservation has been successfully created!", 'success');
        reservationForm.reset();
      } else {
        showGlobalMessage("❌ Error: " + (result.error || "Something went wrong."));
      }
    } catch (err) {
      showGlobalMessage("⚠️ Failed to connect to the server.");
    } finally {
      if (reservationButton) reservationButton.disabled = false;
    }
  });
}
