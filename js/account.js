// js/account.js
document.addEventListener('DOMContentLoaded', () => {
  const accountSection = document.querySelector('.personal-account');
  if (!accountSection) return;

  const btnDates = accountSection.querySelector('.personal-account-dates');
  const btnReservation = accountSection.querySelector('.personal-account-reservation');
  const btnAdmin = accountSection.querySelector('.personal-account-admin-panel');

  const contentDates = accountSection.querySelector('.personal-account-content.dates');
  const contentReservation = accountSection.querySelector('.personal-account-content.reservation');
  const contentAdmin = accountSection.querySelector('.personal-account-content.admin');

  const buttons = [btnDates, btnReservation, btnAdmin];
  const contents = {
    dates: contentDates,
    reservation: contentReservation,
    admin: contentAdmin
  };

  // safety checks
  if (!buttons.some(Boolean) || !contentDates) return;

  // helper: hide all contents and remove "active" state from buttons
  function clearAll() {
    Object.values(contents).forEach(c => {
      if (!c) return;
      c.classList.remove('visible');
      c.classList.add('invisible-account-button');
    });

    buttons.forEach(b => {
      if (!b) return;
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
  }

  // show named tab: 'dates' | 'reservation' | 'admin'
  function showTab(name) {
    if (!contents[name]) return;
    clearAll();
    contents[name].classList.remove('invisible-account-button');
    contents[name].classList.add('visible');

    // mark corresponding button active
    const map = {
      dates: btnDates,
      reservation: btnReservation,
      admin: btnAdmin
    };
    const btn = map[name];
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      btn.focus({preventScroll: true});
    }
  }

  // attach click handlers (defensive)
  btnDates?.addEventListener('click', (e) => { e.preventDefault(); showTab('dates'); });
  btnReservation?.addEventListener('click', (e) => { e.preventDefault(); showTab('reservation'); });
  btnAdmin?.addEventListener('click', (e) => { e.preventDefault(); showTab('admin'); });

  // keyboard navigation (Left/Right / Up/Down / Enter / Space)
  buttons.forEach(b => {
    if (!b) return;
    b.setAttribute('role', 'tab');
    b.setAttribute('tabindex', '0');
    b.setAttribute('aria-pressed', 'false');

    b.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        b.click();
      } else if (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') {
        ev.preventDefault();
        focusNextButton(b, 1);
      } else if (ev.key === 'ArrowUp' || ev.key === 'ArrowLeft') {
        ev.preventDefault();
        focusNextButton(b, -1);
      }
    });
  });

  function focusNextButton(current, step) {
    const arr = buttons.filter(Boolean);
    const idx = arr.indexOf(current);
    if (idx === -1) return;
    let next = (idx + step + arr.length) % arr.length;
    arr[next].focus();
  }

  // При первой загрузке / показе personal-account — показываем "dates"
  // Если секция уже видима — показываем сразу
  if (accountSection.classList.contains('visible')) {
    showTab('dates');
  }

  // Наблюдаем за видимостью секции (если SPA добавляет/убирает классы visible/invisible)
  const mo = new MutationObserver(muts => {
    for (const m of muts) {
      if (m.attributeName === 'class') {
        if (accountSection.classList.contains('visible')) {
          showTab('dates');
        }
      }
    }
  });
  mo.observe(accountSection, { attributes: true });

  // Экспортим функцию в глобал, если понадобится вызвать извне
  window.showAccountTab = showTab;
});
