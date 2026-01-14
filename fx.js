document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.querySelector('.trigger');
    const chat = document.querySelector('.chat');
    const body = document.body;
    
    // Configuration Physique
    const CONFIG = {
        threshold: 0.30, // 30% de l'écran pour déclencher l'ouverture
        resistance: 0.2, // Facteur de résistance au tirage
        primingDelay: 3000 // 3 secondes avant l'animation d'intro
    };

    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let panelWidth = chat.offsetWidth || 350; // Largeur par défaut si caché

    // --- 1. AMORÇAGE (État n0 -> n1) ---
    setTimeout(() => {
        // Lance l'animation CSS "primeSlide"
        trigger.classList.add('priming');
        
        // Nettoyage après l'animation
        setTimeout(() => trigger.classList.remove('priming'), 1200);
        
        // Lance le "Flag" (n2) peu après pour la démo
        setTimeout(() => showFlag("Besoin d'un conseil ?"), 5000);
    }, CONFIG.primingDelay);

    // Fonction pour afficher le Flag (n2)
    function showFlag(text) {
        trigger.setAttribute('data-label', text);
        trigger.classList.add('flag-active');
        // Masquer après 5s
        setTimeout(() => trigger.classList.remove('flag-active'), 5000);
    }

    // --- 2. GESTION DU SWIPE (Physique Tactile) ---

    const onTouchStart = (e) => {
        if (body.classList.contains('panel-open')) return; // Ne gère que l'ouverture pour ce PoC
        
        startX = e.touches[0].clientX;
        isDragging = true;
        
        // On coupe les transitions CSS pour un suivi 1:1 instantané
        trigger.style.transition = 'none';
        chat.style.transition = 'none';
        
        // Mesure la largeur réelle du panneau
        panelWidth = chat.getBoundingClientRect().width;
    };

    const onTouchMove = (e) => {
        if (!isDragging) return;
        
        currentX = e.touches[0].clientX;
        let deltaX = currentX - startX; // Négatif si on tire vers la gauche

        // Logique de mouvement : On tire vers la gauche
        if (deltaX < 0) {
            // Mouvement du Trigger (suit le doigt)
            trigger.style.transform = `translateY(-50%) translateX(${deltaX}px)`;
            
            // Mouvement du Chat Panel (suit avec un léger décalage ou collé)
            // On calcule la position : 100% (caché) -> 0% (ouvert)
            // Initialement à 100% (soit panelWidth px). On veut le rapprocher de 0.
            let chatTranslate = Math.max(0, panelWidth + deltaX);
            chat.style.transform = `translateX(${chatTranslate}px)`;
        }
    };

    const onTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        // Rétablissement des transitions CSS (Bezier)
        trigger.style.transition = '';
        chat.style.transition = '';
        trigger.style.transform = ''; // Nettoie le style inline
        chat.style.transform = '';    // Nettoie le style inline

        let deltaX = startX - currentX; // Distance parcourue vers la gauche
        
        // --- 3. SEUIL MAGNÉTIQUE ---
        const screenWidth = window.innerWidth;
        const triggerPoint = screenWidth * CONFIG.threshold;

        if (deltaX > triggerPoint) {
            // Ouverture complète (nX)
            openPanel();
        } else {
            // Rebond élastique (Fermeture)
            closePanel();
        }
    };

    // --- FONCTIONS D'ÉTAT ---

    function openPanel() {
        body.classList.add('panel-open');
        trigger.classList.remove('pulse', 'flag-active');
    }

    function closePanel() {
        body.classList.remove('panel-open');
        trigger.classList.add('pulse'); // Retour en veille active
    }

    // Toggle Click pour Desktop
    trigger.addEventListener('click', () => {
        if (body.classList.contains('panel-open')) {
            closePanel();
        } else {
            openPanel();
        }
    });

    // Listeners Tactiles
    trigger.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true }); // Window pour ne pas perdre le drag si on sort du trigger
    window.addEventListener('touchend', onTouchEnd);
});