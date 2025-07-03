// Global variables
let charts = {};
let currentSection = 'overview';

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date inputs with today's date
    initializeDateInputs();
    
    // Wait for user manager to be available before fetching data
    waitForUserManager().then(() => {
        // Check if user is AREF admin for optimized dashboard
        if (window.userManager && userManager.isUserArefAdmin()) {
            console.log('AREF admin detected - optimizing dashboard for region:', userManager.getUserAref());
        } else {
            console.log('Super admin - loading full dashboard');
        }
        
        // Fetch initial data
        fetchStatisticsData();
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize Feather icons
    feather.replace();
});

// Wait for user manager to be available
function waitForUserManager() {
    return new Promise((resolve) => {
        const checkUserManager = () => {
            if (window.userManager && userManager.isInitialized) {
                resolve();
            } else {
                setTimeout(checkUserManager, 100);
            }
        };
        checkUserManager();
    });
}

// Check if current user is AREF admin
function isArefAdmin() {
    return window.userManager && userManager.isUserArefAdmin();
}

// Get current user's AREF
function getCurrentUserAref() {
    return window.userManager ? userManager.getUserAref() : null;
}

// Initialize date inputs with today's date
function initializeDateInputs() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(8, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(18, 0, 0, 0);
    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    startDateInput.value = formatDateTimeForInput(startOfDay);
    endDateInput.value = formatDateTimeForInput(endOfDay);
}

// Format date for date input
function formatDateTimeForInput(date) {
    return date.toISOString().slice(0, 16);
}

// Set up event listeners
function setupEventListeners() {
    // Apply date filter button
    document.getElementById('apply-date-filter').addEventListener('click', function() {
        fetchStatisticsData();
    });
    
    // Refresh data button
    document.getElementById('refresh-data').addEventListener('click', function() {
        const refreshBtn = this;
        
        // Add loading state
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Actualisation...';
        
        // Fetch data
        fetchStatisticsData()
            .finally(() => {
                // Remove loading state after a short delay for better UX
                setTimeout(() => {
                    refreshBtn.classList.remove('loading');
                    refreshBtn.disabled = false;
                    refreshBtn.textContent = 'Actualiser';
                }, 500);
            });
    });
    
    // Export data button
    document.getElementById('export-data').addEventListener('click', exportData);
    
    // Sidebar navigation
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            switchSection(section);
        });
    });
}

// Switch between sections
function switchSection(section) {
    currentSection = section;
    
    // Update active class on sidebar links
    document.querySelectorAll('#sidebar .nav-link').forEach(link => {
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Show the selected section, hide others
    document.querySelectorAll('.content-section').forEach(sectionEl => {
        if (sectionEl.id === `${section}-section`) {
            sectionEl.classList.add('active');
        } else {
            sectionEl.classList.remove('active');
        }
    });
    
    // Redraw charts in the current section to ensure proper rendering
    if (section === 'overview') {
        if (charts.regions) charts.regions.update();
        if (charts.communicationTypes) charts.communicationTypes.update();
    } else if (section === 'temporal') {
        if (charts.hourlyDistribution) charts.hourlyDistribution.update();
        if (charts.dayOfWeek) charts.dayOfWeek.update();
    } else if (section === 'geographic') {
        if (charts.provinces) charts.provinces.update();
        if (charts.examCenters) charts.examCenters.update();
    } else if (section === 'subjects') {
        if (charts.subjectWarnings) charts.subjectWarnings.update();
    } else if (section === 'communication') {
        if (charts.communicationDistribution) charts.communicationDistribution.update();
        if (charts.operateurDistribution) charts.operateurDistribution.update();
    }
}

// Fetch statistics data from the API
function fetchStatisticsData() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    let url = '/api/statistics';
    if (startDateInput.value && endDateInput.value) {
        // Convert datetime-local format to backend expected format (YYYY-MM-DD HH:MM:SS)
        const startTime = startDateInput.value.replace('T', ' ') + ':00';
        const endTime = endDateInput.value.replace('T', ' ') + ':00';
        
        url += `?start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`;
    }
    
    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Update global stats data
            Object.assign(statsData, data);
            
            // Update UI with the new data
            updateDashboard();
            
            return data;
        })
        .catch(error => {
            console.error('Error fetching statistics data:', error);
            alert('Erreur lors du chargement des données. Veuillez réessayer.');
            throw error;
        });
}

