const reservationForm = document.getElementById("reservation-form");
const reservationButton = document.querySelector(".reservation-submit-btn");
const reservationMessage = document.getElementById("reservation-message");
let reservation = false;

reservationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (reservation) return;
  reservation = true;
  reservationButton.disabled = true;

  reservationMessage.style.display = "none"; // Скрываем старое сообщение
  reservationMessage.textContent = "";
  reservationMessage.className = ""; // Сбрасываем классы

  const formData = new FormData(reservationForm);

  try {
    const response = await fetch("php/reservation.php", {
      method: "POST",
      body: formData,
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
