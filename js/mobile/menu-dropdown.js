document.addEventListener('DOMContentLoaded', () => {
  // элементы
  const toggle = document.getElementById('mobile-menu-toggle') || document.querySelector('.menu-mobile-toggle');
  const overlay = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu-overlay');
  const mainEl = document.querySelector('main'); // может быть null, тогда мы просто не трогаем main
  const focusableSelector = 'a, button, input, [tabindex]:not([tabindex="-1"]), .mobile-menu-list li, .mobile-language-options button';
  let previouslyFocused = null;
  let isAnimating = false; // флаг чтобы защититься от быстрой серии кликов
  const ANIM_DUR = 220; // ms (достаточно для плавных переходов)

  if (!toggle || !overlay) {
    console.warn('Mobile menu: не найдены необходимые элементы (toggle/overlay). Скрипт отключён.');
    return;
  }

  const extraClose = overlay.querySelector('.mobile-menu-close');
  if (extraClose) {
    try { extraClose.remove(); } catch (e) { extraClose.style.display = 'none'; }
  }

  // Вспомогательные функции
  function setOpenState(open) {
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    overlay.classList.toggle('active', open);
    overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) {
      document.body.style.overflow = 'hidden';
      if (mainEl) mainEl.classList.add('invisible');
    } else {
      document.body.style.overflow = '';
      if (mainEl) mainEl.classList.remove('invisible');
    }
  }

  function trapFocus(e) {
    if (!overlay.classList.contains('active')) return;
    if (overlay.contains(e.target)) return;
    // если фокус уходит за пределы overlay — возвращаем на первый фокусируемый элемент
    const first = overlay.querySelector(focusableSelector);
    if (first) first.focus();
    e.stopPropagation();
  }

  function openMenu() {
    if (isAnimating || overlay.classList.contains('active')) return;
    isAnimating = true;
    previouslyFocused = document.activeElement;
    setOpenState(true);
    // фокусируем первый фокусируемый элемент или кнопку закрытия (если есть)
    const focusable = overlay.querySelector(focusableSelector);
    if (focusable) focusable.focus();
    // ловушка фокуса + клавиши
    document.addEventListener('focus', trapFocus, true);
    // защита от двойных кликов/быстрой анимации
    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
  }

  function closeMenu() {
    if (isAnimating || !overlay.classList.contains('active')) {
      setOpenState(false);
      return;
    }
    isAnimating = true;
    setOpenState(false);
    // снимаем ловушки
    document.removeEventListener('focus', trapFocus, true);
    // возвращаем фокус назад, если возможно
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      try { previouslyFocused.focus(); } catch (err) { /* ignore */ }
    }
    setTimeout(() => { isAnimating = false; }, ANIM_DUR);
  }

  // Универсальный toggle
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (isAnimating) return;
    if (overlay.classList.contains('active')) closeMenu(); else openMenu();
  });

  // Закрытие по клику на фон (оверлей) — только если клик именно по бекдропу
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeMenu();
  });

  // Если в меню есть пункты — при клике на пункт меню закрываем меню (и снимаем invisible)
  overlay.querySelectorAll('.mobile-menu-list li, .mobile-menu-list a').forEach(item => {
    item.addEventListener('click', (e) => {
      // если пункт ведёт на другой раздел, переход оставляем — но меню закроем
      // чтобы защититься от сценария "остался только футер" — вызываем closeMenu обязательно
      closeMenu();
    });
  });

  // Обработка кнопок языка (если есть)
  overlay.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      overlay.querySelectorAll('.lang-btn').forEach(b => b.setAttribute('aria-checked', 'false'));
      btn.setAttribute('aria-checked', 'true');
      // тут можно вызывать реальную логику смены языка
      const lang = btn.dataset.lang;
      console.log('Language chosen:', lang);
      // Закрывать меню после смены языка — по желанию. Ниже не закрываем автоматически.
    });
  });

  // Safety: если по каким-то причинам overlay потеряет состояние active (например внешний код),
  // следим за изменениями атрибутов и корректируем скрытие main / overflow.
  const observer = new MutationObserver(() => {
    const isActive = overlay.classList.contains('active');
    if (!isActive) {
      // синхронизируем состояние -> убеждаемся что main видимый
      document.body.style.overflow = '';
      if (mainEl) mainEl.classList.remove('invisible');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      overlay.setAttribute('aria-hidden', 'true');
    }
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });

  // На случай динамического удаления/создания элементов — безопасный unload
  window.addEventListener('beforeunload', () => {
    document.removeEventListener('focus', trapFocus, true);
    observer.disconnect();
  });
});
