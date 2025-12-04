let allData = [];

// Configuration des champs à filtrer
// label: Texte affiché, key: clé dans le JSON
const filtersConfig = [
    { label: 'Année de Diplôme', key: 'annee_diplome' },
    { label: 'Sexe', key: 'sexe' },
    { label: 'Secteur d\'activité', key: 'secteur' },
    { label: 'Type de structure', key: 'type_structure' },
    { label: 'Département', key: 'departement' }
];

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
});

async function fetchData() {
    try {
        const response = await fetch('data.json');
        allData = await response.json();
        initFilters();
        updateStats();
    } catch (error) {
        console.error('Erreur chargement données:', error);
        alert("Impossible de charger les données du sondage.");
    }
}

function initFilters() {
    const container = document.getElementById('filters-container');
    container.innerHTML = '';

    filtersConfig.forEach(config => {
        const uniqueValues = [...new Set(allData.map(item => item[config.key]))].sort();
        
        const group = document.createElement('div');
        group.className = 'filter-group';

        const label = document.createElement('label');
        label.textContent = config.label;
        
        const select = document.createElement('select');
        select.name = config.key;
        select.addEventListener('change', updateStats);

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Tous';
        select.appendChild(defaultOption);

        uniqueValues.forEach(val => {
            if (val !== undefined && val !== null && val !== '') {
                const option = document.createElement('option');
                option.value = val;
                option.textContent = val;
                select.appendChild(option);
            }
        });

        group.appendChild(label);
        group.appendChild(select);
        container.appendChild(group);
    });
}

function resetFilters() {
    const selects = document.querySelectorAll('#filters-container select');
    selects.forEach(s => s.value = '');
    updateStats();
}

function updateStats() {
    // 1. Récupérer les valeurs des filtres
    const activeFilters = {};
    document.querySelectorAll('#filters-container select').forEach(s => {
        if (s.value) activeFilters[s.name] = s.value;
    });

    // 2. Filtrer les données
    const filteredData = allData.filter(item => {
        for (const key in activeFilters) {
            // Comparaison souple (String vs Number)
            if (String(item[key]) !== String(activeFilters[key])) {
                return false;
            }
        }
        return true;
    });

    // 3. Calculs
    const count = filteredData.length;
    const salaires = filteredData.map(d => d.salaire_brut).sort((a, b) => a - b);
    
    let mean = 0;
    let median = 0;

    if (count > 0) {
        // Moyenne
        const sum = salaires.reduce((acc, val) => acc + val, 0);
        mean = Math.round(sum / count);

        // Médiane
        const mid = Math.floor(count / 2);
        if (count % 2 !== 0) {
            median = salaires[mid];
        } else {
            median = Math.round((salaires[mid - 1] + salaires[mid]) / 2);
        }
    }

    // 4. Mise à jour du DOM
    document.getElementById('count').textContent = count;
    document.getElementById('avg-salary').textContent = count > 0 ? formatMoney(mean) : '- €';
    document.getElementById('median-salary').textContent = count > 0 ? formatMoney(median) : '- €';

    updateAnecdotes(filteredData);
}

function updateAnecdotes(data) {
    const list = document.getElementById('anecdotes-list');
    list.innerHTML = '';

    // On ne garde que les items avec un conseil/anecdote
    const withConseil = data.filter(d => d.conseil && d.conseil.trim() !== '');

    if (withConseil.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted)">Aucun commentaire pour cette sélection.</p>';
        return;
    }

    withConseil.forEach(item => {
        const card = document.createElement('div');
        card.className = 'anecdote-card';
        
        const p = document.createElement('p');
        p.textContent = `"${item.conseil}"`;
        
        const meta = document.createElement('div');
        meta.className = 'anecdote-meta';
        meta.textContent = `${item.poste} - ${item.secteur} (${item.experience} ans exp.)`;

        card.appendChild(p);
        card.appendChild(meta);
        list.appendChild(card);
    });
}

function formatMoney(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}
