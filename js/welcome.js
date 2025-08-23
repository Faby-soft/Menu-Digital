document.addEventListener('DOMContentLoaded', () => {
    const titles = document.querySelectorAll('.welcome-title');
    const subtitles = document.querySelectorAll('.welcome-subtitle');
    
    let currentIndex = 0;
    const intervalTime = 3000;

    function showNext() {
        titles[currentIndex].classList.remove('active');
        subtitles[currentIndex].classList.remove('active');
        
        const currentLang = titles[currentIndex].getAttribute('data-lang');
        const currentFlag = document.querySelector(`.flag-item[data-lang="${currentLang}"]`);
        if (currentFlag) {
            currentFlag.classList.remove('highlighted');
        }

        currentIndex = (currentIndex + 1) % titles.length;

        titles[currentIndex].classList.add('active');
        subtitles[currentIndex].classList.add('active');

        const nextLang = titles[currentIndex].getAttribute('data-lang');
        const nextFlag = document.querySelector(`.flag-item[data-lang="${nextLang}"]`);
        if (nextFlag) {
            nextFlag.classList.add('highlighted');
        }
    }

    const initialFlag = document.querySelector(`.flag-item[data-lang="es"]`);
    if(initialFlag) {
        initialFlag.classList.add('highlighted');
    }

    setInterval(showNext, intervalTime);
});