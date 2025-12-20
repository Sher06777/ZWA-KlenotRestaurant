// account.js — module version that preserves old behavior (adapted from your working GS file)

// Cached DOM refs (like in your old file)
const personalAccountSection = document.getElementById('personal-account');
const editButton = document.querySelector('.edit-account-btn');
const userNameEl = document.querySelector('.user-name');

const datesContent = personalAccountSection ? personalAccountSection.querySelector('.personal-account-content.dates') : null;
const reservationContent = personalAccountSection ? personalAccountSection.querySelector('.personal-account-content.reservation') : null;

const adminPanelButton = document.querySelector('.personal-account-admin-panel');
const adminPanelSection = document.getElementById('admin-panel');

const personalAccountButtons = {
  dates: personalAccountSection ? personalAccountSection.querySelector('.personal-account-dates') : null,
  reservation: personalAccountSection ? personalAccountSection.querySelector('.personal-account-reservation') : null,
};

const logoutButton = datesContent ? datesContent.querySelector('.logout-account-btn') : null;

// Try init CSRF early (best-effort) as old file did
if (window.CSRFManager && typeof window.CSRFManager.init === 'function') {
  window.CSRFManager.init().catch(err => {
    console.warn('CSRFManager init failed in account.js:', err);
  });
}

// hide admin tables (same as old)
function hideAdminTables() {
  const allReservations = document.getElementById("admin-reservations-container");
  const allReservationsPagination = document.getElementById("admin-reservations-pagination");
  if (allReservations) allReservations.style.display = 'none';
  if (allReservationsPagination) allReservationsPagination.innerHTML = '';

  const adminUsersTableWrap = document.querySelector('#admin-users-table .admin-users-table-wrap');
  const adminUsersPagination = document.getElementById('admin-users-table-pagination');
  const adminUsersContent = document.getElementById('admin-users-content');

  if (adminUsersTableWrap) {
    adminUsersTableWrap.innerHTML = '';
    try { delete adminUsersTableWrap.dataset.listenerAdded; } catch(e){}
  }
  if (adminUsersPagination) adminUsersPagination.innerHTML = '';
}

// translate helper (keeps behavior)
async function translatePersonalAccount(section) {
  if (!section) return;
  const elements = section.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    // old code used translateElement — keep same call (translateElement exists elsewhere)
    if (typeof translateElement === 'function') {
      try { await translateElement(el, key); } catch(e) { /* ignore per-element errors */ }
    }
  }
}

// show only one internal block (exactly like old)
function showAccountBlock(block) {
  console.log('[ACCOUNT] showAccountBlock called ->', block && (block.className || block.id),
    { datesClass: datesContent ? Array.from(datesContent.classList) : null, reservationClass: reservationContent ? Array.from(reservationContent.classList) : null });

  const adminUsersContent = document.getElementById('admin-users-content');
  const adminPanelEl = document.getElementById('admin-panel');

  const blocks = [datesContent, reservationContent, adminUsersContent, adminPanelEl].filter(Boolean);

  blocks.forEach(el => {
    if (!el) return;
    if (el === block) {
      el.classList.remove('invisible');
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
      el.classList.add('invisible');
    }
  });

  console.log('[ACCOUNT] showAccountBlock done. datesContent classes:',
    datesContent ? Array.from(datesContent.classList) : null,
    'reservationContent classes:', reservationContent ? Array.from(reservationContent.classList) : null,
    'adminUsersContent classes:', (document.getElementById('admin-users-content') ? Array.from(document.getElementById('admin-users-content').classList) : null),
    'adminPanel classes:', (document.getElementById('admin-panel') ? Array.from(document.getElementById('admin-panel').classList) : null));
}

// password mask helper
function maskPassword() { return '••••••••'; }

