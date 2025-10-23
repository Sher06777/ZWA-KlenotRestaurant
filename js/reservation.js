const reservationForm = document.getElementById("reservation-form")
const reservationButton = document.querySelector(".reservation-submit-btn")
let reservation = false

reservationButton.addEventListener("click", async () => {
    if (reservation) return;
    reservation = true
    reservationButton.disabled = true
    const formData = new FormData(reservationForm)
    try {
        const response = await fetch("reservation.php", {
            method: "POST", body: formData
        })
        const result = await response.json();
        if (result.success) {
            alert("Вы зарегистрированы")
        } else {
            alert("Something went wrong")
        }

    } catch (err) {
        console.error(err)
        alert("Произошла какая-то ошибка")
    } finally {
        reservation = false
        reservationButton.disabled = false
    }
})