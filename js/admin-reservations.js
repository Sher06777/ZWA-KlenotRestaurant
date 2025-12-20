// Нет русских комментавиев

export function adjustAccountSectionHeight() {
  const adminUsersContent = document.getElementById('admin-users-content');
  const adminReservationsContainer = document.getElementById('admin-reservations-container');
  const accountSection = document.getElementById('personal-account');
  const defaultHeight = 950;

  if (!accountSection) return;

  // Сбрасываем inline height, чтобы браузер мог корректно переложить элементы.
  accountSection.style.height = 'auto';
  accountSection.style.minHeight = '';

  // Даем браузеру применить изменения layout — безопасная пауза.
  // (в большинстве случаев можно обойтись без setTimeout, но здесь ставим маленькую паузу)
  // Мы не блокируем — просто измеряем текущий layout.
  let maxChildHeight = 0;
  const children = [adminUsersContent, adminReservationsContainer].filter(Boolean);

  for (const c of children) {
    // Если элемент скрыт (display:none / offsetParent === null) — пропускаем.
    if (c.offsetParent === null) continue;
    // scrollHeight учитывает весь контент (включая прокручиваемую высоту).
    const h = c.scrollHeight || c.offsetHeight || 0;
    maxChildHeight = Math.max(maxChildHeight, h);
  }

  const contentHeight = Math.max(defaultHeight, maxChildHeight + 200);
  // Используем minHeight — это предотвращает ситуацию, когда дочерний блок выше родителя.
  accountSection.style.minHeight = contentHeight + 'px';
}

