// Registry to keep track of chart instances
const chartsRegistry = {
    cheatRateRegionsChart: null,
    regionsChart: null,
    hourlyDistributionChart: null,
    nationalCheatRateChart: null,
    provinceCheatRateChart: null,
    centerCheatRateChart: null,
    sessionCheatRateChart: null,
    examenCheatRateChart: null
};

// Global statistics data structure
const statsData = {
    // Summary data
    summaryData: {
        yellow: 0,  // Risque potentiel
        orange: 0,  // Risque annoté
        red: 0,     // Risque vérifié
        gray: 0,    // Fausse alerte
        total: 0
    },
    
    // Region data
    regionData: [],
    
    // Time of day data
    timeOfDayData: {
        morning: 0,   // 6am-12pm
        afternoon: 0, // 12pm-6pm
        evening: 0,   // 6pm-12am
        night: 0      // 12am-6am
    },
    
    // Communication types data
    communicationTypesData: {
        vocal: {  // GSM
            yellow: 0,
            orange: 0,
            red: 0
        },
        data: {  // Appel Vocal
            yellow: 0,
            orange: 0,
            red: 0
        },
        whatsapp: {  // Appel WhatsApp
            yellow: 0,
            orange: 0,
            red: 0
        }
    },
    
    // Hourly distribution data
    hourlyDistributionData: [],
    
    // Day of week data
    dayOfWeekData: [],
    
    // Provinces data
    provincesData: [],
    
    // Exam centers data
    examCentersData: [],
    
    // Subject warnings data
    subjectWarningsData: [],
    
    // Communication distribution data
    communicationDistributionData: {
        vocal: 0,  // GSM
        data: 0,   // Appel Vocal
        whatsapp: 0 // Appel WhatsApp
    },
    
    // Operateur distribution data
    operateurDistributionData: {},
    
    // Verifiers data
    verifiersData: [],
    
    // Cheat rate data
    cheatRateData: {
        byRegion: [],
        nationalOverTime: [],
        byProvince: [],
        byCenter: [],
        hourlyDistribution: [],
        session: [],
        examen: []
    },
    
    // Detailed temporal data for multi-day ranges
    detailedTemporalData: [],
    detailedCheatRateData: [],
    
    // Hourly distribution by region data
    hourlyDistributionByRegion: [],
    
    // Hourly cheat rate distribution by region data
    hourlyCheatRateByRegion: []
};


// Set to track processed analysis IDs
const processedAnalysisIds = new Set();

