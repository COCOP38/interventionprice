// --- Fonctions utilitaires globales ---

/**
 * Formate un nombre en devise euro avec deux décimales et une virgule comme séparateur.
 * @param {number} val - La valeur numérique à formater.
 * @returns {string} La chaîne de caractères formatée en euro.
 */
function formatEuro(val) {
  return val.toFixed(2).replace('.', ',') + ' €';
}

/**
 * Constantes pour les calculs (main d'œuvre, déplacement, remise).
 * Utilisation de points pour les décimales en JavaScript.
 */
const COUT_MO = 54.54; // Coût HT par heure de main d'œuvre
const COUT_DEP = 45.45; // Coût HT du déplacement
const REMISE_DIAG_VAL = 90; // Montant HT de la remise diagnostic

// --- Variables d'état pour chaque mode ---

let currentMode = 'ttc'; // 'ttc' ou 'ht'

// Mode TTC
let ref_article_ttc = 0;
let ref_article_parts_ttc = [];

// --- Initialisation du DOM ---

document.addEventListener('DOMContentLoaded', () => {
  // Initialisation des selects "Nb main d'œuvre" pour les deux modes
  const selectMO_ttc = document.getElementById('nb_mo_ttc');
  const selectMO_ht = document.getElementById('nb_mo_ht');

  for (let i = 1; i <= 14; i++) {
    const optionTTC = document.createElement('option');
    optionTTC.value = i;
    optionTTC.textContent = i;
    selectMO_ttc.appendChild(optionTTC);

    const optionHT = document.createElement('option');
    optionHT.value = i;
    optionHT.textContent = i;
    selectMO_ht.appendChild(optionHT);
  }

  // Récupérer le toggle switch et les conteneurs de mode
  const toggleSwitch = document.getElementById('toggle');
  const byTTC = document.getElementById('byttc');
  const byHT = document.getElementById('byht');

  // Mettre à jour l'affichage initial en fonction de l'état du toggle
  function updateModeDisplay() {
    // Cacher tous les conteneurs de résultats et les zones d'input supplémentaires
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('extra-reference').style.display = 'none';
    document.getElementById('ref-input-zone').style.display = 'none';

    document.getElementById('ht_result-container').style.display = 'none';


    if (toggleSwitch.checked) { // Si coché, c'est le mode HT
      byTTC.style.display = 'none';
      byHT.style.display = 'block';
      currentMode = 'ht';
      // Rendre visible la zone d'ajout de référence et assurer le premier champ HT
      document.getElementById('ht_extra-reference').style.display = 'block';
      ht_addInitialReferenceField(); // Assure la présence du premier champ
    } else { // Sinon, c'est le mode TTC
      byTTC.style.display = 'block';
      byHT.style.display = 'none';
      currentMode = 'ttc';
    }
    // Toujours réinitialiser le message d'erreur du mode HT lors du changement de mode
    const htRefError = document.getElementById('ht_ref_error');
    if (htRefError) {
      htRefError.textContent = '';
    }
  }

  // Écouter le changement sur le toggle switch
  toggleSwitch.addEventListener('change', updateModeDisplay);

  // Appliquer l'affichage initial
  updateModeDisplay();

  // Initialisation des valeurs par défaut pour les selects de remise
  document.getElementById('remise_diag').value = 'false';
  document.getElementById('remise_dep').value = 'false';
  document.getElementById('ht_remise_diag').value = 'false';
  document.getElementById('ht_remise_dep').value = 'false';

  // Ajout des écouteurs pour la validation visuelle en mode HT (sans affichage des résultats)
  document.getElementById('nb_mo_ht').addEventListener('change', calculerHT_noDisplay);
  document.getElementById('ht_remise_diag').addEventListener('change', calculerHT_noDisplay);
  document.getElementById('ht_remise_dep').addEventListener('change', calculerHT_noDisplay);
  document.getElementById('ht_user_taxes').addEventListener('change', calculerHT_noDisplay);
  // Les inputs de référence HT sont gérés dans createRefHTInput et appellent calculerHT_noDisplay
});

// --- Fonctions d'aide pour la création de lignes de résultats ---