// --- initPersonalAccount (exported) — adapted from old file, same behavior ---
export async function initPersonalAccount(user) {
  if (!window.isLoggedIn?.()) {
  console.warn('[ACCOUNT] blocked — not logged in');
  return;
}

  if (!user) {
    console.warn('[ACCOUNT] initPersonalAccount called without user');
    return;
  }
  console.log('[ACCOUNT] initPersonalAccount called with user:', user);

  // --- New: ensure we know if user is admin (fetch fallback) ---
  if (typeof user.isAdmin === 'undefined') {
    try {
      const resp = await fetch('./php/check_role.php', { credentials: 'include' });
      const roleData = await resp.json().catch(()=>({}));
      // normalize response (1 or true -> true)
      user.isAdmin = (roleData && (roleData.isAdmin === 1 || roleData.isAdmin === true));
      console.log('[ACCOUNT] check_role.php returned, set user.isAdmin =', user.isAdmin);
    } catch (e) {
      console.warn('[ACCOUNT] check_role fetch failed', e);
      user.isAdmin = false;
    }
  }

  if (!personalAccountSection) {
    console.warn('initPersonalAccount: #personal-account not found, aborting');
    return;
  }

  // preserve initialized-for state
  window.__personalAccountInitializedFor = window.__personalAccountInitializedFor || null;
  const alreadyFor = window.__personalAccountInitializedFor;

  // Update user texts (always)
  const welcomeUserName = document.querySelector('.personal-account-welcome .user-name');
  if (welcomeUserName) welcomeUserName.textContent = user.name;
  const loginSpan = datesContent ? datesContent.querySelector('.user-login') : null;
  const emailSpan = datesContent ? datesContent.querySelector('.user-email') : null;
  const passwordSpan = datesContent ? datesContent.querySelector('.user-password') : null;
  const passwordLabel = datesContent ? datesContent.querySelector('.user-password-label') : null;

  if (loginSpan) loginSpan.textContent = user.name;
  if (emailSpan) emailSpan.textContent = user.email;
  if (passwordSpan) {
    passwordSpan.textContent = maskPassword();
    passwordSpan.classList.add('user-password--styled');
  }
  if (passwordLabel) {
    if (typeof getTranslation === 'function') {
      getTranslation('personal-account.password').then(txt => {
        passwordLabel.textContent = txt || 'Heslo:';
      }).catch(()=>{});
    }
  }

  // If already initialized for same user -> do not touch visibility
  if (alreadyFor && user.id && alreadyFor === user.id) {
    try {
      const accountWrapperEl = document.getElementById('account-wrapper');
      if (accountWrapperEl && accountWrapperEl.classList.contains('visible')) {
        // wrapper is visible now — ensure the dates tab is shown (user expects to see profile)
        try { showAccountBlock(datesContent); } catch (e) { console.warn('[ACCOUNT] showAccountBlock on re-init failed', e); }
      } else {
        console.log('[ACCOUNT] already initialized for this user id -> wrapper not visible, skipping visibility changes');
      }
    } catch (e) {
      console.warn('[ACCOUNT] safe re-init visibility check failed', e);
    }
    // still bail out from full re-initialization (we already did it previously)
    return;
  }

  // set new initialized-for marker
  window.__personalAccountInitializedFor = user.id || true;

  // attach logout via AuthManager if available
  if (window.AuthManager && typeof window.AuthManager.attachLogoutButton === 'function') {
    try { window.AuthManager.attachLogoutButton('.logout-account-btn'); } catch (e) { console.warn('attachLogoutButton error', e); }
  }

  // show personal-account section (outer wrapper visibility still controlled by switch-visibility)
  personalAccountSection.classList.remove('invisible');

  if (user.isAdmin && adminPanelButton) {
    try {
      // quick visual toggle
      adminPanelButton.classList.remove('invisible');
      adminPanelButton.classList.add('visible');

      // use existing fadeIn if available (keeps same animation semantics)
      if (typeof window.fadeIn === 'function') {
        try { window.fadeIn(adminPanelButton); } catch (e) { /* ignore */ }
      }
    } catch (e) {
      console.warn('Failed to force-show adminPanelButton', e);
    }
  }

  // IMPORTANT: follow the old behaviour — if account-wrapper already visible => show dates,
  // otherwise keep internal tabs invisible (do NOT force visible when wrapper hidden)
  try {
    const accountWrapperEl = document.getElementById('account-wrapper');
    console.log('[ACCOUNT] initPersonalAccount — accountWrapper classes:', accountWrapperEl ? Array.from(accountWrapperEl.classList) : null);

    if (accountWrapperEl && accountWrapperEl.classList.contains('visible')) {
      console.log('[ACCOUNT] account wrapper visible -> showing datesContent');
      showAccountBlock(datesContent);
    } else {
      console.log('[ACCOUNT] account wrapper not visible -> ensuring internal blocks are invisible');
      if (datesContent) {
        datesContent.classList.remove('visible');
        datesContent.classList.add('invisible');
      }
      if (reservationContent) {
        reservationContent.classList.remove('visible');
        reservationContent.classList.add('invisible');
      }
    }
  } catch (err) {
    console.warn('[ACCOUNT] initPersonalAccount: safe showAccountBlock failed', err);
  }

  // attach buttons for switching tabs (idempotent)
  if (personalAccountButtons.dates) {
    personalAccountButtons.dates.onclick = () => showAccountBlock(datesContent);
  }
  if (personalAccountButtons.reservation) {
    personalAccountButtons.reservation.onclick = () => {
      showAccountBlock(reservationContent);
      try { if (typeof loadUserReservations === 'function') loadUserReservations(user.id); } catch (e) { console.warn('loadUserReservations failed', e); }
    };
  }

  // admin lazy init
  if (user.isAdmin) {
    try {
      if (!window.__adminInitAttempted && !window.__adminInitInProgress) {
        // пометка, что инициализация в процессе (чтобы не гонять параллельно)
        window.__adminInitInProgress = true;

        const finalizeSuccess = () => {
          window.__adminInitAttempted = true;
          window.__adminInitInProgress = false;
        };

        // если есть глобальная функция (legacy)
        if (typeof initAdminPanel === 'function') {
          try {
            initAdminPanel(user);
            finalizeSuccess();
          } catch (e) {
            window.__adminInitInProgress = false;
            console.warn('initAdminPanel failed', e);
          }
        } else {
          import('./admin-users.js').then(mod => {
            if (mod && typeof mod.initAdminPanel === 'function') {
              try {
                mod.initAdminPanel(user);
                finalizeSuccess();
              } catch (e) {
                window.__adminInitInProgress = false;
                console.warn('dynamic initAdminPanel call failed', e);
              }
            } else {
              window.__adminInitInProgress = false;
              console.warn('admin-users.js loaded but initAdminPanel missing');
            }
          }).catch(err => {
            window.__adminInitInProgress = false;
            console.warn('failed to import admin-users.js dynamically', err);
          });
        }
      }
    } catch (e) {
      window.__adminInitInProgress = false;
      console.warn('[ACCOUNT] admin lazy-init failed', e);
    }
  }
}
// --- initAccountModule: call this from main to attach the runtime handlers (exported) ---
export function initAccountModule() {
  // attach hideAdminTables on tab clicks (like in old file)
  for (const btn of Object.values(personalAccountButtons)) {
    if (!btn) continue;
    // guard to avoid double-binding
    if (!btn.dataset.hidetabbound) {
      btn.addEventListener('click', hideAdminTables);
      btn.dataset.hidetabbound = 'true';
    }
  }

  if (adminPanelButton && !adminPanelButton.dataset.bound) {
    adminPanelButton.addEventListener('click', (e) => {
      e.preventDefault();
      const adminPanelEl = document.getElementById('admin-panel');
      const adminUsersContent = document.getElementById('admin-users-content');

      // 1) если модуль admin уже экспортирован глобально — предпочитаем его showBlock
      try {
        if (window.admin && typeof window.admin.showBlock === 'function') {
          window.admin.showBlock(adminPanelEl, { keepParent: adminUsersContent });
          return;
        }
      } catch (err) { /* ignore */ }

      // 2) если нет — динамически импортируем admin-users.js и вызываем showBlock
      import('./admin-users.js').then(mod => {
        if (mod && typeof mod.showBlock === 'function') {
          mod.showBlock(adminPanelEl, { keepParent: adminUsersContent });
        } else {
          // fallback: просто показываем панель через локальную функцию
          showAccountBlock(adminPanelEl);
        }
      }).catch(() => {
        // окончательный fallback
        showAccountBlock(adminPanelEl);
      });
    });

    adminPanelButton.dataset.bound = 'true';
  }

  // bind edit button (idempotent)
  if (editButton && !editButton.dataset.bound) {
    editButton.addEventListener('click', async () => {
      if (document.querySelector('.edit-mode')) return;
      if (!datesContent) return;

      const userLoginEl = datesContent.querySelector('.user-login');
      const userEmailEl = datesContent.querySelector('.user-email');
      const userPasswordEl = datesContent.querySelector('.user-password');

      const loginValue = userLoginEl ? userLoginEl.textContent.trim() : '';
      const emailValue = userEmailEl ? userEmailEl.textContent.trim() : '';

      async function createInput(type, value, placeholderKey = '') {
        const input = document.createElement('input');
        input.type = type;
        input.value = value;
        input.classList.add('edit-mode', 'user-password--styled');
        // inline styles preserved from old file
        input.style.background = 'rgba(46, 139, 87, 0.1)';
        input.style.padding = '3px 6px';
        input.style.borderRadius = '4px';
        input.style.fontWeight = '500';
        input.style.color = '#2e8b57';
        input.style.border = '1px solid #2e8b57';
        input.style.outline = 'none';
        input.style.fontSize = '18px';
        input.style.marginRight = '10px';
        if (placeholderKey && typeof getTranslation === 'function') {
          try { const txt = await getTranslation(placeholderKey); if (txt) input.placeholder = txt; } catch(e) {}
        }
        return input;
      }

      const loginInput = await createInput('text', loginValue);
      const emailInput = await createInput('email', emailValue);
      const passwordInput = await createInput('password', '', 'personal-account.set-new-password');

      if (userLoginEl) userLoginEl.replaceWith(loginInput);
      if (userEmailEl) userEmailEl.replaceWith(emailInput);
      if (userPasswordEl) userPasswordEl.replaceWith(passwordInput);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.classList.add('edit-account-btn');
      saveBtn.setAttribute('data-i18n', 'personal-account.save');
      saveBtn.textContent = '💾 Save';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.classList.add('logout-account-btn');
      cancelBtn.setAttribute('data-i18n', 'personal-account.cancel');
      cancelBtn.textContent = '❌ Cancel';

      const buttonContainer = editButton.parentElement;
      editButton.style.display = 'none';

      const logoutBtn = logoutButton; // cached above
      if (logoutBtn && logoutBtn.parentElement === buttonContainer) {
        buttonContainer.insertBefore(saveBtn, logoutBtn);
        buttonContainer.insertBefore(cancelBtn, logoutBtn);
      } else {
        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(cancelBtn);
      }

      translatePersonalAccount(buttonContainer);

      saveBtn.addEventListener('click', async () => {
        const newLogin = loginInput.value.trim();
        const newEmail = emailInput.value.trim();
        const newPassword = passwordInput.value.trim();

        if (!newLogin || newLogin.length < 2) { alert('Login too short.'); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { alert('Invalid email.'); return; }

        const formData = new FormData();
        formData.append('login', newLogin);
        formData.append('email', newEmail);
        if (newPassword.length > 0) formData.append('password', newPassword);

        try {
          if (window.CSRFManager) {
            try { await window.CSRFManager.init(); } catch (e) { console.warn('CSRF init failed:', e); }
            try { await window.CSRFManager.appendToFormData(formData); } catch(e){ console.warn('CSRF append failed:', e); }
          }
        } catch (err) {
          console.warn('CSRF append failed for update_user:', err);
        }

        try {
          const res = await fetch('./php/update_user.php', {
            method: 'POST',
            credentials: 'include',
            body: formData
          });
          const data = await res.json().catch(() => ({ success: false, message: 'Invalid JSON from server' }));

          if (data.success) {
            const newLoginSpan = document.createElement('span');
            newLoginSpan.className = 'user-login';
            newLoginSpan.textContent = newLogin;

            const newEmailSpan = document.createElement('span');
            newEmailSpan.className = 'user-email';
            newEmailSpan.textContent = newEmail;

            const newPasswordSpan = document.createElement('span');
            newPasswordSpan.className = 'user-password user-password--styled';
            newPasswordSpan.textContent = maskPassword();

            loginInput.replaceWith(newLoginSpan);
            emailInput.replaceWith(newEmailSpan);
            passwordInput.replaceWith(newPasswordSpan);

            if (userNameEl) userNameEl.textContent = newLogin;

            saveBtn.remove();
            cancelBtn.remove();
            editButton.style.display = 'inline-block';
          } else {
            alert('Ошибка: ' + (data.message || 'Failed to update data.'));
          }
        } catch (err) {
          console.error('Failed to update data:', err);
          alert('Server connection error.');
        }
      });

      cancelBtn.addEventListener('click', () => {
        const oldLoginSpan = document.createElement('span');
        oldLoginSpan.className = 'user-login';
        oldLoginSpan.textContent = loginValue;

        const oldEmailSpan = document.createElement('span');
        oldEmailSpan.className = 'user-email';
        oldEmailSpan.textContent = emailValue;

        const oldPasswordSpan = document.createElement('span');
        oldPasswordSpan.className = 'user-password user-password--styled';
        oldPasswordSpan.textContent = maskPassword();

        loginInput.replaceWith(oldLoginSpan);
        emailInput.replaceWith(oldEmailSpan);
        passwordInput.replaceWith(oldPasswordSpan);

        saveBtn.remove();
        cancelBtn.remove();
        editButton.style.display = 'inline-block';
      });
    });
    editButton.dataset.bound = 'true';
  }
}

try {
  if (typeof window !== 'undefined') {
    // expose initPersonalAccount globally for legacy code (signin.js / switch-visibility expect it)
    if (!window.initPersonalAccount) window.initPersonalAccount = initPersonalAccount;
    // also expose initAccountModule just in case other legacy code wants it
    if (!window.initAccountModule) window.initAccountModule = initAccountModule;
  }
} catch (e) {
  console.warn('[ACCOUNT] failed to attach globals for legacy compatibility', e);
}