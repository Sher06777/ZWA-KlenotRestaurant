const reservationContainer = document.getElementById("admin-reservations-container");
const paginationContainer = document.getElementById("admin-reservations-pagination");
const personalAccountRight = document.querySelector('.personal-account-right');
const accountSection = document.getElementById('personal-account');

const accountButtonDate = document.querySelector('.personal-account-dates');
const accountButtonReservation = document.querySelector('.personal-account-reservation');

const accountButtons = [accountButtonDate, accountButtonReservation]

let currentPage = 1;
let reservationsLoaded = false;
let reservationsCache = {};
let totalPages = 1;


// --- Создаем контейнер для кнопок ---
const btnWrapper = document.createElement('div');
btnWrapper.style.display = 'flex';
btnWrapper.style.alignItems = 'center';
btnWrapper.style.gap = '10px';
btnWrapper.classList.add('admin-reservations-btn-wrapper');

// --- Создаем кнопки ---
const showAllBtn = document.createElement('button');
// showAllBtn.textContent = 'Все резервации';
showAllBtn.classList.add('edit-account-btn', 'admin-show-all-reservations');

const hideAllBtn = document.createElement('button');
// hideAllBtn.textContent = 'Скрыть все резервации';
hideAllBtn.classList.add('edit-account-btn', 'admin-hide-all-reservations');

async function translateControlButtons() {
    await translateElement(showAllBtn, 'admin.all-reservations');
    await translateElement(hideAllBtn, 'admin.hide-all-reservations');
}

showAllBtn.addEventListener('click', () => {
    reservationContainer.style.display = 'block';
    showAllBtn.style.marginBottom = '10px';
    hideAllBtn.style.marginBottom = '10px';
    accountSection.style.height = 'fit-content';

    // --- Используем кеш ---
    if (reservationsCache[currentPage]) {
        reservationContainer.innerHTML = renderReservationsHTML(reservationsCache[currentPage]);
        translateReservationTable();
        renderPagination(currentPage, totalPages);
    } else {
        loadReservations(currentPage);
    }
});

// ==== Скрываем таблицу ====
hideAllBtn.addEventListener('click', () => {
    reservationContainer.style.display = 'none';
    paginationContainer.innerHTML = '';
    hideAllBtn.style.marginBottom = '50px'
    showAllBtn.style.marginBottom = '50px'
    accountSection.style.height = '950px';
});

accountButtons.forEach(element => {
    element.addEventListener("click", () => {
        accountSection.style.width = '900px';
        accountSection.style.height = '800px';
        accountSection.style.maxWidth = "90%";
    });
})


// Добавляем кнопки в обёртку
btnWrapper.appendChild(showAllBtn);
btnWrapper.appendChild(hideAllBtn);

// Вставляем обёртку перед контейнером таблицы
reservationContainer.parentElement.insertBefore(btnWrapper, reservationContainer);
reservationContainer.parentElement.insertBefore(paginationContainer, reservationContainer);
// Скрываем таблицу изначально
reservationContainer.style.display = 'none';

if (adminPanelButton) {
        adminPanelButton.addEventListener('click', () => {

            accountSection.style.width = '1600px';
            accountSection.style.height = '950px';
            accountSection.style.maxWidth = '100%';
            personalAccountRight.style.padding = '0 10px 0 10px'
        });
}

// ==== Существующая функция загрузки ====
async function loadReservations(page = 1) {
    currentPage = page;

    // Если данные уже есть в кеше, используем их
    if (reservationsCache[page]) {
        reservationContainer.innerHTML = renderReservationsHTML(reservationsCache[page]);
        await translateReservationTable();
        renderPagination(page, totalPages);
        return;
    }

    // Показываем Loading только если данных нет
    reservationContainer.innerHTML = await getTranslation('admin.loading-reservations') || 'Loading Reservations';

    try {
        const res = await fetch(`./php/admin_get_reservations.php?page=${page}`, { credentials: "include" });
        const data = await res.json();

        if (!data.success) {
            reservationContainer.innerHTML = "⚠️ Ошибка загрузки";
            return;
        }

        reservationsCache[page] = data.reservations;
        totalPages = data.pages;

        reservationContainer.innerHTML = renderReservationsHTML(data.reservations);
        await translateReservationTable();
        renderPagination(page, totalPages);
    } catch (err) {
        console.error(err);
        reservationContainer.innerHTML = "⚠️ Ошибка загрузки";
    }
}