/**
 * Crée un élément <li> pour afficher un titre et une valeur dans les résultats.
 * @param {string} titre - Le titre de la ligne (ex: "Main d'œuvre :").
 * @param {string} valeur - La valeur à afficher (ex: "100,00 € HT").
 * @returns {HTMLLIElement} L'élément <li> créé.
 */
function createResultLine(titre, valeur) {
  const li = document.createElement('li');
  const h5 = document.createElement('h5');
  const span = document.createElement('span');
  h5.textContent = titre;
  span.textContent = valeur;
  li.appendChild(h5);
  li.appendChild(span);
  return li;
}

/**
 * Affiche les résultats dans le conteneur spécifié.
 * @param {object} calculs - L'objet contenant tous les résultats des calculs.
 * @param {string} containerId - L'ID du conteneur HTML des résultats (ex: 'resultat' ou 'ht_resultat').
 * @param {string} mode - Le mode de calcul ('ttc' ou 'ht').
 * @param {boolean} displayContainer - Indique si le conteneur de résultats doit être rendu visible.
 */
function displayResults(calculs, containerId, mode, displayContainer = true) {
  const resultatContainer = document.getElementById(containerId);
  resultatContainer.innerHTML = ''; // Vider le conteneur
  resultatContainer.className = ''; // Réinitialiser les classes d'alerte

  const ol = document.createElement('ol');

  if (mode === 'ttc') {
    if (ref_article_parts_ttc.length === 0) {
      ol.appendChild(createResultLine('prix article :', formatEuro(calculs.refArticleInitial) + ' HT'));
    } else {
      // Afficher la première référence (ref_article_ttc - somme des parts)
      const ref1 = +(calculs.refArticleInitial - ref_article_parts_ttc.reduce((a, b) => a + b, 0)).toFixed(2);
      ol.appendChild(createResultLine('prix article 1 :', formatEuro(ref1) + ' HT'));

      // Afficher les références supplémentaires
      ref_article_parts_ttc.forEach((part, index) => {
        ol.appendChild(createResultLine(`prix article ${index + 2} :`, formatEuro(part) + ' HT'));
      });
    }
  } else { // mode === 'ht'
    const refInputs = document.querySelectorAll('#ref-list-ht input[type="number"]');
    let displayedAnyValidRef = false;
    if (refInputs.length > 0) {
      refInputs.forEach((input, index) => {
        const value = parseFloat(input.value.replace(',', '.'));
        if (!isNaN(value) && value >= 0) {
          ol.appendChild(createResultLine(`prix article ${index + 1} :`, formatEuro(value) + ' HT'));
          displayedAnyValidRef = true;
        }
      });
    }

    // Si aucune référence valide n'a été trouvée ou affichée, afficher "Référence article: 0,00 € HT"
    if (!displayedAnyValidRef) {
      ol.appendChild(createResultLine('Prix article :', formatEuro(0) + ' HT'));
    }
  }

  ol.appendChild(createResultLine('Main d\'œuvre :', formatEuro(calculs.mainOeuvre) + ' HT'));
  ol.appendChild(createResultLine('Déplacement :', formatEuro(calculs.deplacement) + ' HT'));
  ol.appendChild(createResultLine('Remise :', calculs.remiseValeur === -REMISE_DIAG_VAL ? formatEuro(calculs.remiseValeur) + ' HT' : "0"));
  ol.appendChild(createResultLine('Total HT :', formatEuro(calculs.totalHT)));
  ol.appendChild(createResultLine(calculs.userTaxesLabel + ' :', formatEuro(calculs.montantTVA)));
  ol.appendChild(createResultLine('Total TTC :', formatEuro(calculs.totalTTC)));

  resultatContainer.appendChild(ol);

  // Rendre visible le conteneur des résultats uniquement si displayContainer est true
  const resultBox = document.getElementById(mode === 'ttc' ? 'result-container' : 'ht_result-container');
  if (displayContainer) {
    resultBox.style.display = 'block';
  } else {
    resultBox.style.display = 'none'; // S'assurer qu'il est caché
  }

  // Gérer l'affichage des boutons d'ajout de référence (inchangé)
  if (mode === 'ttc') {
    document.getElementById('extra-reference').style.display = 'block';
    document.getElementById('add-ref-btn').style.display = ref_article_parts_ttc.length >= 2 ? 'none' : 'inline-block';
    document.getElementById('ref-input-zone').style.display = 'none';
  } else { // mode === 'ht'
    document.getElementById('ht_extra-reference').style.display = 'block';
    updateHTAddRefButtonVisibility();
  }
}


