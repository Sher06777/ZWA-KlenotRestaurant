// mobile/menu-dropdown.js
export function initMobileMenu() {
  const toggle = document.getElementById('mobile-menu-toggle') || document.querySelector('.menu-mobile-toggle');
  const overlay = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu-overlay');
  const focusableSelector = 'a, button, input, [tabindex]:not([tabindex="-1"]), .mobile-menu-list li, .mobile-language-options button';
  if (!toggle || !overlay) { console.warn('⚠️ Mobile menu: not found toggle/overlay'); return; }

  let previouslyFocused = null;
  let isAnimating = false;
  const ANIM_DUR = 220;

  const extraClose = overlay.querySelector('.mobile-menu-close');
  if (extraClose) { try { extraClose.remove(); } catch (e) { extraClose.style.display = 'none'; } }

  function setOpenState(open) {
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    overlay.classList.toggle('active', open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.style.overflow = open ? 'hidden' : '';
  }

  function trapFocus(e) {
    if (!overlay.classList.contains('active')) return;
    if (overlay.contains(e.target)) return;
    const first = overlay.querySelector(focusableSelector);
    if (first) first.focus();
    e.stopPropagation();
  }

  function openMenu() {
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
    if (isAnimating || !overlay.classList.contains('active')) { setOpenState(false); return; }
    isAnimating = true;
    setOpenState(false);
    document.removeEventListener('focus', trapFocus, true);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') { try { previouslyFocused.focus(); } catch (err) {} }
    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
  }

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (isAnimating) return;
    if (overlay.classList.contains('active')) closeMenu(); else openMenu();
  });

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMenu(); });

  overlay.querySelectorAll('.mobile-menu-list li, .mobile-menu-list a').forEach(item => {
    item.addEventListener('click', (e) => { setTimeout(() => closeMenu(), 200); });
  });

  overlay.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      overlay.querySelectorAll('.lang-btn').forEach(b => b.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      const lang = btn.dataset.lang;
      if (lang && window.i18n && typeof window.i18n.setLanguage === 'function') window.i18n.setLanguage(lang).catch(()=>{});
    });
  });

  const observer = new MutationObserver(() => {
    const isActive = overlay.classList.contains('active');
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
}
