function formatEuro(val) {
  return val.toFixed(2).replace('.', ',') + ' €';
}

let ref_article = 0;
let ref_article_parts = [];

document.addEventListener('DOMContentLoaded', () => {
  const selectMO = document.getElementById('nb_mo');
  for (let i = 1; i <= 14; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    selectMO.appendChild(option);
  }

  document.getElementById('remise_diag').value = 'false';
  document.getElementById('remise_dep').value = 'false';
});

function calculer() {
const prix_ttc_raw = document.getElementById('prix_ttc').value.replace(',', '.');
const prix_ttc = parseFloat(prix_ttc_raw);
  const nb_mo = parseInt(document.getElementById('nb_mo').value);
  const remise_diag = document.getElementById('remise_diag').value === 'true';
  const remise_dep = document.getElementById('remise_dep').value === 'true';
  const user_taxes = document.getElementById('user_taxes').value;

// 🔁 Réinitialise l'état d'alerte
document.getElementById('resultat').className = '';

  const nb_taxes = user_taxes === "TVA 10%" ? 1.1 : 1.2;
  const mo = 54.54;
  const dep = remise_dep ? 0 : 45.45;
  const remise = remise_diag ? 90 : 0;
  const main_oeuvre = +(nb_mo * mo).toFixed(2);
  const test_ttc = +((main_oeuvre + dep) * nb_taxes).toFixed(2);

    if (isNaN(prix_ttc)) {
        const resultat = document.getElementById('resultat');
        resultat.textContent = "❌ Merci de renseigner un prix TTC avant de lancer le calcul.";
        resultat.className = 'alert-error';
        document.getElementById('result-container').style.display = 'block';
        document.getElementById('extra-reference').style.display = 'none';
        return;
    }


  if (test_ttc > prix_ttc) {
        const messageErreur = `⚠️ ${nb_mo} heure(s) de main d'oeuvre et le déplacement représentent au moins ${formatEuro(test_ttc)} TTC.
Merci de vérifier votre saisie.`;

        const resultat = document.getElementById('resultat');
        resultat.textContent = messageErreur;
        resultat.className = 'alert-error'; // Ajoute la classe rouge ici

        document.getElementById('result-container').style.display = 'block';
        document.getElementById('extra-reference').style.display = 'none';
        return;
    }

  const total_ht = +(prix_ttc / nb_taxes).toFixed(2);
  ref_article = +(total_ht + remise - (main_oeuvre + dep)).toFixed(2);
  ref_article_parts = [];

  document.getElementById('extra-reference').style.display = 'block';
  document.getElementById('add-ref-btn').style.display = 'inline-block';
  document.getElementById('ref-input-zone').style.display = 'none';
  document.getElementById('result-container').style.display = 'block';

  imprimerResultats();
}

function imprimerResultats() {
    const prix_ttc = parseFloat(document.getElementById('prix_ttc').value.replace(',', '.'));
    const nb_mo = parseInt(document.getElementById('nb_mo').value);
    const remise_diag = document.getElementById('remise_diag').value === 'true';
    const remise_dep = document.getElementById('remise_dep').value === 'true';
    const user_taxes = document.getElementById('user_taxes').value;

    const nb_taxes = user_taxes === "TVA 10%" ? 1.1 : 1.2;
    const mo = 54.54;
    const dep = remise_dep ? 0 : 45.45;
    const remise = remise_diag ? 90 : 0;

    const main_oeuvre = +(nb_mo * mo).toFixed(2);
    const total_ht = +(prix_ttc / nb_taxes).toFixed(2);
    const montant_tva = +(prix_ttc - total_ht).toFixed(2);

    const resultatContainer = document.getElementById('resultat');
    resultatContainer.innerHTML = ''; // Vider le conteneur

    const ol = document.createElement('ol');

    function createLine(titre, valeur) {
        const li = document.createElement('li');
        const h5 = document.createElement('h5');
        const span = document.createElement('span');

        h5.textContent = titre;
        span.textContent = valeur;

        li.appendChild(h5);
        li.appendChild(span);
        return li;
    }

    if (ref_article_parts.length === 0) {
        ol.appendChild(createLine('Référence article :', formatEuro(ref_article) + ' HT'));
    } else {
        let total_parts = 0;
        for (let i = 0; i < ref_article_parts.length; i++) {
            const label = `Référence article ${i + 2} :`;
            const value = formatEuro(ref_article_parts[i]) + ' HT';
            ol.appendChild(createLine(label, value));
            total_parts += ref_article_parts[i];
        }
        const ref1 = +(ref_article - total_parts).toFixed(2);
        ol.insertBefore(createLine('Référence article 1 :', formatEuro(ref1) + ' HT'), ol.firstChild);
    }

    ol.appendChild(createLine('Main d’œuvre :', formatEuro(main_oeuvre) + ' HT'));
    ol.appendChild(createLine('Déplacement :', formatEuro(dep) + ' HT'));
    ol.appendChild(createLine('Remise :', remise_diag ? "-90,00 € HT" : "0"));
    ol.appendChild(createLine('Total HT :', formatEuro(total_ht)));
    ol.appendChild(createLine(user_taxes + ' :', formatEuro(montant_tva)));
    ol.appendChild(createLine('Total TTC :', formatEuro(prix_ttc)));

    resultatContainer.appendChild(ol);
}


function afficherInputReference() {
  document.getElementById('ref_input_value').value = '';
  document.getElementById('ref_error').textContent = '';
  document.getElementById('ref-input-zone').style.display = 'block';
}

function confirmerNouvelleReference() {
  const inputVal = parseFloat(document.getElementById('ref_input_value').value.replace(',', '.'));
  const refError = document.getElementById('ref_error');
  if (isNaN(inputVal)) {
    refError.textContent = "Veuillez saisir un prix valide.";
    return;
  }

  const reste_disponible = ref_article - ref_article_parts.reduce((a, b) => a + b, 0);

  if (inputVal > reste_disponible - 0.01) {
    refError.textContent = `Le prix de cette référence ne peut pas être vendu plus de ${formatEuro(reste_disponible - 0.01)}.`;
    return;
  }

  ref_article_parts.push(+inputVal.toFixed(2));
  document.getElementById('ref-input-zone').style.display = 'none';
  refError.textContent = '';

  if (ref_article_parts.length >= 2) {
    document.getElementById('add-ref-btn').style.display = 'none';
  }

  imprimerResultats();
}

document.getElementById('reload-widget').addEventListener('click', () => {
    window.location.reload();
});