// --- Fonctions de calcul et d'affichage pour le Mode TTC ---

function calculer() {
  const prix_ttc_raw = document.getElementById('prix_ttc').value.replace(',', '.');
  const prix_ttc = parseFloat(prix_ttc_raw);
  const nb_mo = parseInt(document.getElementById('nb_mo_ttc').value); // ID mis à jour
  const remise_diag = document.getElementById('remise_diag').value === 'true';
  const remise_dep = document.getElementById('remise_dep').value === 'true';
  const user_taxes_label = document.getElementById('user_taxes').value;
  const nb_taxes = user_taxes_label === "TVA 10%" ? 1.1 : 1.2;

  const main_oeuvre = +(nb_mo * COUT_MO).toFixed(2);
  const dep = remise_dep ? 0 : COUT_DEP;
  const remise = remise_diag ? REMISE_DIAG_VAL : 0; // Valeur HT de la remise

  // Réinitialiser l'état d'alerte et cacher les zones supplémentaires
  const resultatElement = document.getElementById('resultat');
  resultatElement.className = '';
  document.getElementById('result-container').style.display = 'none';
  document.getElementById('extra-reference').style.display = 'none';


  if (isNaN(prix_ttc) || prix_ttc <= 0) {
    resultatElement.textContent = "❌ Veuillez saisir un Prix de vente TTC valide et supérieur à 0.";
    resultatElement.className = 'alert-error';
    document.getElementById('result-container').style.display = 'block';
    return;
  }

  // Calcul du coût HT de la MO + Déplacement pour la validation
  const cout_mo_dep_ht_pour_validation = +(main_oeuvre + dep - remise).toFixed(2);
  const cout_mo_dep_ttc_pour_validation = +(cout_mo_dep_ht_pour_validation * nb_taxes).toFixed(2);


  if (cout_mo_dep_ttc_pour_validation > prix_ttc) {
    const messageErreur = `⚠️ ${nb_mo} heure(s) de main d'œuvre, le déplacement et la remise représentent au moins ${formatEuro(cout_mo_dep_ttc_pour_validation)} TTC.
Le prix de vente TTC (${formatEuro(prix_ttc)}) est insuffisant. Merci de vérifier votre saisie.`;
    resultatElement.textContent = messageErreur;
    resultatElement.className = 'alert-error';
    document.getElementById('result-container').style.display = 'block';
    return;
  }

  const total_ht = +(prix_ttc / nb_taxes).toFixed(2);
  ref_article_ttc = +(total_ht + remise - (main_oeuvre + dep)).toFixed(2); // Calcul de la référence initiale
  ref_article_parts_ttc = []; // Réinitialiser les parts à chaque nouveau calcul TTC

  const montant_tva = +(prix_ttc - total_ht).toFixed(2);

  const calculs = {
    refArticleInitial: ref_article_ttc,
    mainOeuvre: main_oeuvre,
    deplacement: dep,
    remiseValeur: remise_diag ? -REMISE_DIAG_VAL : 0,
    totalHT: total_ht,
    montantTVA: montant_tva,
    totalTTC: prix_ttc,
    userTaxesLabel: user_taxes_label
  };

  displayResults(calculs, 'resultat', 'ttc', true); // Toujours afficher pour le mode TTC
}

function afficherInputReference() {
  document.getElementById('ref_input_value').value = '';
  document.getElementById('ref_error').textContent = '';
  document.getElementById('ref-input-zone').style.display = 'block';
}

