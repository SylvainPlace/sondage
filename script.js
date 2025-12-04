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

        // Custom Checkbox Dropdown Structure
        const dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown';
        
        // Bouton principal du dropdown
        const dropdownBtn = document.createElement('button');
        dropdownBtn.className = 'dropdown-btn';
        dropdownBtn.textContent = 'Tous'; // Texte par défaut
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Fermer les autres dropdowns
            document.querySelectorAll('.dropdown-content.show').forEach(el => {
                if (el !== dropdownContent) el.classList.remove('show');
            });
            dropdownContent.classList.toggle('show');
        });

        // Contenu du dropdown (liste de checkboxes)
        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'dropdown-content';

        // Option "Tous" (reset)
        const allOptionDiv = document.createElement('div');
        allOptionDiv.className = 'checkbox-option';
        const allCheckbox = document.createElement('input');
        allCheckbox.type = 'checkbox';
        allCheckbox.id = `filter-${config.key}-all`;
        allCheckbox.checked = true;
        allCheckbox.addEventListener('change', () => {
            if (allCheckbox.checked) {
                // Désélectionner les autres
                dropdownContent.querySelectorAll('input:not(#filter-' + config.key + '-all)').forEach(cb => cb.checked = false);
                updateBtnText();
                updateStats();
            } else {
                // On ne peut pas décocher "Tous" si rien d'autre n'est coché (il faut au moins une sélection)
                // Mais ici on laisse faire, si rien n'est coché => comme si Tous
                const anyChecked = Array.from(dropdownContent.querySelectorAll('input:not(#filter-' + config.key + '-all)')).some(cb => cb.checked);
                if (!anyChecked) allCheckbox.checked = true;
            }
        });
        
        const allLabel = document.createElement('label');
        allLabel.htmlFor = `filter-${config.key}-all`;
        allLabel.textContent = 'Tous';
        
        allOptionDiv.appendChild(allCheckbox);
        allOptionDiv.appendChild(allLabel);
        dropdownContent.appendChild(allOptionDiv);

        // Génération des options dynamiques
        const counts = allData.reduce((acc, item) => {
            const val = item[config.key];
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        uniqueValues.forEach((val, index) => {
            if (val !== undefined && val !== null && val !== '') {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'checkbox-option';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `filter-${config.key}-${index}`;
                checkbox.value = val;
                checkbox.dataset.key = config.key;
                
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        allCheckbox.checked = false;
                    } else {
                        // Si plus rien n'est coché, recocher "Tous"
                        const anyChecked = Array.from(dropdownContent.querySelectorAll('input:not(#filter-' + config.key + '-all)')).some(cb => cb.checked);
                        if (!anyChecked) allCheckbox.checked = true;
                    }
                    updateBtnText();
                    updateStats();
                });

                const optLabel = document.createElement('label');
                optLabel.htmlFor = `filter-${config.key}-${index}`;
                optLabel.textContent = `${val} (${counts[val] || 0})`; // Initial count

                optionDiv.appendChild(checkbox);
                optionDiv.appendChild(optLabel);
                dropdownContent.appendChild(optionDiv);
            }
        });

        function updateBtnText() {
            const checked = Array.from(dropdownContent.querySelectorAll('input:not(#filter-' + config.key + '-all):checked'));
            if (checked.length === 0) {
                dropdownBtn.textContent = 'Tous';
                allCheckbox.checked = true;
            } else if (checked.length === 1) {
                dropdownBtn.textContent = checked[0].value;
            } else {
                dropdownBtn.textContent = `${checked.length} sélectionnés`;
            }
        }

        dropdown.appendChild(dropdownBtn);
        dropdown.appendChild(dropdownContent);
        group.appendChild(label);
        group.appendChild(dropdown);
        container.appendChild(group);
    });

    // Fermer les dropdowns au clic ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.dropdown-content.show').forEach(el => el.classList.remove('show'));
        }
    });
}

function resetFilters() {
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const allCheckbox = dropdown.querySelector('input[id$="-all"]');
        if (allCheckbox) {
            allCheckbox.checked = true;
            // Déclencher l'event manuellement ou resetter les autres
            dropdown.querySelectorAll('input:not([id$="-all"])').forEach(cb => cb.checked = false);
            // Update text btn
            const btn = dropdown.querySelector('.dropdown-btn');
            if (btn) btn.textContent = 'Tous';
        }
    });
    updateStats();
}

function updateStats() {
    // 1. Récupérer les valeurs des filtres
    const activeFilters = {};
    
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const checkboxes = Array.from(dropdown.querySelectorAll('input:checked:not([id$="-all"])'));
        if (checkboxes.length > 0) {
            // On récupère la clé depuis le dataset du premier checkbox coché (ou via un attribut sur le dropdown)
            // Ici on va tricher un peu et regarder l'ID ou ajouter un data-key sur le container
            const key = checkboxes[0].dataset.key;
            if (key) {
                activeFilters[key] = checkboxes.map(cb => cb.value);
            }
        }
    });

    // 2. Filtrer les données
    const filteredData = allData.filter(item => {
        for (const key in activeFilters) {
            const filterValues = activeFilters[key];
            const itemValue = String(item[key]);
            if (!filterValues.some(val => String(val) === itemValue)) {
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
    updateFilterCounters(filteredData, activeFilters); // Mise à jour dynamique des compteurs
}

function updateFilterCounters(filteredData, activeFilters) {
    filtersConfig.forEach(config => {
        const select = document.querySelector(`select[name="${config.key}"]`);
        if (!select) return;

        // Si ce filtre est celui qui vient d'être modifié, on garde ses options intactes (sauf si on veut tout recalculer)
        // Mais pour une UX correcte "facettes", on recalcule généralement tout SAUF le filtre courant pour voir l'impact
        // Ici, on va recalculer les counts basés sur les AUTRES filtres actifs.
        
        // 1. Créer un dataset temporaire filtré par tous les filtres SAUF celui en cours (config.key)
        const contextFilters = { ...activeFilters };
        delete contextFilters[config.key];

        const contextData = allData.filter(item => {
            for (const key in contextFilters) {
                const filterValues = contextFilters[key]; // Tableau des valeurs acceptées
                const itemValue = String(item[key]);
                // Si la valeur de l'item ne correspond à AUCUNE des valeurs sélectionnées pour ce filtre
                if (!filterValues.some(val => String(val) === itemValue)) {
                    return false;
                }
            }
            return true;
        });

        // 2. Compter les occurrences dans ce contexte
        const counts = contextData.reduce((acc, item) => {
            const val = item[config.key];
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        // 3. Mettre à jour les labels des options
        Array.from(select.options).forEach(option => {
            if (option.value === '') return; // On ne touche pas à "Tous"
            const count = counts[option.value] || 0;
            option.textContent = `${option.value} (${count})`;
        });
    });
}

// Fonction utilitaire pour convertir les strings de salaire en nombre approximatif
function parseSalaryRange(rangeStr) {
    if (!rangeStr) return 0;
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
