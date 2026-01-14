document.addEventListener('DOMContentLoaded', () => {
    // Éléments pour le Background
    const bgSelect = document.getElementById('bgSelect');
    const screenshotImg = document.getElementById('screenshotImg');

    // Éléments pour l'Effet
    const effectSelect = document.getElementById('effectSelect');
    const mainGlow = document.getElementById('mainGlow');

    // 1. Gestion du changement d'image
    bgSelect.addEventListener('change', (e) => {
        const selectedImg = e.target.value;
        // On change la source de l'image
        screenshotImg.src = selectedImg;
        
        // Optionnel : Feedback visuel (fondu)
        screenshotImg.style.opacity = 0;
        setTimeout(() => {
            screenshotImg.style.opacity = 1;
        }, 50);
    });

    // 2. Gestion du changement d'effet
    effectSelect.addEventListener('change', (e) => {
        const newEffect = e.target.value;

        // On retire toutes les classes d'effets possibles
        mainGlow.classList.remove('', '', '');
        
        // On ajoute la nouvelle
        mainGlow.classList.add(newEffect);
    });

    // Initialisation par défaut
    mainGlow.classList.add('haptic-edge');

});