// Fetch real data from the API (now uses global cache)
async function fetchRealData(startDate = null, endDate = null) {
    try {
        
        
        // Check if this is just a filter change or initial load
        const isInitialLoad = !GlobalDataCache.isInitialized;
        
        if (isInitialLoad) {
            // Initial load - use global cache initialization
            const success = await GlobalDataCache.initialize();
            if (!success) {
                throw new Error('Failed to initialize global cache');
            }
        } else if (startDate || endDate) {
            // Filter change - refresh with new filters
            await GlobalDataCache.refreshWithFilters();
        }
        
        // Build URL with optional date parameters for statistics API
        let url = '/api/statistics';
        if (startDate || endDate) {
            const params = new URLSearchParams();
            
            if (startDate) {
                params.append('start_time', formatDateForAPI(startDate));
            }
            
            if (endDate) {
                // To make the end date inclusive, set the time to 23:59:59
                const inclusiveEndDate = new Date(endDate);
                if (inclusiveEndDate.getHours() === 0 && inclusiveEndDate.getMinutes() === 0) {
                    // If time is 00:00, set to end of day
                    inclusiveEndDate.setHours(23, 59, 59);
                }
                params.append('end_time', formatDateForAPI(inclusiveEndDate));
            }
            
            url += '?' + params.toString();
        }
        
        // Fetch statistics data from API (this is different from the cached analysis data)
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        // Parse response
        const data = await response.json();
        
        // Reset stats data
        resetStatsData();
        
        // Update statsData with real data
        // Summary data
        statsData.summaryData = data.summaryData || {
            yellow: 0,
            orange: 0,
            red: 0,
            gray: 0,
            total: 0
        };
        
        // Region data
        statsData.regionData = data.regionData || [];
        
        // Communication types data
        statsData.communicationTypesData = data.communicationTypesData || {
            vocal: {
                yellow: 0,
                orange: 0,
                red: 0
            },
            data: {
                yellow: 0,
                orange: 0,
                red: 0
            }
        };
        
        // Hourly distribution data
        statsData.hourlyDistributionData = data.hourlyDistributionData || [];
        
        // Day of week data
        statsData.dayOfWeekData = data.dayOfWeekData || [];
        
        // Provinces data
        statsData.provincesData = data.provincesData || [];
        
        // Exam centers data
        statsData.examCentersData = data.examCentersData || [];
        
        // Subject warnings data
        statsData.subjectWarningsData = data.subjectWarningsData || [];
        
        // Subject severity data
        if (!data.subjectSeverityData) {
            statsData.subjectSeverityData = {};
            statsData.subjectWarningsData.forEach(subject => {
                statsData.subjectSeverityData[subject.name] = {
                    yellow: subject.count,
                    orange: 0,
                    red: 0,
                    gray: 0
                };
            });
        } else {
            statsData.subjectSeverityData = data.subjectSeverityData;
        }
        
        // Communication distribution data
        statsData.communicationDistributionData = data.communicationDistributionData || {
            vocal: 0,
            data: 0
        };
        
        // Operateur distribution data
        statsData.operateurDistributionData = data.operateurDistributionData || {};
        
        // Verifiers data
        statsData.verifiersData = data.verifiersData || [];
        
        // Cheat rate data
        statsData.cheatRateData = data.cheatRateData || {
            byRegion: [],
            nationalOverTime: [],
            byProvince: [],
            byCenter: [],
            hourlyDistribution: [],
            session: [],
            examen: []
        };
        
        // Detailed temporal data for multi-day ranges
        statsData.detailedTemporalData = data.detailedTemporalData || [];
        statsData.detailedCheatRateData = data.detailedCheatRateData || [];
        
        // Hourly cheat rate distribution by region data
        statsData.hourlyCheatRateByRegion = data.hourlyCheatRateByRegion || [];
        
        // Hourly distribution by region data
        statsData.hourlyDistributionByRegion = data.hourlyDistributionByRegion || [];
        
        // Update UI
        updateSummaryCards();
        updateAllCharts();
        updateVerifiersTable();
        
        return true; // Indicate success
    } catch (error) {
        console.error("Error fetching real data:", error);
        hideLoading();
        alert("Erreur lors de la récupération des données. Veuillez réessayer.");
        return false; // Indicate failure
    }
}

