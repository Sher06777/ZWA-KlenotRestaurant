// admin-users.js — module version (exports)

/* showBlock */
export function showBlock(blockToShow, options = {}) {
  console.log('[ADMIN] showBlock called with:', blockToShow);
  console.trace('[ADMIN] showBlock trace');

  if (typeof blockToShow === 'string') {
    const key = blockToShow.toLowerCase();
    if (key === 'dates' || key === 'datescontent' || key === 'personal-account-content.dates') {
      blockToShow = document.querySelector('.personal-account-content.dates');
    } else if (key === 'reservation' || key === 'reservationcontent') {
      blockToShow = document.querySelector('.personal-account-content.reservation');
    } else if (key === 'admin-panel' || key === 'adminpanel') {
      blockToShow = document.getElementById('admin-panel');
    } else if (key === 'admin-users-content' || key === 'admin-users') {
      blockToShow = document.getElementById('admin-users-content');
    }
  }

  if (!blockToShow || !(blockToShow instanceof Element)) {
    console.log('[ADMIN] showBlock: blockToShow is falsy or not an Element — skipping.');
    return;
  }

  const allBlocks = [
    document.querySelector('.personal-account-content.dates'),
    document.querySelector('.personal-account-content.reservation'),
    document.getElementById('admin-users-content'),
    document.getElementById('admin-panel')
  ].filter(Boolean);

  let animationsCompleted = 0;
  const blocksToAnimate = allBlocks.filter(block => !options.keepParent || block !== options.keepParent);
  const total = blocksToAnimate.length;

  const onAnimDone = () => {
    animationsCompleted++;
    if (animationsCompleted === total) {
      try { adjustAccountSectionHeight(); } catch (e) { console.warn('adjustAccountSectionHeight failed', e); }
    }
  };

  blocksToAnimate.forEach(block => {
    if (block === blockToShow) {
      fadeIn(block);
      setTimeout(onAnimDone, 520);
    } else {
      fadeOut(block);
      setTimeout(onAnimDone, 520);
    }
  });

  if (total === 0) {
    try { adjustAccountSectionHeight(); } catch (e) { console.warn('adjustAccountSectionHeight failed', e); }
  }
}

/* остальные функции — просто добавляем export где нужно */

export let cachedUsersPages = {};
export let userCurrentPage = 1;
export let userTotalPages = 1;
export const USERS_PER_PAGE = 4;

export function loadUsersPage(page = 1) {
  page = Number.isInteger(page) ? page : parseInt(page, 10) || 1;
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
    } else if (tableWrap.parentElement) {
      tableWrap.parentElement.insertBefore(paginationEl, tableWrap.nextSibling);
    }
  }

  if (cachedUsersPages[page]) {
    userCurrentPage = page;
    renderUsers(cachedUsersPages[page], tableWrap);
    renderUserPagination(userCurrentPage, userTotalPages, paginationEl);
    return;
  }

  tableWrap.textContent = (typeof getTranslation === 'function') ? (getTranslation('admin.loading-users') || 'Loading users...') : 'Loading users...';
  if (paginationEl) paginationEl.textContent = '';

  fetch(`./php/admin_get_users.php?page=${encodeURIComponent(page)}`, { credentials: 'include' })
    .then(res => {
      if (!res.ok) throw new Error('Network response not ok');
      return res.json().catch(() => ({ success: false }));
    })
    .then(data => {
      if (!data.success || !Array.isArray(data.users)) {
        tableWrap.textContent = 'Failed to load users';
        return;
      }

      cachedUsersPages[page] = data.users;
      userCurrentPage = Number.isFinite(Number(data.currentPage)) ? Number(data.currentPage) : page;
      userTotalPages = Number.isFinite(Number(data.totalPages)) ? Number(data.totalPages) : 1;

      renderUsers(cachedUsersPages[page], tableWrap);
      renderUserPagination(userCurrentPage, userTotalPages, paginationEl);
    })
    .catch((err) => {
      console.error('Error loading users:', err);
      tableWrap.textContent = 'Server error';
    });
}

export async function translateUserTable(tableWrap) {
  if (!tableWrap) return;
  const elements = tableWrap.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    if (typeof getTranslation === 'function') {
      await getTranslation(key).then(txt => { if (txt) el.textContent = txt; });
    }
  }
}

