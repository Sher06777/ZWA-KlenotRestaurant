const reservationForm = document.getElementById("reservation-form");
const reservationButton = document.querySelector(".reservation-submit-btn");
const reservationMessage = document.getElementById("reservation-message");
let reservation = false;

reservationButton.addEventListener("click", async (e) => {
  e.preventDefault();

  if (reservation) return;
  reservation = true;
  reservationButton.disabled = true;

  reservationMessage.style.display = "none"; // Скрываем старое сообщение
  reservationMessage.textContent = ""; //def XSS - attack
  reservationMessage.className = ""; // Сбрасываем классы
  

  const formData = new FormData(reservationForm);
  formData.append('csrf_token', window.csrfToken); //def CSRF (Cross-Site Request Forgery) - attack

  if (!window.user || !window.user.id) {
    reservationMessage.textContent = "⚠️ Пожалуйста, войдите в аккаунт, чтобы сделать резервацию."; 
    reservationMessage.classList.add("error");
    reservationMessage.style.display = "block";
    reservation = false;
    reservationButton.disabled = false;
    return;
  }


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
