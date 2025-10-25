async function loadMenu() {
  try {
    const response = await fetch('data/menu.json'); // путь к JSON
    if (!response.ok) {
      throw new Error('Ошибка загрузки меню');
    }

    const menuItems = await response.json();
    renderMenu(menuItems);
  } catch (error) {
    console.error('Ошибка при загрузке меню:', error);
  }
}



function renderMenu(items) {
  const menuContainer = document.querySelector('.menu-items');
  if (!menuContainer) {
    console.error('Контейнер .menu-items не найден в DOM');
    return;
  }

  menuContainer.innerHTML = ''; // очистка старого содержимого

  items.forEach(item => {
    const template = document.getElementById('menu-item-template');
    const clone = template.content.cloneNode(true);

    const article = clone.querySelector('.menu-item');
    const img = clone.querySelector('img');
    const title = clone.querySelector('.menu-first-text');
    const desc = clone.querySelector('.menu-first-desc');
    const price = clone.querySelector('.menu-first-price');
    const weight = clone.querySelector('.menu-order-weight');

    // наполнение
    article.dataset.category = item.category;
    img.src = item.image;
    img.alt = item.name;
    title.textContent = item.name;
    desc.textContent = item.description;
    price.textContent = item.price;
    weight.textContent = item.weight;

    menuContainer.appendChild(clone);
  });
}