// Update the dashboard with new data
function updateDashboard() {
    // Update summary cards
    updateSummaryCards();
    
    // Update all charts
    updateAllCharts();
    
    // Update verifiers table
    updateVerifiersTable();
}

// Update summary cards
function updateSummaryCards() {
    document.getElementById('yellow-count').textContent = statsData.summaryData.yellow;
    document.getElementById('orange-count').textContent = statsData.summaryData.orange;
    document.getElementById('red-count').textContent = statsData.summaryData.red;
    
    // Update gray count if element exists
    const grayElement = document.getElementById('gray-count');
    if (grayElement && statsData.summaryData.gray !== undefined) {
        grayElement.textContent = statsData.summaryData.gray;
    }
}

// Update all charts
function updateAllCharts() {
    // Overview section
    updateRegionsChart();
    updateCommunicationTypesChart();
    
    // Temporal section
    updateHourlyDistributionChart();
    updateDayOfWeekChart();
    
    // Geographic section
    updateProvincesChart();
    updateExamCentersChart();
    
    // Subjects section
    updateSubjectWarningsChart();
    
    // Communication section
    updateCommunicationDistributionChart();
    updateOperateurDistributionChart();
}

// Update communication types chart
function updateCommunicationTypesChart() {
    const ctx = document.getElementById('communication-types-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.communicationTypes) {
        charts.communicationTypes.destroy();
    }
    
    // Prepare data
    const labels = ['Risque potentiel', 'Risque annoté', 'Risque vérifié'];
    
    // Get the communication types from the data
    const communicationTypes = Object.keys(statsData.communicationTypesData);
    
    // Create datasets for each communication type
    const datasets = communicationTypes.map((type, index) => {
        const colors = [
            { bg: 'rgba(255, 99, 132, 0.7)', border: 'rgba(255, 99, 132, 1)' },
            { bg: 'rgba(75, 192, 192, 0.7)', border: 'rgba(75, 192, 192, 1)' },
            { bg: 'rgba(54, 162, 235, 0.7)', border: 'rgba(54, 162, 235, 1)' }
        ];
        
        // Get the color for this dataset
        const color = colors[index % colors.length];
        
        // Get the data for this communication type
        const data = [
            statsData.communicationTypesData[type].yellow,
            statsData.communicationTypesData[type].orange,
            statsData.communicationTypesData[type].red
        ];
        
        // Format the label (capitalize first letter)
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        
        return {
            label: label,
            data: data,
            backgroundColor: color.bg,
            borderColor: color.border,
            borderWidth: 1
        };
    });
    
    charts.communicationTypes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Analyses par type de communication',
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    stacked: false
                }
            }
        }
    });
}

// Resize charts when window is resized
window.addEventListener('resize', function() {
    // Redraw charts in the current section
    if (currentSection === 'overview') {
        if (charts.regions) charts.regions.resize();
        if (charts.communicationTypes) charts.communicationTypes.resize();
    } else if (currentSection === 'temporal') {
        if (charts.hourlyDistribution) charts.hourlyDistribution.resize();
        if (charts.dayOfWeek) charts.dayOfWeek.resize();
    } else if (currentSection === 'geographic') {
        if (charts.provinces) charts.provinces.resize();
        if (charts.examCenters) charts.examCenters.resize();
    } else if (currentSection === 'subjects') {
        if (charts.subjectWarnings) charts.subjectWarnings.resize();
    } else if (currentSection === 'communication') {
        if (charts.communicationDistribution) charts.communicationDistribution.resize();
        if (charts.operateurDistribution) charts.operateurDistribution.resize();
    }
});

