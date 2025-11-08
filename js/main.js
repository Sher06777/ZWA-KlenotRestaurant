document.addEventListener('DOMContentLoaded', () => {
  fetch('get_csrf_token.php') //def CSRF (Cross-Site Request Forgery) - attack
    .then(res => res.json())
    .then(data => { window.csrfToken = data.csrf_token; });
});

document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.main-content-wrapper');
  if (wrapper) {
    wrapper.classList.add('loaded');
  }
});