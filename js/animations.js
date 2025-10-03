const slides = document.querySelectorAll('.slider-image-item');
const progressFill = document.querySelector('.slider-progress-fill');
const radios = [
  document.getElementById('slider-switch-1'),
  document.getElementById('slider-switch-2'),
  document.getElementById('slider-switch-3')
];

let current = 0;

const progressValues = [0.66, 0.33, 0];

const showSlide = (index) => {
    current = index;

    slides.forEach((slide, i) => {
        if (i === index) {
            slide.classList.add('active');
            radios[i].checked = true;
        } else {
            slide.classList.remove('active');
            radios[i].checked = false;
        }
    });

    
    progressFill.style.transform = `scaleY(${progressValues[index]})`;

}

const nextSlide = () => {
    showSlide((current + 1) % slides.length);
}

radios.forEach((radio, i) => {
    radio.addEventListener('change', () => {
        showSlide(i);
    });
});


showSlide(current);
setInterval(nextSlide, 7000);