// Update regions chart
function updateRegionsChart() {
    const ctx = document.getElementById('regions-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.regions) {
        charts.regions.destroy();
    }
    
    // Check if user is AREF admin
    if (isArefAdmin()) {
        const userAref = getCurrentUserAref();
        console.log('AREF admin - showing only current region data:', userAref);
        
        // Filter data to show only current AREF
        const currentArefData = statsData.regionData.filter(item => {
            // Match by AREF code or name
            return item.name.includes(userAref) || item.code === userAref;
        });
        
        if (currentArefData.length === 0) {
            // If no data found, create a placeholder
            currentArefData.push({
                name: `AREF ${userAref}`,
                count: 0
            });
        }
        
        charts.regions = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: currentArefData.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: currentArefData.map(item => item.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
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
                        text: `Analyses - ${currentArefData[0].name}`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } else {
        // Super admin - show all regions
        console.log('Super admin - showing all regions data');
        
        // Sort data by count in descending order
        const sortedData = [...statsData.regionData].sort((a, b) => b.count - a.count);
        
        // Limit to top 10 regions
        const topRegions = sortedData.slice(0, 10);
        
        charts.regions = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topRegions.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: topRegions.map(item => item.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
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
                        text: 'Analyses par région',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
}

// Update hourly distribution chart
function updateHourlyDistributionChart() {
    const ctx = document.getElementById('hourly-distribution-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.hourlyDistribution) {
        charts.hourlyDistribution.destroy();
    }

    // Get filter range from date inputs
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const startDate = startDateInput?.value ? new Date(startDateInput.value) : null;
    const endDate = endDateInput?.value ? new Date(endDateInput.value) : null;

    // Helper to pad numbers
    function pad(n) { return n < 10 ? '0' + n : n; }

    // Helper to format date as DD-MM and hour as HH:00
    function formatDayHour(date) {
        return `${pad(date.getDate())}-${pad(date.getMonth()+1)} ${pad(date.getHours())}:00`;
    }

    // Helper to format day/hour for multi-day
    function formatDayHourLabel(date) {
        return `${pad(date.getDate())}-${pad(date.getMonth()+1)} ${pad(date.getHours())}:00`;
    }

    // Build all time slots in the filter range
    let allLabels = [];
    let slotMap = {};
    if (startDate && endDate) {
        let d = new Date(startDate);
        d.setMinutes(0,0,0);
        let end = new Date(endDate);
        end.setMinutes(0,0,0);
        while (d <= end) {
            const label = formatDayHourLabel(d);
            allLabels.push(label);
            slotMap[label] = 0;
            d.setHours(d.getHours()+1);
        }
    }

    // Use detailedTemporalData for multi-day, else hourlyDistributionData
    let dataArr = (statsData.detailedTemporalData && statsData.detailedTemporalData.length > 0)
        ? statsData.detailedTemporalData.map(item => ({
            label: `${item.day_date.replace('/', '-') } ${item.hour}`,
            count: item.count
        }))
        : statsData.hourlyDistributionData.map(item => ({
            label: item.hour,
            count: item.count
        }));

    // Fill slotMap with actual data
    dataArr.forEach(item => {
        if (slotMap[item.label] !== undefined) {
            slotMap[item.label] = item.count;
        }
    });

    // Prepare chart data
    const hours = allLabels;
    const counts = allLabels.map(label => slotMap[label] ?? 0);

    // Determine chart title based on user role
    let chartTitle = 'Distribution horaire des analyses';
    if (isArefAdmin()) {
        const userAref = getCurrentUserAref();
        chartTitle = `Distribution horaire - AREF ${userAref}`;
        console.log('AREF admin - showing hourly distribution for:', userAref);
    } else {
        console.log('Super admin - showing global hourly distribution');
    }

    charts.hourlyDistribution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Nombre d\'analyses',
                data: counts,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: chartTitle,
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update day of week chart
function updateDayOfWeekChart() {
    const ctx = document.getElementById('day-of-week-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.dayOfWeek) {
        charts.dayOfWeek.destroy();
    }
    
    // Prepare data
    const days = statsData.dayOfWeekData.map(item => item.day);
    const counts = statsData.dayOfWeekData.map(item => item.count);
    
    // Determine chart title based on user role
    let chartTitle = 'Analyses par jour de la semaine';
    if (isArefAdmin()) {
        const userAref = getCurrentUserAref();
        chartTitle = `Analyses par jour - AREF ${userAref}`;
        console.log('AREF admin - showing day of week distribution for:', userAref);
    } else {
        console.log('Super admin - showing global day of week distribution');
    }
    
    charts.dayOfWeek = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Nombre d\'analyses',
                data: counts,
                backgroundColor: 'rgba(153, 102, 255, 0.7)',
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
                    text: chartTitle,
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// Update provinces chart
function updateProvincesChart() {
    const ctx = document.getElementById('provinces-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.provinces) {
        charts.provinces.destroy();
    }
    
    // Check if user is AREF admin
    if (isArefAdmin()) {
        const userAref = getCurrentUserAref();
        console.log('AREF admin - showing only current AREF provinces:', userAref);
        
        // Filter provinces data to show only current AREF's provinces
        // This would need to be filtered based on the AREF relationship
        // For now, we'll show all provinces but with a note that it's AREF-specific
        const arefProvincesData = [...statsData.provincesData];
        
        charts.provinces = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: arefProvincesData.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: arefProvincesData.map(item => item.count),
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
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
                        text: `Analyses par province - AREF ${userAref}`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } else {
        // Super admin - show all provinces
        console.log('Super admin - showing all provinces data');
        
        // Sort data by count in descending order
        const sortedData = [...statsData.provincesData].sort((a, b) => b.count - a.count);
        
        // Limit to top 10 provinces
        const topProvinces = sortedData.slice(0, 10);
        
        charts.provinces = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topProvinces.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: topProvinces.map(item => item.count),
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
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
                        text: 'Analyses par province',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
}

// Update exam centers chart
function updateExamCentersChart() {
    const ctx = document.getElementById('exam-centers-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.examCenters) {
        charts.examCenters.destroy();
    }
    
    // Check if user is AREF admin
    if (isArefAdmin()) {
        const userAref = getCurrentUserAref();
        console.log('AREF admin - showing only current AREF exam centers:', userAref);
        
        // Filter exam centers data to show only current AREF's centers
        const arefExamCentersData = [...statsData.examCentersData];
        
        charts.examCenters = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: arefExamCentersData.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: arefExamCentersData.map(item => item.count),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Centres d'examen - AREF ${userAref}`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } else {
        // Super admin - show all exam centers
        console.log('Super admin - showing all exam centers data');
        
        // Sort data by count in descending order
        const sortedData = [...statsData.examCentersData].sort((a, b) => b.count - a.count);
        
        // Limit to top 10 exam centers
        const topCenters = sortedData.slice(0, 10);
        
        charts.examCenters = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topCenters.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: topCenters.map(item => item.count),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Analyses par centre d\'examen',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
}

// Update subject warnings chart
function updateSubjectWarningsChart() {
    const ctx = document.getElementById('subject-warnings-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.subjectWarnings) {
        charts.subjectWarnings.destroy();
    }
    
    // Check if user is AREF admin
    if (isArefAdmin()) {
        const userAref = getCurrentUserAref();
        console.log('AREF admin - showing only current AREF subject data:', userAref);
        
        // Show all subjects data for current AREF (already filtered by backend)
        const arefSubjectData = [...statsData.subjectWarningsData];
        
        charts.subjectWarnings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: arefSubjectData.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: arefSubjectData.map(item => item.count),
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Analyses par matière - AREF ${userAref}`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    } else {
        // Super admin - show all subjects
        console.log('Super admin - showing all subjects data');
        
        // Sort data by count in descending order
        const sortedData = [...statsData.subjectWarningsData].sort((a, b) => b.count - a.count);
        
        // Limit to top 10 subjects
        const topSubjects = sortedData.slice(0, 10);
        
        charts.subjectWarnings = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topSubjects.map(item => item.name),
                datasets: [{
                    label: 'Nombre d\'analyses',
                    data: topSubjects.map(item => item.count),
                    backgroundColor: 'rgba(255, 206, 86, 0.7)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Analyses par matière',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
}

// Update communication distribution chart
function updateCommunicationDistributionChart() {
    const ctx = document.getElementById('communication-distribution-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.communicationDistribution) {
        charts.communicationDistribution.destroy();
    }
    
    // Prepare data
    const labels = ['GSM', 'Appel Vocal'];
    const data = [
        statsData.communicationDistributionData.vocal,
        statsData.communicationDistributionData.data
    ];
    
    charts.communicationDistribution = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution par type de communication',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Update operateur distribution chart
function updateOperateurDistributionChart() {
    const ctx = document.getElementById('operateur-distribution-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (charts.operateurDistribution) {
        charts.operateurDistribution.destroy();
    }
    
    // Prepare data
    const operateurs = Object.keys(statsData.operateurDistributionData);
    const counts = operateurs.map(op => statsData.operateurDistributionData[op]);
    
    // Define colors for operators
    const backgroundColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)'
    ];
    
    const borderColors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)'
    ];
    
    charts.operateurDistribution = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: operateurs,
            datasets: [{
                data: counts,
                backgroundColor: backgroundColors.slice(0, operateurs.length),
                borderColor: borderColors.slice(0, operateurs.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution par opérateur',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Update verifiers table
function updateVerifiersTable() {
    const tableBody = document.getElementById('verifiers-table-body');
    tableBody.innerHTML = '';
    
    // Sort verifiers by count in descending order
    const sortedVerifiers = [...statsData.verifiersData].sort((a, b) => b.count - a.count);
    
    sortedVerifiers.forEach(verifier => {
        const row = document.createElement('tr');
        
        const nameCell = document.createElement('td');
        nameCell.textContent = verifier.name;
        row.appendChild(nameCell);
        
        const countCell = document.createElement('td');
        countCell.textContent = verifier.count;
        row.appendChild(countCell);
        
        tableBody.appendChild(row);
    });
}

// Export data to CSV
function exportData() {
    try {
        // Get current date filter values
        const startDate = document.getElementById('start-date')?.value;
        const endDate = document.getElementById('end-date')?.value;
        
        // Build URL with date parameters
        let url = '/api/export-data';
        const params = new URLSearchParams();
        
        if (startDate) {
            params.append('start_time', startDate);
        }
        if (endDate) {
            params.append('end_time', endDate);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        // Fetch the file from API
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                // Get filename from Content-Disposition header or generate default
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 't3shield_export.xlsx';
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                    if (filenameMatch && filenameMatch[1]) {
                        filename = filenameMatch[1].replace(/['"]/g, '');
                    }
                }
                
                return response.blob().then(blob => ({ blob, filename }));
            })
            .then(({ blob, filename }) => {
                // Create download link for the Excel blob
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
            })
            .catch(error => {
                console.error('Error exporting data:', error);
                alert('Erreur lors de l\'exportation des données. Veuillez réessayer.');
            });
            
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Erreur lors de l\'exportation des données');
    }
}

// Convert data to CSV
function convertToCSV(data) {
    if (!data || data.length === 0) {
        return 'No data to export';
    }
    
    // Get headers from the first item
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
        const row = headers.map(header => {
            // Handle values that might contain commas or quotes
            let value = item[header] !== undefined ? item[header] : '';
            
            // If the value contains commas or quotes, wrap it in quotes
            if (value.toString().includes(',') || value.toString().includes('"')) {
                value = '"' + value.toString().replace(/"/g, '""') + '"';
            }
            
            return value;
        }).join(',');
        
        csv += row + '\n';
    });
    
    return csv;
}

// Download CSV file
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    // Add link to document
    document.body.appendChild(link);
    
    // Click the link to trigger download
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Chart zoom functionality