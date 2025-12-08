import { parseSalaryRange, parsePrime } from './utils.js';

let salaryChart = null;
let xpChart = null;

export function updateChart(data) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    
    if (salaryChart) {
        salaryChart.destroy();
    }

    if (data.length === 0) return;

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

    const counts = categories.map(cat => {
        return data.filter(d => {
            const normalize = (str) => {
                if (!str) return '';
                return str.toLowerCase()
                    .replace(/\s/g, '')
                    .replace(/[–—]/g, '-');
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
                backgroundColor: '#be9249',
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

export function updateXpChart(data) {
    const ctx = document.getElementById('xpChart').getContext('2d');
    
    if (xpChart) {
        xpChart.destroy();
    }

    if (data.length === 0) return;

    // 1. Group data by exact year of experience (Granular)
    const xpMap = {};
    let maxXp = 0;

    data.forEach(item => {
        const xp = parseInt(item.experience);
        if (!isNaN(xp)) {
            if (xp > maxXp) maxXp = xp;
            if (!xpMap[xp]) xpMap[xp] = { base: [], total: [] };
            
            const base = parseSalaryRange(item.salaire_brut);
            const prime = parsePrime(item.primes);
            
            if (base > 0) {
                xpMap[xp].base.push(base);
                xpMap[xp].total.push(base + prime);
            }
        }
    });

    // Create labels 0 to Max
    const labels = [];
    for (let i = 0; i <= maxXp; i++) labels.push(i);

    // 2. Calculate Metrics (Mean/Median)
    const getStats = (arr) => {
        if (!arr || arr.length === 0) return null; // Return null to break line instead of 0
        
        // Mean
        const sum = arr.reduce((a, b) => a + b, 0);
        const mean = Math.round(sum / arr.length);

        // Median
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

        return { mean, median };
    };

    const meanBaseData = [];
    const medianBaseData = [];
    const meanTotalData = [];
    const medianTotalData = [];

    labels.forEach(year => {
        const group = xpMap[year];
        if (group) {
            const baseStats = getStats(group.base);
            const totalStats = getStats(group.total);

            meanBaseData.push(baseStats ? baseStats.mean : null);
            medianBaseData.push(baseStats ? baseStats.median : null);
            meanTotalData.push(totalStats ? totalStats.mean : null);
            medianTotalData.push(totalStats ? totalStats.median : null);
        } else {
            meanBaseData.push(null);
            medianBaseData.push(null);
            meanTotalData.push(null);
            medianTotalData.push(null);
        }
    });

    // 3. Configure Chart
    xpChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(l => l + ' ans'),
            datasets: [
                {
                    label: 'Moyen (Base)',
                    data: meanBaseData,
                    borderColor: '#3b82f6', // Blue
                    backgroundColor: '#3b82f6',
                    borderWidth: 2,
                    tension: 0.3,
                    spanGaps: true
                },
                {
                    label: 'Médian (Base)',
                    data: medianBaseData,
                    borderColor: '#3b82f6',
                    backgroundColor: '#3b82f6',
                    borderWidth: 2,
                    borderDash: [5, 5], // Dashed
                    tension: 0.3,
                    spanGaps: true
                },
                {
                    label: 'Moyen (Total)',
                    data: meanTotalData,
                    borderColor: '#be9249', // Primary Gold
                    backgroundColor: '#be9249',
                    borderWidth: 2,
                    tension: 0.3,
                    spanGaps: true
                },
                {
                    label: 'Médian (Total)',
                    data: medianTotalData,
                    borderColor: '#be9249',
                    backgroundColor: '#be9249',
                    borderWidth: 2,
                    borderDash: [5, 5], // Dashed
                    tension: 0.3,
                    spanGaps: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            if (context.raw === null) return null;
                            return `${context.dataset.label}: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 30000,
                    ticks: {
                        callback: function(value) {
                            return value / 1000 + 'k€';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Années d\'expérience'
                    }
                }
            }
        }
    });
}

export function updateBenefits(data) {
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

export function updateAnecdotes(data) {
    const list = document.getElementById('anecdotes-list');
    list.innerHTML = '';

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
