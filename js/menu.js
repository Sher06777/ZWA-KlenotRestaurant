let menuData = {}; // глобально, чтобы фильтровать

async function loadMenu() {
  try {
    const response = await fetch('data/menu.json');
    if (!response.ok) {
      throw new Error('Ошибка загрузки меню');
    }

    menuData = await response.json();
    renderMenu(menuData); // отображаем всё по умолчанию
    setupMenuFilters();   // подключаем фильтры
  } catch (error) {
    console.error('Ошибка при загрузке меню:', error);
  }
}

function renderMenu(data, filter = 'all') {
  const menuContainer = document.querySelector('.menu-items');
  if (!menuContainer) {
    console.error('Контейнер .menu-items не найден в DOM');
    return;
  }

  menuContainer.innerHTML = ''; // очистка старого содержимого

  // Проходим по категориям
  Object.entries(data).forEach(([category, items]) => {
    // фильтр по категории
    if (filter !== 'all' && filter !== category) return;

    items.forEach(item => {
      const template = document.getElementById('menu-item-template');
      if (!template) {
        console.error('Шаблон #menu-item-template не найден');
        return;
      }

      const clone = template.content.cloneNode(true);

      const article = clone.querySelector('.menu-item');
      const img = clone.querySelector('img');
      const title = clone.querySelector('.menu-first-text');
      const desc = clone.querySelector('.menu-first-desc');
      const price = clone.querySelector('.menu-first-price');
      const weight = clone.querySelector('.menu-order-weight');

      article.dataset.category = category;
      img.src = item.image;
      img.alt = item.name;
      title.textContent = item.name;
      desc.textContent = item.description;
      price.textContent = item.price;
      weight.textContent = item.weight;

      menuContainer.appendChild(clone);
    });
  });
}

function setupMenuFilters() {
  const buttons = document.querySelectorAll('.menu-button');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // убираем active со всех кнопок
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      let filter = btn.dataset.filter;

      // Привязываем текст кнопки к категории JSON, если нужно
      // Например, кнопка data-filter="starters" → JSON категория "Appetizers-and-Salads"
      const categoryMap = {
        all: 'all',
        starters: 'Appetizers-and-Salads',
        soups: 'Soups',
        sides: 'Sides-Dishes',
        mains: 'Main-Courses',
        fish: 'Fish-and-Seafood',
        desserts: 'Desserts',
        softs: 'Soft-Drinks',
        alcohol: 'Alcoholic-Beverages'
      };

      renderMenu(menuData, categoryMap[filter]);
    });
  });
}