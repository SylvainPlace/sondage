import { initFilters, resetFilters, getActiveFilters, updateFilterCounters } from './filters.js';
import { updateChart, updateBenefits, updateAnecdotes } from './charts.js';
import { parseSalaryRange, parsePrime, formatMoney, getXpGroup } from './utils.js';

// Configuration API (Worker Cloudflare)
const API_URL = 'https://sondage-api.sy-vain001.workers.dev/'; 
// Exemple : 'https://sondage-api.votre-nom.workers.dev'

const MAPPING = {
    "annee_diplome": "Année de diplôme",
    "sexe": "Sexe",
    "departement": "Département actuel de travail",
    "secteur": "Secteur d’activité",
    "type_structure": "Type de structure",
    "poste": "Poste actuel",
    "experience": "Nombre d’années d’expérience (depuis le diplôme)",
    "salaire_brut": "Salaire brut annuel actuel (hors primes)",
    "primes": "Primes / variable annuel",
    "avantages": "Avantages particuliers (optionnel)",
    "conseil": "Un conseil, un retour d’expérience, une anecdote ? (facultatif)"
};

let allData = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    document.getElementById('reset-filters').addEventListener('click', () => resetFilters(updateStats));
    
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
        let rawData = [];
        
        // Si l'URL n'est pas encore configurée, on utilise le fichier local (fallback)
        if (API_URL.includes('REMPLACER_PAR')) {
            console.warn('URL API non configurée, chargement de data.json');
            const response = await fetch('data.json');
            rawData = await response.json();
            
            // Le format local est déjà le bon, pas besoin de transformation complexe
            allData = rawData.map(item => ({
                ...item,
                xp_group: getXpGroup(item.experience)
            }));
            
        } else {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Erreur API Worker');
            }
            
            const result = await response.json();
            if (!result.values || result.values.length < 2) {
                throw new Error('Aucune donnée trouvée dans le sheet');
            }

            // Transformation des données API (Tableau de tableaux) vers JSON (Tableau d'objets)
            const headers = result.values[0];
            const rows = result.values.slice(1);
            
            // Création d'un index des colonnes "Titre" => Index
            const headerMap = {};
            headers.forEach((h, i) => headerMap[h] = i);

            allData = rows.map(row => {
                const item = {};
                for (const [jsonKey, sheetColumnName] of Object.entries(MAPPING)) {
                    // Recherche de la colonne correspondante (correspondance exacte ou partielle)
                    let colIndex = headerMap[sheetColumnName];
                    
                    if (colIndex === undefined) {
                        // Fallback : recherche partielle
                        const foundHeader = headers.find(h => h.includes(sheetColumnName));
                        if (foundHeader) colIndex = headerMap[foundHeader];
                    }

                    if (colIndex !== undefined && row[colIndex] !== undefined) {
                        let value = row[colIndex];
                         // Nettoyage spécifique selon le type attendu
                        if (jsonKey === 'experience' || jsonKey === 'annee_diplome') {
                            item[jsonKey] = Number(value) || 0;
                        } else {
                            item[jsonKey] = String(value).trim();
                        }
                    } else {
                        item[jsonKey] = ""; // Valeur par défaut
                    }
                }
                // Ajout du champ calculé xp_group
                item.xp_group = getXpGroup(item.experience);
                return item;
            });
        }

        initFilters(allData, updateStats);
        updateStats();
    } catch (error) {
        console.error('Erreur chargement données:', error);
        // Fallback silencieux sur data.json en cas d'erreur de l'API (optionnel)
        try {
            console.log('Tentative de repli sur data.json...');
            const response = await fetch('data.json');
            const localData = await response.json();
            allData = localData.map(item => ({...item, xp_group: getXpGroup(item.experience)}));
            initFilters(allData, updateStats);
            updateStats();
        } catch (e) {
            alert("Impossible de charger les données (ni API ni local). Détail: " + error.message);
        }
    }
}

function updateStats() {
    // 1. Récupérer les valeurs des filtres
    const activeFilters = getActiveFilters();

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
    
    const salairesNumeriques = filteredData.map(d => parseSalaryRange(d.salaire_brut)).filter(val => val > 0).sort((a, b) => a - b);
    
    const salairesTotaux = filteredData.map(d => {
        const base = parseSalaryRange(d.salaire_brut);
        if (base === 0) return 0;
        const prime = parsePrime(d.primes);
        return base + prime;
    }).filter(val => val > 0).sort((a, b) => a - b);

    let mean = 0;
    let median = 0;
    let meanTotal = 0;
    let medianTotal = 0;

    if (salairesNumeriques.length > 0) {
        const sum = salairesNumeriques.reduce((acc, val) => acc + val, 0);
        mean = Math.round(sum / salairesNumeriques.length);

        const mid = Math.floor(salairesNumeriques.length / 2);
        if (salairesNumeriques.length % 2 !== 0) {
            median = salairesNumeriques[mid];
        } else {
            median = Math.round((salairesNumeriques[mid - 1] + salairesNumeriques[mid]) / 2);
        }
    }

    if (salairesTotaux.length > 0) {
        const sumTotal = salairesTotaux.reduce((acc, val) => acc + val, 0);
        meanTotal = Math.round(sumTotal / salairesTotaux.length);

        const midTotal = Math.floor(salairesTotaux.length / 2);
        if (salairesTotaux.length % 2 !== 0) {
            medianTotal = salairesTotaux[midTotal];
        } else {
            medianTotal = Math.round((salairesTotaux[midTotal - 1] + salairesTotaux[midTotal]) / 2);
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
    document.getElementById('avg-salary-total').textContent = salairesTotaux.length > 0 ? formatMoney(meanTotal) : '- €';
    document.getElementById('median-salary-total').textContent = salairesTotaux.length > 0 ? formatMoney(medianTotal) : '- €';

    updateChart(filteredData);
    updateBenefits(filteredData);
    updateAnecdotes(filteredData);
    updateFilterCounters(allData, activeFilters);
}