export function renderUsers(users, tableWrap) {
  if (!Array.isArray(users)) users = [];

  const table = document.createElement('table');
  table.className = 'admin-users-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['ID', 'Login', 'Email', 'Удалить?'].forEach((h, idx) => {
    const th = document.createElement('th');
    if (idx === 3) th.setAttribute('data-i18n', 'admin.delete');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  if (users.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = (typeof getTranslation === 'function') ? (getTranslation('admin.no-users') || 'No users') : 'No users';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.dataset.userId = String(u.id ?? '');

      const tdId = document.createElement('td');
      tdId.textContent = String(u.id ?? '');
      tr.appendChild(tdId);

      const tdLogin = document.createElement('td');
      tdLogin.textContent = String(u.name ?? '');
      tr.appendChild(tdLogin);

      const tdEmail = document.createElement('td');
      tdEmail.textContent = String(u.email ?? '');
      tr.appendChild(tdEmail);

      const tdDelete = document.createElement('td');
      tdDelete.className = 'admin-users-delete-cell';

      const currentUserId = Number(window.currentUserId || 0);
      if (Number(u.id) !== currentUserId) {
        const btn = document.createElement('button');
        btn.className = 'user-delete-yes edit-account-btn';
        btn.setAttribute('data-i18n', 'admin.delete-yes');
        btn.dataset.id = String(u.id ?? '');
        btn.setAttribute('aria-label', `Delete user ${u.id}`);
        tdDelete.appendChild(btn);
      } else {
        tdDelete.textContent = '';
      }
      tr.appendChild(tdDelete);

      tbody.appendChild(tr);
    });
  }

  table.appendChild(tbody);
  tableWrap.innerHTML = '';
  tableWrap.appendChild(table);

  if (!tableWrap.dataset.listenerAdded) {
    tableWrap.addEventListener('click', async e => {
      const target = e.target;
      if (!target || !target.classList.contains('user-delete-yes')) return;

      const rawId = target.dataset.id;
      const id = parseInt(rawId, 10);
      if (!Number.isInteger(id) || id <= 0) {
        alert('Invalid user id');
        return;
      }

      const confirmText = (typeof getTranslation === 'function') ? (await getTranslation('admin.delete') || 'Delete') : 'Delete';
      if (!confirm(`${confirmText} #${id}?`)) return;

      try {
        if (window.CSRFManager) {
          try {
            if (!window.CSRFManager.isInitialized || !window.CSRFManager.isInitialized()) {
              await window.CSRFManager.init();
            }
          } catch (err) {
            console.warn('CSRFManager init failed before delete user:', err);
          }
        }

        const formData = new FormData();
        formData.append('id', String(id));
        if (window.CSRFManager) {
          await window.CSRFManager.appendToFormData(formData);
        }

        const fetchResp = window.CSRFManager
          ? await window.CSRFManager.fetchWithCsrf("./php/admin_delete_user.php", { method: 'POST', body: formData })
          : await fetch("./php/admin_delete_user.php", { method: 'POST', credentials: 'include', body: formData });

        const resp = await fetchResp.json().catch(() => ({ success: false }));

        if (resp.success) {
          cachedUsersPages = {};
          loadUsersPage(userCurrentPage);
        } else {
          alert("Error deleting user: " + (resp.error || resp.message || 'Unknown'));
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        alert("Server error при удалении пользователя");
      }
    });

    tableWrap.dataset.listenerAdded = 'true';
  }

  translateUserTable(tableWrap);
}

