document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');

  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault(); // предотвращаем стандартный submit

      let isValid = true;

      // Получаем все поля input и textarea
      const inputs = form.querySelectorAll('input, textarea');

      inputs.forEach(input => {
        const errorEl = input.nextElementSibling; // предполагаем, что <p class="error-message"></p> под полем

        if (!input.checkValidity()) {
          isValid = false;
          input.classList.add('input-error');
          if (errorEl && errorEl.classList.contains('error-message')) {
            errorEl.textContent = getErrorMessage(input);
            errorEl.classList.add('active');
          }
        } else {
          input.classList.remove('input-error');
          if (errorEl && errorEl.classList.contains('error-message')) {
            errorEl.textContent = '';
            errorEl.classList.remove('active');
          }
        }
      });

      // if (isValid) {
      //   // Здесь можно вызвать отправку на сервер
      //   console.log('Форма валидна, можно отправлять!');
      //   form.submit(); // если позже подключим сервер
      // }
    });
  });

  function getErrorMessage(input) {
    if (input.validity.valueMissing) {
      return 'Это поле обязательно для заполнения';
    }
    if (input.validity.typeMismatch) {
      if (input.type === 'email') return 'Введите корректный email';
    }
    if (input.validity.patternMismatch) {
      return 'Неверный формат';
    }
    if (input.validity.tooShort) {
      return `Минимальная длина: ${input.minLength}`;
    }
    if (input.validity.tooLong) {
      return `Максимальная длина: ${input.maxLength}`;
    }
    return 'Неверное значение';
  }
});
