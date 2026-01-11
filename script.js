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
        mainGlow.classList.remove('effect-glow1', 'effect-flow', 'effect-pulse');
        
        // On ajoute la nouvelle
        mainGlow.classList.add(newEffect);
    });

    // Initialisation par défaut
    mainGlow.classList.add('effect-glow1');

});

let scrollTimeout;
const viewport = document.querySelector('.phone__scroll-container');

viewport.addEventListener('scroll', () => {
    if (effectSelect.value === 'effect-peek') {
        const trigger = document.querySelector('.glass-trigger');
        // On cache pendant le scroll
        trigger.style.right = '-20px';
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // On fait "coucou" après 2 secondes d'arrêt
            trigger.style.right = '0px';
        }, 2000);
    }
});

// N'oublie pas de mettre à jour le gestionnaire de select existant 
// pour réinitialiser les styles si nécessaire.
effectSelect.addEventListener('change', (e) => {
    mainGlow.className = 'fx ' + e.target.value; // Remplace les classes proprement
    // Reset du style inline du trigger pour l'effet Peek
    document.querySelector('.glass-trigger').style.right = ''; 
});

// Dans ton gestionnaire de changement d'effet :
if (newEffect === 'effect-electric') {
    const stream3 = document.createElement('div');
    stream3.className = 'electric-stream-3';
    document.querySelector('.glass-effect').appendChild(stream3);
}