const reservationForm = document.getElementById("reservation-form");
const reservationButton = document.querySelector(".reservation-submit-btn");
const reservationMessage = document.getElementById("reservation-message");
let reservation = false;

document.querySelectorAll('.custom-number-inline').forEach(wrapper => {
  const input = wrapper.querySelector('input[type="number"]');
  const btnUp = wrapper.querySelector('.up');
  const btnDown = wrapper.querySelector('.down');

  btnUp.addEventListener('click', () => {
    const max = input.max ? parseInt(input.max) : Infinity;
    input.value = Math.min(max, parseInt(input.value) + 1);
    input.dispatchEvent(new Event('change'));
  });

  btnDown.addEventListener('click', () => {
    const min = input.min ? parseInt(input.min) : -Infinity;
    input.value = Math.max(min, parseInt(input.value) - 1);
    input.dispatchEvent(new Event('change'));
  });
});

reservationButton.addEventListener("click", async (e) => {
  e.preventDefault();

  // VALIDATION START
  const name = reservationForm.name.value.trim();
  const phone = reservationForm.phone.value.trim();
  const email = reservationForm.email.value.trim();
  const date = reservationForm.date.value.trim();
  const time = reservationForm.time.value.trim();
  const people = parseInt(reservationForm.people.value.trim(), 10);
  const message = reservationForm.message.value.trim();

  const showError = (msg) => {
    reservationMessage.textContent = "⚠️ " + msg;
    reservationMessage.className = "error";
    reservationMessage.style.display = "block";
  }

  // Email
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailReg.test(email)) {
    showError("Неверный формат email.");
    return;
  }

  // Phone
  const phoneReg = /^[0-9+\s\-()]{7,20}$/u;
  if (!phoneReg.test(phone)) {
    showError("Неверный формат телефона.");
    return;
  }

  // Date YYYY-MM-DD & valid
  const dateReg = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateReg.test(date) || isNaN(Date.parse(date))) {
    showError("Неверная дата.");
    return;
  }

  // Time HH:MM
  const timeReg = /^\d{2}:\d{2}$/;
  if (!timeReg.test(time)) {
    showError("Неверное время.");
    return;
  }

  // People
  if (people < 1 || people > 20) {
    showError("Количество гостей должно быть от 1 до 20.");
    return;
  }

  // Required fields
  if (!name || !phone || !email || !date || !time || !people) {
    showError("Пожалуйста, заполните все обязательные поля.");
    return;
  }
  // VALIDATION END

  try {
    const response = await fetch("reservation.php", {
      method: "POST",
      body: formData,
      credentials: 'include'
    });

    const result = await response.json();



    if (result.success) {
      reservationMessage.textContent = "✅ Бронирование успешно добавлено!";
      reservationMessage.classList.add("success");
      reservationMessage.style.display = "block";
      reservationForm.reset();
    } else {
      reservationMessage.textContent = "❌ Ошибка: " + (result.error || "Что-то пошло не так.");
      reservationMessage.classList.add("error");
      reservationMessage.style.display = "block";
    }
  } catch (err) {
    console.error(err);
    reservationMessage.textContent = "⚠️ Ошибка при соединении с сервером.";
    reservationMessage.classList.add("error");
    reservationMessage.style.display = "block";
  } finally {
    reservation = false;
    reservationButton.disabled = false;
  }
});
