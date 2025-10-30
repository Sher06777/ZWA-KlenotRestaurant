document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('mobile-menu-toggle') || document.querySelector('.menu-mobile-toggle');
  const overlay = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu-overlay');
  const mainEl = document.getElementById('main');
  const focusableSelector = 'a, button, input, [tabindex]:not([tabindex="-1"]), .mobile-menu-list li, .mobile-language-options button';
  let previouslyFocused = null;
  let isAnimating = false;
  const ANIM_DUR = 220;

  if (!toggle || !overlay) {
    console.warn('⚠️ Mobile menu: не найдены необходимые элементы (toggle/overlay).');
    return;
  }

  const extraClose = overlay.querySelector('.mobile-menu-close');
  if (extraClose) {
    try { extraClose.remove(); } catch (e) { extraClose.style.display = 'none'; }
  }

  function setOpenState(open) {
    console.log(`📱 setOpenState(${open}) вызван`);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    overlay.classList.toggle('active', open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');

    if (open) {
      console.log('🔒 Меню открывается → блокируем scroll и скрываем main');
      document.body.style.overflow = 'hidden';

    } else {
      console.log('🔓 Меню закрывается → возвращаем scroll и показываем main');
      document.body.style.overflow = '';
    }
  }

  function trapFocus(e) {
    if (!overlay.classList.contains('active')) return;
    if (overlay.contains(e.target)) return;
    const first = overlay.querySelector(focusableSelector);
    if (first) first.focus();
    e.stopPropagation();
  }

  function openMenu() {
    console.log('🟢 openMenu()');
    if (isAnimating || overlay.classList.contains('active')) return;
    isAnimating = true;
    previouslyFocused = document.activeElement;
    setOpenState(true);
    const focusable = overlay.querySelector(focusableSelector);
    if (focusable) focusable.focus();
    document.addEventListener('focus', trapFocus, true);
    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
  }

  function closeMenu() {
    console.log('🔴 closeMenu()');
    if (isAnimating || !overlay.classList.contains('active')) {
      console.log('⚠️ Пропуск закрытия — isAnimating или overlay не активен');
      setOpenState(false);
      return;
    }
    isAnimating = true;
    setOpenState(false);
    document.removeEventListener('focus', trapFocus, true);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      try { previouslyFocused.focus(); } catch (err) {}
    }
    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
  }

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('👆 Клик по toggle');
    if (isAnimating) return;
    if (overlay.classList.contains('active')) closeMenu(); else openMenu();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      console.log('👆 Клик по фону overlay → закрываем меню');
      closeMenu();
    }
  });

  overlay.querySelectorAll('.mobile-menu-list li, .mobile-menu-list a').forEach(item => {
    item.addEventListener('click', (e) => {
      console.log(`📋 Клик по пункту меню: ${e.target.textContent.trim()}`);
      setTimeout(() => closeMenu(), 200);
    });
  });

  overlay.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      overlay.querySelectorAll('.lang-btn').forEach(b => b.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      const lang = btn.dataset.lang;
      console.log(`🌐 Язык выбран: ${lang}`);
    });
  });

  const observer = new MutationObserver(() => {
    const isActive = overlay.classList.contains('active');
    console.log(`👁 MutationObserver → overlay.active = ${isActive}`);
    if (!isActive) {
      document.body.style.overflow = '';
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      overlay.setAttribute('aria-hidden', 'true');
    }
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('beforeunload', () => {
    document.removeEventListener('focus', trapFocus, true);
    observer.disconnect();
  });
});
