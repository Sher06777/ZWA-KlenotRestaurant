
function showBlock(blockToShow, options = {}) {
  const allBlocks = [
    document.querySelector('.personal-account-content.dates'),
    document.querySelector('.personal-account-content.reservation'),
    document.getElementById('admin-users-content'),
    document.getElementById('admin-panel')
  ];

  let animationsCompleted = 0;
  const blocksToAnimate = allBlocks.filter(block => block && (!options.keepParent || block !== options.keepParent));
  const total = blocksToAnimate.length;

  blocksToAnimate.forEach(block => {
    if (block === blockToShow) {
      fadeIn(block, () => {
        animationsCompleted++;
        if (animationsCompleted === total) adjustAccountSectionHeight();
      });
    } else {
      fadeOut(block, () => {
        animationsCompleted++;
        if (animationsCompleted === total) adjustAccountSectionHeight();
      });
    }
  });

  // На случай, если нет блоков для анимации
  if (total === 0) adjustAccountSectionHeight();
}

// === Кеш для пользователей, чтобы не перегружать сервер ===
let cachedUsers = null;
let cachedUsersPages = {};
let userCurrentPage = 1;
let userTotalPages = 1;
const USERS_PER_PAGE = 4;


// === Загрузка всех пользователей ===
function loadUsersPage(page = 1) {
  const tableWrap = document.querySelector('#admin-users-table .admin-users-table-wrap');
  if (!tableWrap) return;

  let paginationEl = document.getElementById('admin-users-table-pagination');
  if (!paginationEl) {
    paginationEl = document.createElement('div');
    paginationEl.id = 'admin-users-table-pagination';
    paginationEl.classList.add('admin-users-pagination');

    const buttonsDiv = document.querySelector('.admin-users-buttons');
    const usersContent = document.getElementById('admin-users-content');
    if (buttonsDiv && usersContent) {
      buttonsDiv.parentElement.insertBefore(paginationEl, usersContent);
    } else {
      tableWrap.parentElement.insertBefore(paginationEl, tableWrap.nextSibling);
    }
  }

  // Если есть кеш для страницы, рендерим его и выходим
  if (cachedUsersPages[page]) {
    userCurrentPage = page;
    renderUsers(cachedUsersPages[page], tableWrap);
    renderUserPagination(userCurrentPage, userTotalPages, paginationEl);
    return;
  }

  tableWrap.innerHTML = `<p>Loading users...</p>`;
  paginationEl.innerHTML = '';

  fetch(`./php/admin_get_users.php?page=${page}`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (!data.success || !data.users) {
        tableWrap.innerHTML = `<p>Failed to load users</p>`;
        return;
      }

      cachedUsersPages[page] = data.users; // сохраняем в кеш
      userCurrentPage = data.currentPage;
      userTotalPages = data.totalPages;

      renderUsers(cachedUsersPages[page], tableWrap);
      renderUserPagination(userCurrentPage, userTotalPages, paginationEl);
    })
    .catch(() => tableWrap.innerHTML = `<p>Server error</p>`);
}

async function translateUserTable(tableWrap) {
  if (!tableWrap) return;
  const elements = tableWrap.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    await translateElement(el, key);
  }
}