function confirmerNouvelleReference() {
  const inputVal_raw = document.getElementById('ref_input_value').value.replace(',', '.');
  const inputVal = parseFloat(inputVal_raw);
  const refError = document.getElementById('ref_error');

  if (isNaN(inputVal) || inputVal <= 0) {
    refError.textContent = "Veuillez saisir un prix valide et supérieur à 0.";
    return;
  }

  const sumParts = ref_article_parts_ttc.reduce((a, b) => a + b, 0);
  const reste_disponible = +(ref_article_ttc - sumParts).toFixed(2);

  if (inputVal > reste_disponible + 0.01) { // Ajout d'une petite tolérance pour les flottants
    refError.textContent = `Le prix de cette référence (${formatEuro(inputVal)} HT) ne peut pas être supérieur au reste disponible de la référence principale (${formatEuro(reste_disponible)} HT).`;
    return;
  }
  if (inputVal <= 0) { // S'assurer que la nouvelle réf n'est pas négative ou nulle
    refError.textContent = "Le prix de la nouvelle référence doit être positif.";
    return;
  }

  ref_article_parts_ttc.push(+inputVal.toFixed(2));
  document.getElementById('ref-input-zone').style.display = 'none';
  refError.textContent = '';

  // Mettre à jour l'affichage après ajout d'une partie
  const nb_mo = parseInt(document.getElementById('nb_mo_ttc').value);
  const remise_diag = document.getElementById('remise_diag').value === 'true';
  const remise_dep = document.getElementById('remise_dep').value === 'true';
  const user_taxes_label = document.getElementById('user_taxes').value;
  const prix_ttc = parseFloat(document.getElementById('prix_ttc').value.replace(',', '.'));
  const nb_taxes = user_taxes_label === "TVA 10%" ? 1.1 : 1.2;

  const main_oeuvre = +(nb_mo * COUT_MO).toFixed(2);
  const dep = remise_dep ? 0 : COUT_DEP;
  const total_ht = +(prix_ttc / nb_taxes).toFixed(2);
  const montant_tva = +(prix_ttc - total_ht).toFixed(2);

  const calculs = {
    refArticleInitial: ref_article_ttc,
    mainOeuvre: main_oeuvre,
    deplacement: dep,
    remiseValeur: remise_diag ? -REMISE_DIAG_VAL : 0,
    totalHT: total_ht,
    montantTVA: montant_tva,
    totalTTC: prix_ttc,
    userTaxesLabel: user_taxes_label
  };
  displayResults(calculs, 'resultat', 'ttc', true);

  // Cacher le bouton "Ajouter" si 3 références sont déjà là (initiale + 2 nouvelles)
  if (ref_article_parts_ttc.length >= 2) {
    document.getElementById('add-ref-btn').style.display = 'none';
  }
}

// --- Fonctions de calcul et d'affichage pour le Mode HT ---

/**
 * Crée et ajoute un champ d'input pour une référence HT.
 * @param {number} index - L'index de la référence (pour le label et l'ID).
 * @param {number} value - La valeur initiale du champ (par défaut 0).
 */
function createRefHTInput(index, value = 0) {
  const refListHT = document.getElementById('ref-list-ht');
  const divRef = document.createElement('div');
  divRef.className = 'ht-ref-item'; // Pour le style CSS si nécessaire
  divRef.innerHTML = `
        <label><span>Prix article ${index} (HT) :</span>
            <input type="number" id="ht_ref_${index}" value="${value.toFixed(2).replace('.', ',')}" step="0.01">
        </label><br>
    `;
  const inputElement = divRef.querySelector(`#ht_ref_${index}`);
  // Écouteur d'événement pour déclencher le calcul de validation/erreurs lors de la modification
  inputElement.addEventListener('input', calculerHT_noDisplay);
  refListHT.appendChild(divRef);
}

/**
 * Ajoute le champ initial de référence HT si nécessaire et gère l'état du bouton d'ajout.
 */
function ht_addInitialReferenceField() {
  const refListHT = document.getElementById('ref-list-ht');
  // Vider les références existantes et recréer la première pour assurer un état propre
  refListHT.innerHTML = '';
  createRefHTInput(1); // On crée toujours la première référence ici
  updateHTAddRefButtonVisibility(); // Met à jour la visibilité du bouton d'ajout de ref
}

