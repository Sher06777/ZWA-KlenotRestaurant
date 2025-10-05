const datesButton = document.querySelector('.personal-account-dates')
const reservationButton = document.querySelector('.personal-account-reservation')
const adminPanelButton = document.querySelector('.personal-account-admin-panel')
const datesText = document.querySelector('.dates')
const reservationText = document.querySelector('.reservation')
const adminPanelText = document.querySelector('.admin')


datesButton.addEventListener('click', () => {
    datesText.classList.remove('invisible-account-button')
    datesText.classList.add('visible')

    reservationText.classList.add('invisible-account-button')
    reservationText.classList.remove('visible')   

    adminPanelText.classList.add('invisible-account-button')
    adminPanelText.classList.remove('visible')
})

reservationButton.addEventListener('click', () => {
    datesText.classList.add('invisible-account-button')
    datesText.classList.remove('visible')

    reservationText.classList.remove('invisible-account-button')
    reservationText.classList.add('visible')   

    adminPanelText.classList.add('invisible-account-button')
    adminPanelText.classList.remove('visible')
})

adminPanelButton.addEventListener('click', () => {
    datesText.classList.add('invisible-account-button')
    datesText.classList.remove('visible')

    reservationText.classList.add('invisible-account-button')
    reservationText.classList.remove('visible')   

    adminPanelText.classList.remove('invisible-account-button')
    adminPanelText.classList.add('visible')
})