// === Отрисовка таблицы пользователей ===
function renderUsers(users, tableWrap) {
  let html = `
    <table class="admin-users-table">
      <tr>
        <th>ID</th>
        <th>Login</th>
        <th>Email</th>
        <th data-i18n="admin.delete">Удалить?</th>
      </tr>
  `;

  users.forEach(u => {
    html += `
      <tr data-user-id="${u.id}">
        <td>${u.id}</td>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td><button class="user-delete-yes edit-account-btn" data-i18n="admin.delete-yes" data-id="${u.id}">Да</button></td>
      </tr>
    `;
  });

  html += `</table>`;
  tableWrap.innerHTML = html;

  if (!tableWrap.dataset.listenerAdded) {
    tableWrap.addEventListener('click', e => {
      if (!e.target.classList.contains('user-delete-yes')) return;
      const id = e.target.dataset.id;
      if (!id) return;

      fetch("./php/admin_delete_user.php", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${encodeURIComponent(id)}&csrf_token=${encodeURIComponent(csrfToken)}`
      })
        .then(r => r.json())
        .then(resp => {
          if (resp.success) {
            cachedUsersPages = {}; // 💥 очищаем кеш, чтобы подтянуть обновлённые данные
            loadUsersPage(userCurrentPage); // 🔄 перерисовываем таблицу
          }
          else alert("Error deleting user: " + (resp.error || 'Unknown'));
        })
        .catch(() => alert("Server error"));
    });
    tableWrap.dataset.listenerAdded = 'true';
  }
  translateUserTable(tableWrap);
}


function renderUserPagination(current, total, container) {
  container.innerHTML = '';

  const maxButtons = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + maxButtons - 1);

  if (start > 1) container.innerHTML += `<button class="user-pg-btn edit-account-btn" data-page="${start-1}">⬅</button>`;
  for (let p = start; p <= end; p++) {
    container.innerHTML += `<button class="user-pg-btn edit-account-btn ${p===current?'active':''}" data-page="${p}">${p}</button>`;
  }
  if (end < total) container.innerHTML += `<button class="user-pg-btn edit-account-btn" data-page="${end+1}">➡</button>`;

  container.onclick = e => {
    if (!e.target.classList.contains('user-pg-btn')) return;
    const page = Number(e.target.dataset.page);
    if (!isNaN(page) && page >= 1 && page <= userTotalPages) loadUsersPage(page);
  };
}

// === Инициализация админ-панели ===
function initAdminPanel(user) {
  const adminBtn = document.querySelector('.personal-account-admin-panel');
  const adminPanel = document.getElementById('admin-panel');
  const adminUsersBtn = document.getElementById('admin-users-btn');
  const hideAdminUsersBtn = document.getElementById('hide-admin-users-btn');
  const adminUsersContent = document.getElementById('admin-users-content');
  const adminUsersTable = document.getElementById('admin-users-table');

  const datesBtn = document.querySelector('.personal-account-dates');
  const reservationBtn = document.querySelector('.personal-account-reservation');

  const datesContent = document.querySelector('.personal-account-content.dates');
  const reservationContent = document.querySelector('.personal-account-content.reservation');

  if (!adminBtn || !adminPanel) return;

  fetch('./php/check_role.php', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.isAdmin != 1) return;

      fadeIn(adminBtn);

      if (hideAdminUsersBtn) {
          hideAdminUsersBtn.addEventListener('click', () => {
              fadeOut(adminUsersContent);

              const paginationEl = document.getElementById('admin-users-table-pagination');
              if (paginationEl) fadeOut(paginationEl);
          });
      }

      adminBtn.addEventListener('click', () => {
        showBlock(adminPanel, { keepParent: adminUsersContent });
      });

      adminUsersBtn.addEventListener('click', () => {
        showBlock(adminUsersContent, { keepParent: adminPanel });
        personalAccountSection.style.height = "fit-content"

        const tableWrap = document.querySelector('#admin-users-table .admin-users-table-wrap');
        const paginationEl = document.getElementById('admin-users-table-pagination');

        if (paginationEl) {
            fadeIn(paginationEl); // <- снимает invisible
        }

        if (!cachedUsersPages[1]) {
            loadUsersPage(1);
        } else {
            renderUsers(cachedUsersPages[1], tableWrap);
            renderUserPagination(1, userTotalPages, paginationEl);
        }
    });

      datesBtn.addEventListener('click', () => showBlock(datesContent));
      reservationBtn.addEventListener('click', () => showBlock(reservationContent));
    })
    .catch(err => console.error('Ошибка проверки роли:', err));
}

// === Инициализация личного кабинета ===
function initPersonalAccount(user) {
  const accountWrapper = document.getElementById('account-wrapper');
  if (!accountWrapper) return;

  fadeIn(accountWrapper);

  const datesContent = document.querySelector('.personal-account-content.dates');
  if (datesContent) {
    const userNameSpan = datesContent.querySelector('.user-name');
    const loginSpan = datesContent.querySelector('.user-login');
    const emailSpan = datesContent.querySelector('.user-email');
    const passwordSpan = datesContent.querySelector('.user-password');

    if (userNameSpan) userNameSpan.textContent = user.name;
    if (loginSpan) loginSpan.textContent = user.name;
    if (emailSpan) emailSpan.textContent = user.email;
    if (passwordSpan) passwordSpan.textContent = maskPassword();
  }

  showBlock(datesContent);

  const personalAccountButtons = {
    dates: document.querySelector('.personal-account-dates'),
    reservation: document.querySelector('.personal-account-reservation')
  };

  if (personalAccountButtons.dates) {
    personalAccountButtons.dates.onclick = () => showBlock(datesContent);
  }
  if (personalAccountButtons.reservation) {
    personalAccountButtons.reservation.onclick = () => {
      showBlock(document.querySelector('.personal-account-content.reservation'));
      loadUserReservations(user.id);
    };
  }

  initAdminPanel(user);
}