// Helper function to format date for API
function formatDateForAPI(date) {
    if (!date) return null;
    
    // If it's already a string in the right format, return it
    if (typeof date === 'string' && date.includes('-') && date.includes(':')) {
        return date;
    }
    
    // Convert to Date object if it's not already
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Format as YYYY-MM-DD HH:MM:SS
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:00`;
}

// Function to reset data
function resetStatsData() {
    
    
    // Clear the processed IDs set
    processedAnalysisIds.clear();
    
    statsData.summaryData = {
        yellow: 0,
        orange: 0,
        red: 0,
        total: 0
    };
    
    statsData.regionData = [];
    
    statsData.timeOfDayData = {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
    };
    
    statsData.communicationTypesData = {
        vocal: {
            yellow: 0,
            orange: 0,
            red: 0
        },
        data: {
            yellow: 0,
            orange: 0,
            red: 0
        },
        whatsapp: {
            yellow: 0,
            orange: 0,
            red: 0
        }
    };
    
    statsData.hourlyDistributionData = [];
    statsData.dayOfWeekData = [];
    statsData.provincesData = [];
    statsData.examCentersData = [];
    statsData.subjectWarningsData = [];
    
    statsData.communicationDistributionData = {
        vocal: 0,
        data: 0,
        whatsapp: 0
    };
    
    statsData.operateurDistributionData = {};
    statsData.verifiersData = [];
    
    // Cheat rate data
    statsData.cheatRateData = {
        byRegion: [],
        nationalOverTime: [],
        byProvince: [],
        byCenter: [],
        hourlyDistribution: [],
        session: [],
        examen: []
    };
    
    // Detailed temporal data for multi-day ranges
    statsData.detailedTemporalData = [];
    statsData.detailedCheatRateData = [];
    
    // Hourly distribution by region data
    statsData.hourlyDistributionByRegion = [];
    
    // Hourly cheat rate distribution by region data
    statsData.hourlyCheatRateByRegion = [];
}

// Update summary cards with current data
function updateSummaryCards() {
    // Update yellow (Risque Potentiel)
    const yellowElement = document.getElementById('yellow-count');
    if (yellowElement) {
        yellowElement.textContent = statsData.summaryData.yellow;
    }
    
    // Update orange (Risque Annoté)
    const orangeElement = document.getElementById('orange-count');
    if (orangeElement) {
        orangeElement.textContent = statsData.summaryData.orange;
    }
    
    // Update red (Risque Vérifié)
    const redElement = document.getElementById('red-count');
    if (redElement) {
        redElement.textContent = statsData.summaryData.red;
    }
    
    // Update gray (Fausse Alerte)
    const grayElement = document.getElementById('gray-count');
    if (grayElement) {
        grayElement.textContent = statsData.summaryData.gray;
    }
    
    // Update total
    const totalElement = document.getElementById('total-count');
    if (totalElement) {
        totalElement.textContent = statsData.summaryData.total;
    }
}

// Update verifiers table
function updateVerifiersTable() {
    const tableBody = document.getElementById('verifiers-table-body');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Sort verifiers by count in descending order
    const sortedVerifiers = [...statsData.verifiersData].sort((a, b) => b.count - a.count);
    
    // Add rows for each verifier
    sortedVerifiers.forEach(verifier => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = verifier.name;
        row.appendChild(nameCell);
        const countCell = document.createElement('td');
        countCell.textContent = verifier.count.toLocaleString();
        row.appendChild(countCell);
        
        tableBody.appendChild(row);
    });
    
    // If no verifiers, show a message
    if (sortedVerifiers.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.textContent = 'Aucun vérificateur trouvé';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

// Show loading indicator
function showLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.add('active');
    }
}

// Hide loading indicator
function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('active');
    }
}

// Helper function to format date for datetime-local input
function formatDateTimeForInput(date) {
    return date.getFullYear() + '-' + 
           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
           String(date.getDate()).padStart(2, '0') + 'T' + 
           String(date.getHours()).padStart(2, '0') + ':' + 
           String(date.getMinutes()).padStart(2, '0');
}

// Export data to CSV
function exportDataToCSV() {
    // Show loading indicator
    showLoading();
    
    // Get date range from inputs
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    let url = '/api/export-data';
    if (startDateInput && endDateInput) {
        const params = new URLSearchParams();
        
        if (startDateInput.value) {
            params.append('start_time', formatDateForAPI(new Date(startDateInput.value)));
        }
        
        if (endDateInput.value) {
            // To make the end date inclusive, set the time to 23:59:59
            const inclusiveEndDate = new Date(endDateInput.value);
            if (inclusiveEndDate.getHours() === 0 && inclusiveEndDate.getMinutes() === 0) {
                // If time is 00:00, set to end of day
                inclusiveEndDate.setHours(23, 59, 59);
            }
            params.append('end_time', formatDateForAPI(inclusiveEndDate));
        }
        
        url += '?' + params.toString();
    }
    
    // Fetch CSV data from API
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Get filename from Content-Disposition header or generate default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = 't3shield_export.csv';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            return response.blob().then(blob => ({ blob, filename }));
        })
        .then(({ blob, filename }) => {
            // Create download link for the CSV blob
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            
            // Trigger download
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);
            
            // Hide loading indicator
            hideLoading();
        })
        .catch(error => {
            console.error("Error exporting data:", error);
            hideLoading();
            alert("Erreur lors de l'exportation des données. Veuillez réessayer.");
        });
}

// Update all charts
function updateAllCharts() {
    updateCheatRateRegionsChart();
    updateRegionsChart();
    updateHourlyDistributionChart();
    updateNationalCheatRateChart();
    updateProvinceCheatRateChart();
    updateCenterCheatRateChart();
    updateSessionCheatRateChart();
    updateExamenCheatRateChart();
    
    // Reset zoom listeners flag and setup again
    zoomListenersSetup = false;
    setTimeout(setupChartZoomListeners, 100);
}

// Update cheat rate by regions chart
function updateCheatRateRegionsChart() {
    const ctx = document.getElementById('cheat-rate-regions-chart')?.getContext('2d');
    if (!ctx) {
        console.error("Cheat rate regions chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.cheatRateRegionsChart) {
        chartsRegistry.cheatRateRegionsChart.destroy();
    }
    
    // Sort regions by cheat rate in descending order
    const sortedRegions = [...statsData.cheatRateData.byRegion].sort((a, b) => b.cheat_rate - a.cheat_rate);
    
    // Create chart
    chartsRegistry.cheatRateRegionsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedRegions.map(region => region.aref_name),
            datasets: [{
                label: 'Taux de triche (%)',
                data: sortedRegions.map(region => region.cheat_rate),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Taux de triche par région'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update national cheat rate chart
function updateNationalCheatRateChart() {
    const ctx = document.getElementById('national-cheat-rate-chart')?.getContext('2d');
    if (!ctx) {
        console.error("National cheat rate chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.nationalCheatRateChart) {
        chartsRegistry.nationalCheatRateChart.destroy();
    }
    
    // Determine chart data and labels based on available data (same priority system as hourly distribution)
    let chartData, chartLabels, chartTitle;
    
    // Priority 1: Use detailed cheat rate data if available (multi-day with date-time labels)
    if (statsData.detailedCheatRateData && statsData.detailedCheatRateData.length > 0) {
        // Use detailed data for multi-day ranges - SHOWS DATE + TIME
        chartData = [{
            label: 'Taux de triche (%)',
            data: statsData.detailedCheatRateData.map(item => item.cheat_rate),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }];
        // Use full date-time labels like "Lundi 22/06 15:00"
        chartLabels = statsData.detailedCheatRateData.map(item => `${item.day_date} ${item.hour}`);
        chartTitle = 'Distribution horaire du taux de triche';
        
    } else if (statsData.hourlyCheatRateByRegion && statsData.hourlyCheatRateByRegion.length > 0) {
        // Priority 2: Use hourly cheat rate by region data
        const regionData = statsData.hourlyCheatRateByRegion;
        
        // Get all unique hours for labels
        const allHours = new Set();
        regionData.forEach(region => {
            region.data.forEach(item => allHours.add(item.hour));
        });
        chartLabels = Array.from(allHours).sort();
        
        // Create datasets for each region
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
        ];
        
        chartData = regionData.map((region, index) => ({
            label: region.region,
            data: chartLabels.map(hour => {
                const hourData = region.data.find(item => item.hour === hour);
                return hourData ? hourData.cheat_rate : 0;
            }),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        }));
        
        chartTitle = 'Distribution horaire du taux de triche par région';
        
    } else if (statsData.cheatRateData && statsData.cheatRateData.hourlyDistribution && statsData.cheatRateData.hourlyDistribution.length > 0) {
        // Priority 3: Use regular hourly cheat rate data for single-day ranges (fallback)
        chartData = [{
            label: 'Taux de triche (%)',
            data: statsData.cheatRateData.hourlyDistribution.map(item => item.cheat_rate),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4
        }];
        chartLabels = statsData.cheatRateData.hourlyDistribution.map(item => item.hour);
        chartTitle = 'Distribution horaire du taux de triche';
        
    } else {
        // No data available
        chartData = [{
            label: 'Aucune donnée',
            data: [],
            borderColor: '#6c757d',
            backgroundColor: '#6c757d20',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        }];
        chartLabels = [];
        chartTitle = 'Distribution horaire du taux de triche - Aucune donnée';
    }
    
    // Create chart
    chartsRegistry.nationalCheatRateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: chartData.length > 1,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Taux de triche (%)'
                    }
                },
                x: {
                    title: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 5
                }
            }
        }
    });
}

// Update province cheat rate chart
function updateProvinceCheatRateChart() {
    const ctx = document.getElementById('province-cheat-rate-chart')?.getContext('2d');
    if (!ctx) {
        console.error("Province cheat rate chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.provinceCheatRateChart) {
        chartsRegistry.provinceCheatRateChart.destroy();
    }
    
    // Sort provinces by cheat rate in descending order and limit to top 10
    const sortedProvinces = [...statsData.cheatRateData.byProvince].sort((a, b) => b.cheat_rate - a.cheat_rate).slice(0, 10);
    
    // Create chart
    chartsRegistry.provinceCheatRateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProvinces.map(province => province.province_name),
            datasets: [{
                label: 'Taux de triche (%)',
                data: sortedProvinces.map(province => province.cheat_rate),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Taux de triche par province'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update center cheat rate chart
function updateCenterCheatRateChart() {
    const ctx = document.getElementById('center-cheat-rate-chart')?.getContext('2d');
    if (!ctx) {
        console.error("Center cheat rate chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.centerCheatRateChart) {
        chartsRegistry.centerCheatRateChart.destroy();
    }
    
    // Sort centers by cheat rate in descending order and limit to top 10
    const sortedCenters = [...statsData.cheatRateData.byCenter].sort((a, b) => b.cheat_rate - a.cheat_rate).slice(0, 10);
    
    // Create chart
    chartsRegistry.centerCheatRateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedCenters.map(center => center.center_name),
            datasets: [{
                label: 'Taux de triche (%)',
                data: sortedCenters.map(center => center.cheat_rate),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Taux de triche par centre d\'examen'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update session cheat rate chart
function updateSessionCheatRateChart() {
    const ctx = document.getElementById('session-cheat-rate-chart')?.getContext('2d');
    if (!ctx) {
        console.error("Session cheat rate chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.sessionCheatRateChart) {
        chartsRegistry.sessionCheatRateChart.destroy();
    }
    
    // Sort sessions by cheat rate in descending order
    const sortedSessions = [...statsData.cheatRateData.session].sort((a, b) => b.cheat_rate - a.cheat_rate);
    
    // Create chart
    chartsRegistry.sessionCheatRateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedSessions.map(session => session.session_name),
            datasets: [{
                label: 'Taux de triche (%)',
                data: sortedSessions.map(session => session.cheat_rate),
                backgroundColor: 'rgba(255, 159, 64, 0.6)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Taux de triche par session'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update examen cheat rate chart
function updateExamenCheatRateChart() {
    const ctx = document.getElementById('examen-cheat-rate-chart')?.getContext('2d');
    if (!ctx) {
        console.error("Examen cheat rate chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.examenCheatRateChart) {
        chartsRegistry.examenCheatRateChart.destroy();
    }
    
    // Sort examens by cheat rate in descending order
    const sortedExamens = [...statsData.cheatRateData.examen].sort((a, b) => b.cheat_rate - a.cheat_rate);
    
    // Create chart
    chartsRegistry.examenCheatRateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedExamens.map(examen => examen.examen_name),
            datasets: [{
                label: 'Taux de triche (%)',
                data: sortedExamens.map(examen => examen.cheat_rate),
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Taux de triche par type d\'examen'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

// Update regions chart (number of analyses by region)
function updateRegionsChart() {
    const ctx = document.getElementById('regions-chart')?.getContext('2d');
    if (!ctx) {
        console.error("Regions chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.regionsChart) {
        chartsRegistry.regionsChart.destroy();
    }
    
    // Sort regions by count in descending order
    const sortedRegions = [...statsData.regionData].sort((a, b) => b.count - a.count);
    
    // Create chart
    chartsRegistry.regionsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedRegions.map(region => region.name),
            datasets: [{
                label: 'Nombre d\'analyses',
                data: sortedRegions.map(region => region.count),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Analyses par région'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update hourly distribution chart
function updateHourlyDistributionChart() {
    const ctx = document.getElementById('hourly-distribution-chart')?.getContext('2d');
    if (!ctx) {
        console.error("Hourly distribution chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (chartsRegistry.hourlyDistributionChart) {
        chartsRegistry.hourlyDistributionChart.destroy();
    }
    
    // Determine chart data and labels based on available data
    let chartData, chartLabels, chartTitle;
    
    // Priority 1: Use detailed temporal data if available (multi-day with date-time labels)
    if (statsData.detailedTemporalData && statsData.detailedTemporalData.length > 0) {
        // Use detailed data for multi-day ranges - SHOWS DATE + TIME
        chartData = [{
            label: 'Nombre d\'analyses',
            data: statsData.detailedTemporalData.map(item => item.count),
            borderColor: '#007bff',
            backgroundColor: '#007bff20',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        }];
        // Use full date-time labels like "Lundi 22/06 15:00"
        chartLabels = statsData.detailedTemporalData.map(item => `${item.day_date} ${item.hour}`);
        chartTitle = 'Distribution temporelle des analyses';
        
    } else if (statsData.hourlyDistributionByRegion && statsData.hourlyDistributionByRegion.length > 0) {
        // Priority 2: Use hourly distribution by region data
        const regionData = statsData.hourlyDistributionByRegion;
        
        // Get all unique hours for labels
        const allHours = new Set();
        regionData.forEach(region => {
            region.data.forEach(item => allHours.add(item.hour));
        });
        chartLabels = Array.from(allHours).sort();
        
        // Create datasets for each region
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
        ];
        
        chartData = regionData.map((region, index) => ({
            label: region.region,
            data: chartLabels.map(hour => {
                const hourData = region.data.find(item => item.hour === hour);
                return hourData ? hourData.count : 0;
            }),
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length] + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        }));
        
        chartTitle = 'Distribution horaire des analyses par région';
        
    } else if (statsData.hourlyDistributionData && statsData.hourlyDistributionData.length > 0) {
        // Priority 3: Use regular hourly data for single-day ranges (fallback)
        chartData = [{
            label: 'Nombre d\'analyses',
            data: statsData.hourlyDistributionData.map(item => item.count),
            borderColor: '#007bff',
            backgroundColor: '#007bff20',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        }];
        chartLabels = statsData.hourlyDistributionData.map(item => item.hour);
        chartTitle = 'Distribution horaire des analyses';
        
    } else {
        // No data available
        chartData = [{
            label: 'Aucune donnée',
            data: [],
            borderColor: '#6c757d',
            backgroundColor: '#6c757d20',
            borderWidth: 2,
            fill: false,
            tension: 0.4
        }];
        chartLabels = [];
        chartTitle = 'Distribution temporelle des analyses - Aucune donnée';
    }
    
    // Create chart
    chartsRegistry.hourlyDistributionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: chartData
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 11
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre d\'analyses'
                    }
                },
                x: {
                    title: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 5
                }
            }
        }
    });
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date inputs with default values
    initializeDateInputs();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    fetchRealData();
});

// Initialize date inputs with today's date
function initializeDateInputs() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(8, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(18, 0, 0, 0);
    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        startDateInput.value = formatDateTimeForInput(startOfDay);
        endDateInput.value = formatDateTimeForInput(endOfDay);
    } else {
        console.error("Date input elements not found!");
    }
}

// Set up event listeners
function setupEventListeners() {
    // Apply date filter button (keeping for backward compatibility but making it optional)
    const applyFilterBtn = document.getElementById('apply-date-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            applyDateFilter();
        });
    }
    
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Add loading state
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Actualisation...';
            
            // Refresh data
            refreshDynamicData()
                .finally(() => {
                    // Remove loading state after a short delay for better UX
                    setTimeout(() => {
                        refreshBtn.classList.remove('loading');
                        refreshBtn.disabled = false;
                        refreshBtn.textContent = 'Actualiser';
                    }, 500);
                });
        });
    }
    
    // Export data button
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportDataToCSV);
    }
    
    // Add instant filtering on date input changes
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) {
        startDateInput.addEventListener('change', function() {
            applyDateFilter();
        });
    }
    
    if (endDateInput) {
        endDateInput.addEventListener('change', function() {
            applyDateFilter();
        });
    }
    
    // Keep Enter key functionality for accessibility
    if (startDateInput) {
        startDateInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                applyDateFilter();
            }
        });
    }
    
    if (endDateInput) {
        endDateInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                applyDateFilter();
            }
        });
    }
}

// Helper function to apply date filter
async function applyDateFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    let startDate = null;
    let endDate = null;
    
    if (startDateInput && startDateInput.value) {
        startDate = new Date(startDateInput.value);
    }
    
    if (endDateInput && endDateInput.value) {
        endDate = new Date(endDateInput.value);
    }
    
    await fetchRealData(startDate, endDate);
}

// Refresh data function - similar to map dashboard
async function refreshDynamicData() {
    try {
        // Don't show global loading indicator - just use button loading animation
        // showLoading();
        
        // Use the same function that the time filter uses (which we know works)
        await applyDateFilter();
        
        return true;
    } catch (error) {
        console.error("Error refreshing dynamic data:", error);
        throw error;
    } finally {
        // Don't hide global loading indicator since we didn't show it
        // hideLoading();
    }
}

// Chart zoom functionality
let zoomedChartInstance = null;

// Helper function to safely deep merge objects
function deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item) && item !== null;
}

let zoomListenersSetup = false;

function setupChartZoomListeners() {
    // Prevent setting up listeners multiple times
    if (zoomListenersSetup) {
        return;
    }
    
    // Add event listeners for zoom buttons
    document.querySelectorAll('.zoom-chart-btn').forEach(button => {
        // Remove any existing listeners first
        button.removeEventListener('click', handleZoomClick);
        // Add new listener
        button.addEventListener('click', handleZoomClick);
    });
    
    zoomListenersSetup = true;
}

function handleZoomClick(event) {
    const chartId = event.currentTarget.getAttribute('data-chart');
    zoomChart(chartId);
}

function zoomChart(chartId) {
    const registryKey = getChartRegistryKey(chartId);
    const originalChart = chartsRegistry[registryKey];
    
    
    
    if (!originalChart) {
        console.error(`Chart not found: ${chartId} (registry key: ${registryKey})`);
        console.log('Available charts:', Object.keys(chartsRegistry));
        alert('Graphique non trouvé. Veuillez actualiser la page.');
        return;
    }
    
    // Get the chart title from the button's parent
    const zoomButton = document.querySelector(`[data-chart="${chartId}"]`);
    const chartTitle = zoomButton?.parentElement?.querySelector('.card-title')?.textContent || '';
    
    // Set modal title
    document.getElementById('chartZoomModalLabel').textContent = chartTitle;
    
    // Destroy existing zoomed chart if it exists
    if (zoomedChartInstance) {
        zoomedChartInstance.destroy();
        zoomedChartInstance = null;
    }
    
    // Get the canvas for the zoomed chart
    const zoomedCanvas = document.getElementById('zoomedChart');
    if (!zoomedCanvas) {
        console.error('Zoomed chart canvas not found');
        alert('Erreur: Canvas non trouvé');
        return;
    }
    
    const ctx = zoomedCanvas.getContext('2d');
    
    try {
        // Create a safe copy of the chart configuration
        const originalConfig = originalChart.config;
        console.log("originalConfig", originalConfig);
        
        // Build a new configuration from scratch to avoid any copying issues
        const zoomedConfig = {
            type: originalConfig.type || 'line',
            data: {
                labels: Array.isArray(originalConfig.data?.labels) ? [...originalConfig.data.labels] : [],
                datasets: Array.isArray(originalConfig.data?.datasets) ? 
                    originalConfig.data.datasets.map(dataset => ({
                        label: dataset.label || '',
                        data: Array.isArray(dataset.data) ? [...dataset.data] : [],
                        backgroundColor: dataset.backgroundColor,
                        borderColor: dataset.borderColor,
                        borderWidth: dataset.borderWidth || 1,
                        fill: dataset.fill || false,
                        tension: dataset.tension || 0
                    })) : []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 20,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            padding: 20,
                            font: { size: 14 },
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: originalConfig.options?.scales?.y?.title?.text || 'Valeurs',
                            font: { size: 14, weight: 'bold' }
                        },
                        ticks: {
                            font: { size: 12 }
                        }
                    },
                    x: {
                        title: {
                            display: false
                        },
                        ticks: {
                            font: { size: 12 }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        radius: 3,
                        hoverRadius: 5
                    }
                }
            }
        };
        
        // Copy specific original options if they exist
        if (originalConfig.options?.scales?.y?.ticks?.callback) {
            zoomedConfig.options.scales.y.ticks.callback = originalConfig.options.scales.y.ticks.callback;
        }
        
        
        
        // Create the zoomed chart
        zoomedChartInstance = new Chart(ctx, zoomedConfig);
        
        
        // Show the modal
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(document.getElementById('chartZoomModal'));
            modal.show();
            
            
            // Handle modal close to cleanup
            document.getElementById('chartZoomModal').addEventListener('hidden.bs.modal', function() {
                if (zoomedChartInstance) {
                    zoomedChartInstance.destroy();
                    zoomedChartInstance = null;
                    
                }
            }, { once: true });
            
        } else {
            console.error('Bootstrap Modal not available');
            alert('Fonctionnalité modal non disponible. Veuillez actualiser la page.');
        }
        
    } catch (error) {
        console.error('Error creating zoomed chart:', error);
        console.error('Error stack:', error.stack);
        alert('Erreur lors de l\'agrandissement du graphique: ' + error.message);
    }
}

function getChartRegistryKey(chartId) {
    // Map chart IDs to registry keys
    const mapping = {
        'regions-chart': 'regionsChart',
        'cheat-rate-regions-chart': 'cheatRateRegionsChart',
        'hourly-distribution-chart': 'hourlyDistributionChart',
        'national-cheat-rate-chart': 'nationalCheatRateChart',
        'province-cheat-rate-chart': 'provinceCheatRateChart',
        'center-cheat-rate-chart': 'centerCheatRateChart',
        'session-cheat-rate-chart': 'sessionCheatRateChart',
        'examen-cheat-rate-chart': 'examenCheatRateChart'
    };
    
    return mapping[chartId] || chartId;
}