/**
 * Met à jour la visibilité du bouton d'ajout de référence HT.
 */
function updateHTAddRefButtonVisibility() {
  const refListHT = document.getElementById('ref-list-ht');
  const addRefBtn = document.getElementById('ht_add-ref-btn');
  const currentRefInputs = refListHT.querySelectorAll('input[type="number"]').length;

  // Masque le bouton si on a 3 champs (le premier auto + 2 ajoutés)
  if (currentRefInputs >= 3) {
    addRefBtn.style.display = 'none';
  } else {
    addRefBtn.style.display = 'inline-block';
  }
}

/**
 * Fonction de calcul pour le mode HT qui ne déclenche PAS l'affichage des résultats complets.
 * Utilisée pour la validation visuelle des inputs et la mise à jour des messages d'erreur.
 */
function calculerHT_noDisplay() {
  let total_refs_ht = 0;
  const refInputs = document.querySelectorAll('#ref-list-ht input[type="number"]');
  let hasInvalidRef = false;
  const htRefError = document.getElementById('ht_ref_error');
  // Vérifier si htRefError existe avant de manipuler son textContent
  if (htRefError) {
    htRefError.textContent = ''; // Réinitialiser le message d'erreur
  }

  refInputs.forEach((input) => {
    const value_raw = input.value.replace(',', '.');
    const value = parseFloat(value_raw);

    if (isNaN(value) || value < 0) {
      hasInvalidRef = true;
      input.style.borderColor = 'red'; // Visuellement signaler l'input invalide
    } else {
      input.style.borderColor = ''; // Réinitialiser le style
      total_refs_ht += value;
    }
  });

  if (hasInvalidRef) {
    if (htRefError) { // Vérifier htRefError avant d'assigner
      htRefError.textContent = "❌ Certains champs de référence HT contiennent des valeurs invalides. Veuillez corriger.";
    }
  }

  // Effectuer les calculs pour valider le total HT, même si certains champs sont invalides
  const nb_mo_ht = parseInt(document.getElementById('nb_mo_ht').value);
  const remise_diag_ht = document.getElementById('ht_remise_diag').value === 'true';
  const remise_dep_ht = document.getElementById('ht_remise_dep').value === 'true';
  const user_taxes_label_ht = document.getElementById('ht_user_taxes').value;
  const nb_taxes_ht = user_taxes_label_ht === "TVA 10%" ? 1.1 : 1.2;

  const main_oeuvre_ht = +(nb_mo_ht * COUT_MO).toFixed(2);
  const dep_ht = remise_dep_ht ? 0 : COUT_DEP;
  const remise_ht = remise_diag_ht ? REMISE_DIAG_VAL : 0;

  const total_ht_calcul = +(total_refs_ht + main_oeuvre_ht + dep_ht - remise_ht).toFixed(2);

  if (total_ht_calcul < 0 && !hasInvalidRef) {
    if (htRefError) { // Vérifier htRefError avant d'ajouter au textContent
      htRefError.textContent += (hasInvalidRef ? " " : "") + `⚠️ Le Total HT calculé est négatif (${formatEuro(total_ht_calcul)}).`;
    }
  }

  // Le conteneur de résultats reste caché ici, c'est le but de _noDisplay
  document.getElementById('ht_result-container').style.display = 'none';
}


/**
 * Fonction de calcul principale pour le mode HT, déclenchée par le bouton "Calculer".
 * Elle affiche les résultats.
 */