export function initAdminReservations() {
    
    const reservationContainer = document.getElementById("admin-reservations-container");
    const paginationContainer = document.getElementById("admin-reservations-pagination");
    const personalAccountRight = document.querySelector('.personal-account-right');
    const accountSection = document.getElementById('personal-account');

    const accountButtonDate = document.querySelector('.personal-account-dates');
    const accountButtonReservation = document.querySelector('.personal-account-reservation');

    
    const adminPanelButton = document.querySelector('.personal-account-admin-panel');

    const accountButtons = [accountButtonDate, accountButtonReservation];

    let currentPage = 1;
    let reservationsCache = {};
    let totalPages = 1;

    
    const btnWrapper = document.createElement('div');
    btnWrapper.style.display = 'flex';
    btnWrapper.style.alignItems = 'center';
    btnWrapper.style.gap = '10px';
    btnWrapper.classList.add('admin-reservations-btn-wrapper');

    const showAllBtn = document.createElement('button');
    showAllBtn.classList.add('edit-account-btn', 'admin-show-all-reservations');

    const hideAllBtn = document.createElement('button');
    hideAllBtn.classList.add('edit-account-btn', 'admin-hide-all-reservations');

    async function translateControlButtons() {
        await translateElement(showAllBtn, 'admin.all-reservations');
        await translateElement(hideAllBtn, 'admin.hide-all-reservations');
    }

    showAllBtn.addEventListener('click', () => {
        if (!reservationContainer) return;
        if (accountSection) accountSection.style.height = "fit-content";
        reservationContainer.style.display = 'block';
        hideAllBtn.style.marginBottom = '10px';
        showAllBtn.style.marginBottom = '10px';

        if (reservationsCache[currentPage]) {
            reservationContainer.innerHTML = '';
            reservationContainer.appendChild(renderReservationsTable(reservationsCache[currentPage]));
            translateReservationTable();
            renderPagination(currentPage, totalPages);
        } else {
            loadReservations(currentPage);
        }
    });

    hideAllBtn.addEventListener('click', () => {
    if (!reservationContainer) return;
    reservationContainer.style.display = 'none';
    if (paginationContainer) paginationContainer.innerHTML = '';
    hideAllBtn.style.marginBottom = '50px';
    showAllBtn.style.marginBottom = '50px';

    // Ждём окончания возможной анимации (в проекте fadeOut ~500ms)
    // чтобы расчёт высоты был корректным.
    setTimeout(() => {
        adjustAccountSectionHeight();
    }, 520);
    });
    accountButtons.forEach(element => {
        if (!element) return;
        
        if (element.dataset.bound) return;
        element.addEventListener("click", () => {
            if (!accountSection) return;
            accountSection.style.width = '900px';
            accountSection.style.height = '800px';
            accountSection.style.maxWidth = "90%";
        });
        element.dataset.bound = 'true';
    });

    if (reservationContainer && reservationContainer.parentElement) {
        btnWrapper.appendChild(showAllBtn);
        btnWrapper.appendChild(hideAllBtn);

        reservationContainer.parentElement.insertBefore(btnWrapper, reservationContainer);
        if (paginationContainer) reservationContainer.parentElement.insertBefore(paginationContainer, reservationContainer);
        reservationContainer.style.display = 'none';
    } else {
        console.warn('Reservation container or its parent not found. Buttons not inserted.');
    }

    
    if (adminPanelButton && !adminPanelButton.dataset.bound) {
        adminPanelButton.addEventListener('click', () => {
            if (!accountSection || !personalAccountRight) return;
            accountSection.style.width = '1600px';
            accountSection.style.maxWidth = '100%';
            personalAccountRight.style.padding = '0 10px 0 10px';
            accountSection.style.height = 'fit-content';
        });
        adminPanelButton.dataset.bound = 'true';
    }

    

    async function loadReservations(page = 1) {
        currentPage = Number.isInteger(page) ? page : parseInt(page, 10) || 1;
        if (!reservationContainer) return;

        if (reservationsCache[currentPage]) {
            reservationContainer.innerHTML = '';
            reservationContainer.appendChild(renderReservationsTable(reservationsCache[currentPage]));
            await translateReservationTable();
            renderPagination(currentPage, totalPages);
            return;
        }

        reservationContainer.textContent = (await getTranslation('admin.loading-reservations')) || 'Loading Reservations';

        try {
            const res = await fetch(`./php/admin_get_reservations.php?page=${encodeURIComponent(currentPage)}`, { credentials: "include" });
            if (!res.ok) {
                reservationContainer.textContent = "⚠️ Loading error";
                return;
            }
            const data = await res.json().catch(() => ({ success: false }));

            if (!data.success || !Array.isArray(data.reservations)) {
                reservationContainer.textContent = "⚠️ Loading error";
                return;
            }

            reservationsCache[currentPage] = data.reservations;
            totalPages = Number.isFinite(Number(data.pages)) ? Number(data.pages) : 1;

            reservationContainer.innerHTML = '';
            reservationContainer.appendChild(renderReservationsTable(data.reservations));
            await translateReservationTable();
            renderPagination(currentPage, totalPages);
        } catch (err) {
            console.error(err);
            reservationContainer.textContent = "⚠️ Loading error";
        }
    }

    function createTextWithBreaks(text) {
        const frag = document.createDocumentFragment();
        const parts = String(text || '').split(/\r?\n/);
        parts.forEach((part, idx) => {
            frag.appendChild(document.createTextNode(part));
            if (idx < parts.length - 1) frag.appendChild(document.createElement('br'));
        });
        return frag;
    }

    function renderReservationsTable(list) {
        const wrapper = document.createElement('div');

        if (!Array.isArray(list) || list.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No reservations';
            wrapper.appendChild(p);
            return wrapper;
        }

        const table = document.createElement('table');
        table.className = 'admin-table admin-reservations-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');

        const headings = [
            { cls: 'col-res-id', text: 'ID' },
            { cls: 'col-res-name', text: 'Name' },
            { cls: 'col-res-phone', text: 'Phone' },
            { cls: 'col-res-email', text: 'Email' },
            { cls: 'col-res-date', text: 'Date' },
            { cls: 'col-res-time', text: 'Time' },
            { cls: 'col-res-people', text: 'People' },
            { cls: 'col-res-msg', text: 'Msg' },
            { cls: 'col-res-userid', text: 'User ID' },
            { cls: 'col-res-delete', dataI18n: 'admin.delete', text: 'Remove?' }
        ];

        headings.forEach(h => {
            const th = document.createElement('th');
            th.className = h.cls;
            if (h.dataI18n) th.setAttribute('data-i18n', h.dataI18n);
            th.textContent = h.text;
            headRow.appendChild(th);
        });

        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        for (const r of list) {
            const tr = document.createElement('tr');
            tr.className = 'reservation-row';

            const makeTd = (cls, value) => {
                const td = document.createElement('td');
                td.className = cls;
                td.appendChild(createTextWithBreaks(value));
                return td;
            };

            tr.appendChild(makeTd('col-res-id', String(r.id ?? '')));
            tr.appendChild(makeTd('col-res-name', String(r.name ?? '')));
            tr.appendChild(makeTd('col-res-phone', String(r.phone ?? '')));
            tr.appendChild(makeTd('col-res-email', String(r.email ?? '')));
            tr.appendChild(makeTd('col-res-date', String(r.date ?? '')));
            tr.appendChild(makeTd('col-res-time', String(r.time ?? '')));
            tr.appendChild(makeTd('col-res-people', String(r.people ?? '')));
            tr.appendChild(makeTd('col-res-msg', String(r.message ?? '')));
            tr.appendChild(makeTd('col-res-userid', String(r.user_id ?? '')));

            const tdDel = document.createElement('td');
            tdDel.className = 'col-res-delete';

            const btn = document.createElement('button');
            btn.className = 'admin-delete-reservation-btn edit-account-btn';
            btn.dataset.id = String(r.id ?? '');
            btn.setAttribute('data-i18n', 'admin.delete-yes');
            tdDel.appendChild(btn);
            tr.appendChild(tdDel);

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        wrapper.appendChild(table);
        return wrapper;
    }

    async function translateReservationTable() {
        if (!reservationContainer) return;
        const elements = reservationContainer.querySelectorAll('[data-i18n]');
        for (const el of elements) {
            const key = el.getAttribute('data-i18n');
            await translateElement(el, key);
        }
    }

    function renderPagination(page, pages) {
        if (!paginationContainer) return;
        paginationContainer.innerHTML = "";

        const frag = document.createDocumentFragment();
        const maxButtons = 5;
        let start = Math.max(1, page - 2);
        let end = Math.min(pages, start + maxButtons - 1);
        if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

        if (start > 1) {
            const btn = document.createElement('button');
            btn.className = 'edit-account-btn pg';
            btn.dataset.page = String(start - 1);
            btn.textContent = '⬅';
            frag.appendChild(btn);
        }

        for (let p = start; p <= end; p++) {
            const btn = document.createElement('button');
            btn.className = 'edit-account-btn pg' + (p === page ? ' active' : '');
            btn.dataset.page = String(p);
            btn.textContent = String(p);
            frag.appendChild(btn);
        }

        if (end < pages) {
            const btn = document.createElement('button');
            btn.className = 'edit-account-btn pg';
            btn.dataset.page = String(end + 1);
            btn.textContent = '➡';
            frag.appendChild(btn);
        }

        paginationContainer.appendChild(frag);
    }

    if (paginationContainer) {
        paginationContainer.addEventListener("click", e => {
            const target = e.target;
            if (!target || !target.classList.contains("pg")) return;
            const page = parseInt(target.dataset.page, 10);
            if (!Number.isInteger(page) || page <= 0) return;

            if (reservationsCache[page]) {
                reservationContainer.innerHTML = '';
                reservationContainer.appendChild(renderReservationsTable(reservationsCache[page]));
                translateReservationTable();
                renderPagination(page, totalPages);
                currentPage = page;
            } else {
                loadReservations(page);
            }
        });
    }

    if (reservationContainer) {
        reservationContainer.addEventListener("click", async e => {
          const target = e.target;
          if (!target || !target.classList.contains("admin-delete-reservation-btn")) return;

          const rawId = target.dataset.id;
          const id = parseInt(rawId, 10);
          if (!Number.isInteger(id) || id <= 0) {
              alert('Invalid id');
              return;
          }

          const deleteConfirm = await getTranslation('admin.delete');
          if (!confirm(`${deleteConfirm} #${id}?`)) return;

          try {
            if (window.CSRFManager) {
              try {
                if (!window.CSRFManager.isInitialized || !window.CSRFManager.isInitialized()) {
                  await window.CSRFManager.init();
                }
              } catch (err) {
                console.warn('CSRFManager init failed before admin delete:', err);
              }
            }

            const formData = new FormData();
            formData.append("id", String(id));
            if (window.CSRFManager) {
              await window.CSRFManager.appendToFormData(formData);
            }

            const res = await (window.CSRFManager ? window.CSRFManager.fetchWithCsrf("./php/admin_delete_reservation.php", {
              method: "POST",
              body: formData
            }) : fetch("./php/admin_delete_reservation.php", {
              method: "POST",
              credentials: "include",
              body: formData
            }));

            const data = await res.json().catch(() => ({ success: false, error: 'invalid json' }));

            if (data.success) {
              delete reservationsCache[currentPage];
              loadReservations(currentPage);
            } else {
              alert("Error: " + (data.error || data.message || 'Failed to delete'));
            }

          } catch (err) {
            console.error(err);
            alert("Server error while deleting the reservation");
          }
        });
    }

    
    document.addEventListener('i18n:changed', async () => {
        await translateControlButtons();
        if (reservationContainer && reservationContainer.style.display !== 'none') {
            await translateReservationTable();
        }
    });

    
    (async () => {
        try { await translateControlButtons(); } catch (e) { }
    })();
}