// ==== HTML для таблицы ====
function renderReservationsHTML(list) {
    if (!list.length) return "<p>Нет бронирований</p>";

    let html = `
        <table class="admin-table admin-reservations-table">
            <thead>
              <tr>
                <th class="col-res-id">ID</th>
                <th class="col-res-name">Name</th>
                <th class="col-res-phone">Phone</th>
                <th class="col-res-email">Email</th>
                <th class="col-res-date">Date</th>
                <th class="col-res-time">Time</th>
                <th class="col-res-people">People</th>
                <th class="col-res-msg">Msg</th>
                <th class="col-res-userid">User ID</th>
                <th class="col-res-delete" data-i18n="admin.delete">Remove?</th>
              </tr>
            </thead>
            <tbody>
    `;

    html += list.map(r => `
        <tr class="reservation-row">
           <td class="col-res-id">${r.id}</td>
           <td class="col-res-name">${r.name}</td>
           <td class="col-res-phone">${r.phone}</td>
           <td class="col-res-email">${r.email}</td>
           <td class="col-res-date">${r.date}</td>
           <td class="col-res-time">${r.time}</td>
           <td class="col-res-people">${r.people}</td>
           <td class="col-res-msg">${r.message || ""}</td>
           <td class="col-res-userid">${r.user_id}</td>
           <td class="col-res-delete">
              <button class="admin-delete-reservation-btn edit-account-btn" data-id="${r.id}" data-i18n="admin.delete-yes"></button>
           </td>
        </tr>
    `).join("");

    html += `</tbody></table>`;
    return html;
}

async function translateReservationTable() {
    const elements = reservationContainer.querySelectorAll('[data-i18n]');
    for (const el of elements) {
        const key = el.getAttribute('data-i18n');
        await translateElement(el, key);
    }
}

// ==== Pagination ====
function renderPagination(page, pages) {
    paginationContainer.innerHTML = "";
    const maxButtons = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(pages, start + maxButtons - 1);

    if (start > 1) paginationContainer.innerHTML += `<button class="edit-account-btn pg" data-page="${start-1}">⬅</button>`;

    for (let p = start; p <= end; p++) {
        paginationContainer.innerHTML += `<button class="edit-account-btn pg ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }

    if (end < pages) paginationContainer.innerHTML += `<button class="edit-account-btn pg" data-page="${end+1}">➡</button>`;
}

// Click pagination
paginationContainer.addEventListener("click", e => {
    if (!e.target.classList.contains("pg")) return;

    const page = parseInt(e.target.dataset.page);
    if (reservationsCache[page]) {
        reservationContainer.innerHTML = renderReservationsHTML(reservationsCache[page]);
        translateReservationTable();
        renderPagination(page, totalPages);
        currentPage = page;
    } else {
        loadReservations(page);
    }
});

// ==== Delete reservation ====
reservationContainer.addEventListener("click", async e => {
    if (!e.target.classList.contains("admin-delete-reservation-btn")) return;

    const id = e.target.dataset.id;
    const deleteConfirm = await getTranslation('admin.delete');
    if (!confirm(`${deleteConfirm} #${id}?`)) return;

    const formData = new FormData();
    formData.append("id", id);
    formData.append("csrf_token", window.csrfToken);

    const res = await fetch("./php/admin_delete_reservation.php", {
        method: "POST",
        body: formData,
        credentials: "include"
    });

    const data = await res.json();
    if (data.success) {
        loadReservations(currentPage);
    } else {
        alert("Ошибка: " + data.error);
    }
});

function isVisible(el) {
    const visible = el && window.getComputedStyle(el).display !== "none";
    console.log("isVisible(table)? →", visible, "| inline:", el.style.display, "| computed:", window.getComputedStyle(el).display);
    return visible;
}

document.addEventListener('i18n:changed', async () => {
    await translateControlButtons();

    // Перевод таблицы — только если она реально видима
    if (isVisible(reservationContainer)) {
        await translateReservationTable();
    }
});

// === Инициализация кнопок сразу после загрузки страницы и словаря ===
document.addEventListener('DOMContentLoaded', async () => {
    await translateControlButtons();
});