function calculerHT() {
  let total_refs_ht = 0;
  const refInputs = document.querySelectorAll('#ref-list-ht input[type="number"]');
  let hasInvalidRef = false;
  const htRefError = document.getElementById('ht_ref_error'); // Utiliser la référence directe
  // Vérifier si htRefError existe avant de manipuler son textContent
  if (htRefError) {
    htRefError.textContent = ''; // Réinitialiser les messages d'erreur avant d'afficher un nouveau
  }


  refInputs.forEach((input) => {
    const value_raw = input.value.replace(',', '.');
    const value = parseFloat(value_raw);

    if (isNaN(value) || value < 0) {
      hasInvalidRef = true;
      input.style.borderColor = 'red';
    } else {
      input.style.borderColor = '';
      total_refs_ht += value;
    }
  });

  const resultatElement = document.getElementById('ht_resultat');
  resultatElement.className = '';


  if (hasInvalidRef) {
    const errorMessage = "❌ Certains champs de référence HT contiennent des valeurs invalides. Veuillez corriger avant de calculer.";
    if (htRefError) { // Vérifier htRefError avant d'assigner
      htRefError.textContent = errorMessage; // Afficher l'erreur dans la zone dédiée
    }
    document.getElementById('ht_result-container').style.display = 'none'; // Garder caché si erreur bloquante
    return; // Ne pas procéder au calcul si des références sont invalides et qu'on clique sur Calculer
  }


  const nb_mo_ht = parseInt(document.getElementById('nb_mo_ht').value);
  const remise_diag_ht = document.getElementById('ht_remise_diag').value === 'true';
  const remise_dep_ht = document.getElementById('ht_remise_dep').value === 'true';
  const user_taxes_label_ht = document.getElementById('ht_user_taxes').value;
  const nb_taxes_ht = user_taxes_label_ht === "TVA 10%" ? 1.1 : 1.2;

  const main_oeuvre_ht = +(nb_mo_ht * COUT_MO).toFixed(2);
  const dep_ht = remise_dep_ht ? 0 : COUT_DEP;
  const remise_ht = remise_diag_ht ? REMISE_DIAG_VAL : 0;

  const total_ht_calcul = +(total_refs_ht + main_oeuvre_ht + dep_ht - remise_ht).toFixed(2);

  if (total_ht_calcul < 0) {
    const errorMessage = `⚠️ Le Total HT calculé est négatif (${formatEuro(total_ht_calcul)}). Veuillez ajuster vos références ou paramètres.`;
    if (htRefError) { // Vérifier htRefError avant d'assigner
      htRefError.textContent = errorMessage;
    }
    document.getElementById('ht_result-container').style.display = 'none'; // Garder caché si erreur bloquante
    return; // Ne pas afficher les résultats si le total HT est négatif
  }

  const total_ttc_calcul = +(total_ht_calcul * nb_taxes_ht).toFixed(2);
  const montant_tva_ht = +(total_ttc_calcul - total_ht_calcul).toFixed(2);


  const calculsHT = {
    mainOeuvre: main_oeuvre_ht,
    deplacement: dep_ht,
    remiseValeur: remise_diag_ht ? -REMISE_DIAG_VAL : 0,
    totalHT: total_ht_calcul,
    montantTVA: montant_tva_ht,
    totalTTC: total_ttc_calcul,
    userTaxesLabel: user_taxes_label_ht
  };

  displayResults(calculsHT, 'ht_resultat', 'ht', true); // Afficher les résultats
}

/**
 * Gère l'ajout d'une nouvelle référence HT.
 * Cette fonction est appelée par le bouton "Ajouter une nouvelle référence".
 */
function ht_addRefButtonAction() {
  const refListHT = document.getElementById('ref-list-ht');
  const currentRefInputs = refListHT.querySelectorAll('input[type="number"]').length;

  if (currentRefInputs < 3) {
    createRefHTInput(currentRefInputs + 1); // Crée le champ suivant
    updateHTAddRefButtonVisibility(); // Met à jour la visibilité du bouton
  }
  // S'assurer que le conteneur de résultats est caché après l'ajout d'un nouveau champ
  document.getElementById('ht_result-container').style.display = 'none';
  const htRefError = document.getElementById('ht_ref_error');
  if (htRefError) { // Vérifier htRefError avant de manipuler
    htRefError.textContent = ''; // Réinitialise l'erreur après l'ajout d'un champ
  }
}

// Remplacer l'onclick direct sur le bouton par cet écouteur
document.getElementById('ht_add-ref-btn').addEventListener('click', ht_addRefButtonAction);


// --- Événement de rechargement de la page ---

document.getElementById('reload-widget').addEventListener('click', () => {
  window.location.reload();
});
