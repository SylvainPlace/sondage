import { initFilters, resetFilters, getActiveFilters, updateFilterCounters } from './filters.js';
import { updateChart, updateXpChart, updateBenefits, updateAnecdotes } from './charts.js';
import { updateMap, setMapMode } from './map.js';
import { parseSalaryRange, parsePrime, formatMoney, getXpGroup } from './utils.js';
import { initAuth } from './auth.js';

// Configuration API (Worker Cloudflare)
const API_URL = 'https://sondage-api.sy-vain001.workers.dev/'; 

let allData = [];

document.addEventListener('DOMContentLoaded', () => {
    initAuth(API_URL, (token) => fetchData(token));
    
    document.getElementById('reset-filters').addEventListener('click', () => resetFilters(updateStats));
    
    // Map toggle listener
    const mapToggle = document.getElementById('map-mode-select');
    if (mapToggle) {
        mapToggle.addEventListener('change', (e) => {
            setMapMode(e.target.value);
        });
    }

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

async function fetchData(token) {
    const loader = document.getElementById('loader');
    const resultsContent = document.getElementById('results-content');
    const noResults = document.getElementById('no-results');

    try {
        let rawData = [];
        
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Invalid token, re-auth
                localStorage.removeItem('auth_token');
                location.reload();
                return;
            }
            const err = await response.json();
            throw new Error(err.error || 'Erreur API Worker');
        }
        
        // Le backend renvoie maintenant directement le JSON formaté
        rawData = await response.json();

        // Ajout du champ calculé xp_group côté client (UI logic)
        allData = rawData.map(item => ({
            ...item,
            xp_group: getXpGroup(item.experience)
        }));

        initFilters(allData, updateStats);
        updateStats();

        // Hide loader and show content
        loader.style.display = 'none';
        resultsContent.style.display = 'block';

    } catch (error) {
        console.error('Erreur chargement données:', error);
        loader.innerHTML = `<div style="color: red; text-align: center;">
            <p style="font-size: 2rem; margin-bottom: 1rem;">⚠️</p>
            <p>Impossible de charger les données.</p>
            <p style="font-size: 0.875rem; margin-top: 0.5rem;">${error.message}</p>
        </div>`;
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
    updateXpChart(filteredData);
    updateBenefits(filteredData);
    
    const hasActiveFilters = Object.keys(activeFilters).length > 0;
    updateAnecdotes(filteredData, hasActiveFilters);
    
    updateMap(filteredData);
    updateFilterCounters(allData, activeFilters);
}