export function renderUserPagination(current, total, container) {
  if (!container) return;
  container.innerHTML = '';

  const maxButtons = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(total, start + maxButtons - 1);
  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

  const frag = document.createDocumentFragment();

  if (start > 1) {
    const btn = document.createElement('button');
    btn.className = 'user-pg-btn edit-account-btn';
    btn.dataset.page = String(start - 1);
    btn.textContent = '⬅';
    frag.appendChild(btn);
  }

  for (let p = start; p <= end; p++) {
    const btn = document.createElement('button');
    btn.className = 'user-pg-btn edit-account-btn' + (p === current ? ' active' : '');
    btn.dataset.page = String(p);
    btn.textContent = String(p);
    frag.appendChild(btn);
  }

  if (end < total) {
    const btn = document.createElement('button');
    btn.className = 'user-pg-btn edit-account-btn';
    btn.dataset.page = String(end + 1);
    btn.textContent = '➡';
    frag.appendChild(btn);
  }

  container.appendChild(frag);

  container.onclick = e => {
    const t = e.target;
    if (!t || !t.classList.contains('user-pg-btn')) return;
    const page = Number(t.dataset.page);
    if (!isNaN(page) && page >= 1 && page <= userTotalPages) loadUsersPage(page);
  };
}

export function initAdminPanel(user) {
  const adminBtn = document.querySelector('.personal-account-admin-panel');
  const adminPanel = document.getElementById('admin-panel');
  const adminUsersBtn = document.getElementById('admin-users-btn');
  const hideAdminUsersBtn = document.getElementById('hide-admin-users-btn');
  const adminUsersContent = document.getElementById('admin-users-content');

  const datesBtn = document.querySelector('.personal-account-dates');
  const reservationBtn = document.querySelector('.personal-account-reservation');

  if (!adminBtn || !adminPanel) return;

  window.currentUserId = Number(user && user.id ? user.id : 0);

  fetch('./php/check_role.php', { credentials: 'include' })
    .then(res => res.json().catch(() => ({})))
    .then(data => {
      if (data.isAdmin != 1) return;

      fadeIn(adminBtn);

      if (hideAdminUsersBtn && adminUsersContent) {
        hideAdminUsersBtn.addEventListener('click', () => {
          fadeOut(adminUsersContent);
          const paginationEl = document.getElementById('admin-users-table-pagination');
          if (paginationEl) fadeOut(paginationEl);
        });
      }

      if (adminBtn) {
        adminBtn.addEventListener('click', () => {
          showBlock(adminPanel, { keepParent: adminUsersContent });
        });
      }

      if (adminUsersBtn) {
        adminUsersBtn.addEventListener('click', () => {
          showBlock(adminUsersContent, { keepParent: adminPanel });
          if (document.getElementById('admin-users-table-pagination')) fadeIn(document.getElementById('admin-users-table-pagination'));

          const tableWrap = document.querySelector('#admin-users-table .admin-users-table-wrap');
          const paginationEl = document.getElementById('admin-users-table-pagination');

          if (!cachedUsersPages[1]) {
            loadUsersPage(1);
          } else {
            renderUsers(cachedUsersPages[1], tableWrap);
            renderUserPagination(1, userTotalPages, paginationEl);
          }
        });
      }

      if (datesBtn) datesBtn.addEventListener('click', () => showBlock(document.querySelector('.personal-account-content.dates')));
      if (reservationBtn) reservationBtn.addEventListener('click', () => showBlock(document.querySelector('.personal-account-content.reservation')));
    })
    .catch(err => console.error('Ошибка проверки роли:', err));
}

/* initPersonalAccount for backwards compatibility with older scripts — exports available */
export function initPersonalAccount(user) {
  const accountWrapper = document.getElementById('account-wrapper');
  if (!accountWrapper) return;

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

  const localDates = document.querySelector('.personal-account-content.dates');
  if (accountWrapper.classList.contains('visible') && localDates) {
    showBlock(localDates);
  } else {
    if (localDates) {
      localDates.classList.remove('visible');
      localDates.classList.add('invisible');
    }
    const localRes = document.querySelector('.personal-account-content.reservation');
    if (localRes) {
      localRes.classList.remove('visible');
      localRes.classList.add('invisible');
    }
  }

  const personalAccountButtons = {
    dates: document.querySelector('.personal-account-dates'),
    reservation: document.querySelector('.personal-account-reservation')
  };

  if (personalAccountButtons.dates) personalAccountButtons.dates.onclick = () => showBlock(document.querySelector('.personal-account-content.dates'));
  if (personalAccountButtons.reservation) {
    personalAccountButtons.reservation.onclick = () => {
      showBlock(document.querySelector('.personal-account-content.reservation'));
      loadUserReservations(user.id);
    };
  }

  initAdminPanel(user);
}
