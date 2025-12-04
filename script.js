let allData = [];
let salaryChart = null;

// Configuration des champs à filtrer
// label: Texte affiché, key: clé dans le JSON
const filtersConfig = [
    { label: 'Année de Diplôme', key: 'annee_diplome' },
    { label: 'Sexe', key: 'sexe' },
    { label: 'Expérience', key: 'xp_group' },
    { label: 'Secteur d\'activité', key: 'secteur' },
    { label: 'Type de structure', key: 'type_structure' },
    { label: 'Département', key: 'departement' }
];

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    
    // Scroll to top logic
    const scrollTopBtn = document.getElementById('scroll-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

async function fetchData() {
    try {
        const response = await fetch('data.json');
        const rawData = await response.json();
        
        // Pré-traitement des données (création de groupes)
        allData = rawData.map(item => {
            return {
                ...item,
                xp_group: getXpGroup(item.experience)
            };
        });

        initFilters();
        updateStats();
    } catch (error) {
        console.error('Erreur chargement données:', error);
        alert("Impossible de charger les données du sondage.");
    }
}

function getXpGroup(years) {
    const xp = parseInt(years);
    if (isNaN(xp)) return 'Non renseigné';
    if (xp <= 1) return '0-1 an';
    if (xp <= 3) return '2-3 ans';
    if (xp <= 5) return '4-5 ans';
    if (xp <= 9) return '6-9 ans';
    return '10+ ans';
}

function initFilters() {
    const container = document.getElementById('filters-container');
    container.innerHTML = '';

    filtersConfig.forEach(config => {
        const uniqueValues = [...new Set(allData.map(item => item[config.key]))]
            .sort((a, b) => {
                // Tri spécifique pour les groupes d'expérience
                if (config.key === 'xp_group') {
                    const order = ['0-1 an', '2-3 ans', '4-5 ans', '6-9 ans', '10+ ans', 'Non renseigné'];
                    return order.indexOf(a) - order.indexOf(b);
                }

                // Tri numérique si possible, sinon alphabétique
                return !isNaN(a) && !isNaN(b) ? a - b : String(a).localeCompare(String(b));
            });
        
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

        // Calcul des occurrences pour chaque valeur
        const counts = allData.reduce((acc, item) => {
            const val = item[config.key];
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        uniqueValues.forEach(val => {
            if (val !== undefined && val !== null && val !== '') {
                const option = document.createElement('option');
                option.value = val;
                option.textContent = `${val} (${counts[val] || 0})`;
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
    
    // Conversion des plages de salaire en nombre (valeur médiane) pour le calcul de la moyenne
    const salairesNumeriques = filteredData.map(d => parseSalaryRange(d.salaire_brut)).filter(val => val > 0).sort((a, b) => a - b);
    
    let mean = 0;
    let median = 0;

    if (salairesNumeriques.length > 0) {
        // Moyenne
        const sum = salairesNumeriques.reduce((acc, val) => acc + val, 0);
        mean = Math.round(sum / salairesNumeriques.length);

        // Médiane
        const mid = Math.floor(salairesNumeriques.length / 2);
        if (salairesNumeriques.length % 2 !== 0) {
            median = salairesNumeriques[mid];
        } else {
            median = Math.round((salairesNumeriques[mid - 1] + salairesNumeriques[mid]) / 2);
        }
    }

    // 4. Mise à jour du DOM
    if (count === 0) {
        document.getElementById('no-results').style.display = 'block';
        document.getElementById('results-content').style.display = 'none';
    } else {
        document.getElementById('no-results').style.display = 'none';
        document.getElementById('results-content').style.display = 'block';
    }

    document.getElementById('count').textContent = count;
    document.getElementById('avg-salary').textContent = salairesNumeriques.length > 0 ? formatMoney(mean) : '- €';
    document.getElementById('median-salary').textContent = salairesNumeriques.length > 0 ? formatMoney(median) : '- €';

    updateChart(filteredData); // On passe les données brutes pour compter par catégories
    updateBenefits(filteredData);
    updateAnecdotes(filteredData);
}

// Fonction utilitaire pour convertir les strings de salaire en nombre approximatif
function parseSalaryRange(rangeStr) {
    if (!rangeStr) return 0;
    // Nettoyage aggressif : 
    // 1. Remplace les 'o' par '0' (typo 1OOk)
    // 2. Supprime les espaces
    // 3. Remplace les tirets longs (–, —) par un tiret court (-)
    // 4. Met en minuscule
    const cleanStr = rangeStr.toLowerCase()
        .replace(/o/g, '0')
        .replace(/\s/g, '')
        .replace(/[–—]/g, '-') // Gère les tirets longs (en dash / em dash)
        .replace('—', '-');    // Double sécurité
    
    if (cleanStr.includes('moinsde30')) return 29000;// valeur random, pour les calculs de moyenne/médiane
    if (cleanStr.includes('plusde100')) return 101000;// valeur random, pour les calculs de moyenne/médiane

    // Format "30-35k€" -> extraction des nombres
    const matches = cleanStr.match(/(\d+)-(\d+)/);
    if (matches) {
        const min = parseInt(matches[1]) * 1000;
        const max = parseInt(matches[2]) * 1000;
        return (min + max) / 2;
    }
    
    return 0;
}

function updateChart(data) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    
    if (salaryChart) {
        salaryChart.destroy();
    }

    if (data.length === 0) return;

    // Définition de l'ordre officiel des catégories
    const categories = [
        'Moins de 30k€',
        '30-35k€',
        '35-40k€',
        '40-45k€',
        '45-50k€',
        '50-60k€',
        '60-70k€',
        '70-80k€',
        '80-90k€',
        '90-100k€',
        'Plus de 100k€'
    ];

    // Comptage par catégorie
    const counts = categories.map(cat => {
        return data.filter(d => {
            // Normalisation simple : minuscules, sans espaces, tirets standardisés
            const normalize = (str) => {
                if (!str) return '';
                return str.toLowerCase()
                    .replace(/\s/g, '')       // Supprime les espaces
                    .replace(/[–—]/g, '-');   // Standardise les tirets
            };

            const dClean = normalize(d.salaire_brut);
            const catClean = normalize(cat);
            
            return dClean === catClean;
        }).length;
    });

    salaryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Nombre d\'alumni',
                data: counts,
                backgroundColor: '#2563eb',
                borderRadius: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: (items) => `Tranche : ${items[0].label}`,
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateBenefits(data) {
    const list = document.getElementById('benefits-list');
    list.innerHTML = '';
    
    const count = data.length;
    if (count === 0) {
        list.innerHTML = '<p style="color:var(--text-muted)">Pas de données.</p>';
        return;
    }

    const keywords = [
        { label: 'Télétravail', terms: ['télétravail', 'teletravail', 'remote'] },
        { label: 'Tickets Resto', terms: ['ticket', 'restaurant', 'tr', 'panier'] },
        { label: 'Voiture', terms: ['voiture', 'véhicule'] },
        { label: 'RTT / Congés', terms: ['rtt', 'congés', 'vacances'] },
        { label: 'Intéressement', terms: ['intéressement', 'participation', 'interessement'] }
    ];

    const stats = keywords.map(k => {
        const matchCount = data.filter(d => {
            if (!d.avantages) return false;
            const text = d.avantages.toLowerCase();
            return k.terms.some(term => text.includes(term));
        }).length;
        
        return { label: k.label, percentage: Math.round((matchCount / count) * 100) };
    });

    // Trier par pourcentage décroissant
    stats.sort((a, b) => b.percentage - a.percentage);

    stats.forEach(stat => {
        if (stat.percentage > 0) {
            const row = document.createElement('div');
            row.className = 'benefit-row';
            
            const info = document.createElement('div');
            info.className = 'benefit-info';
            info.innerHTML = `<span>${stat.label}</span><span>${stat.percentage}%</span>`;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'benefit-bar-bg';
            
            const bar = document.createElement('div');
            bar.className = 'benefit-bar-fill';
            bar.style.width = `${stat.percentage}%`;
            
            barContainer.appendChild(bar);
            row.appendChild(info);
            row.appendChild(barContainer);
            list.appendChild(row);
        }
    });
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
