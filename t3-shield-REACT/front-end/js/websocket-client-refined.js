// WebSocket client for stats dashboard - simplified approach like chef dashboard
function initializeWebSocket() {
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = function() {
            updateConnectionStatus(true);
        };
        
        socket.onmessage = async function(event) {
            try {
                const message = JSON.parse(event.data);
                
                // For any analysis update or cheat rate update, simply reload the data using the current filters.
                // This is the most robust way to ensure consistency.
                if (message.event === 'new_analyses' || message.event === 'new_mobility_analysis' || message.event === 'new_verified_analysis' || message.event === 'verification_update' || message.event === 'cheat_rate_update') {
                    // Special handling for cheat rate updates
                    if (message.event === 'new_mobility_analysis' && message.cheat_rate_updated) {
                    }
                    
                    // Special handling for clean session cheat rate updates
                    if (message.event === 'cheat_rate_update') {
                        if (message.type === 'clean_session') {
                        } else {
                        }
                    }
                    
                    reloadDataWithCurrentFilters();
                } else if (message.event === 'ping') {
                    // Respond to ping with a pong
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ event: 'pong' }));
                    }
                } else if (message.event === 'connected') {
                }
            } catch (error) {
            }
        };
        
        socket.onerror = function(error) {
            updateConnectionStatus(false);
        };
        
        socket.onclose = function(event) {
            updateConnectionStatus(false);
            
            // Attempt to reconnect after 5 seconds
            setTimeout(initializeWebSocket, 5000);
        };
    } catch (error) {
        updateConnectionStatus(false);
    }
}

// Helper function to get current filter dates and reload data
function reloadDataWithCurrentFilters() {
    try {
        // Get current filter dates from the correct input elements
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
    
        // Pass Date objects, not strings, to match manual filter behavior and ensure correct formatting
        const startDate = startDateInput?.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput?.value ? new Date(endDateInput.value) : null;
        
        if (typeof fetchRealData === 'function') {
            fetchRealData(startDate, endDate);
        } else {
            // Fallback: force page refresh to get clean data
            window.location.reload();
        }
    } catch (error) {
        // Fallback: force page refresh to get clean data
        window.location.reload();
    }
}

// Helper function to check if an analysis is within the current time range
function isAnalysisWithinCurrentTimeRange(analysis) {
    try {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        
        const startDateTime = startDateInput?.value;
        const endDateTime = endDateInput?.value;
        
        if (!startDateTime && !endDateTime) return true;
        
        const analysisDate = new Date(analysis.date || analysis.timestamp);
        
        if (startDateTime && analysisDate < new Date(startDateTime)) return false;
        if (endDateTime) {
            const endDate = new Date(endDateTime);
            // Make end date inclusive by setting to end of day if time is 00:00
            if (endDate.getHours() === 0 && endDate.getMinutes() === 0) {
                endDate.setHours(23, 59, 59);
            }
            if (analysisDate > endDate) return false;
    }
    
        return true;
    } catch (error) {
        return true; // If there's an error, include the analysis
    }
}

// Handle verification updates for stats
function handleVerificationForStats(message) {
    // For verification updates, always reload data to ensure accuracy
    reloadDataWithCurrentFilters();
}

// Renamed function to avoid name collision and recursion
function processIncomingStatsUpdate(analyses, eventType) {
    // Filter analyses by current time range
    const filteredAnalyses = analyses.filter(analysis => {
        return isAnalysisWithinCurrentTimeRange(analysis);
    });
    
    if (filteredAnalyses.length === 0) {
        return;
    }
    
    // Fallback to reloading data if the incremental update function is not available
    console.warn("Incremental update function is deprecated, falling back to full reload.");
    reloadDataWithCurrentFilters();
}

// Update connection status indicator
function updateConnectionStatus(connected) {
    // Update desktop status element
    const statusElement = document.getElementById('ws-status');
    if (statusElement) {
        statusElement.className = connected ? 'connected' : 'disconnected';
        statusElement.title = connected ? 'Connecté au serveur' : 'Déconnecté du serveur';
    }
    
    // Update mobile status element
    const mobileStatusElement = document.getElementById('ws-status-mobile');
    if (mobileStatusElement) {
        mobileStatusElement.className = connected ? 'connected' : 'disconnected';
        mobileStatusElement.title = connected ? 'Connecté au serveur' : 'Déconnecté du serveur';
    }
    
    // Also update the active navigation link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-switch');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href || 
            (href === '/dashboard-national' && currentPath === '/') || 
            (href === '/statistiques' && currentPath.includes('stats'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Initialize WebSocket when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load current user information
    loadCurrentUser();
    
    // Wait a bit for other components to initialize first
    setTimeout(() => {
    initializeWebSocket();
    }, 1000);
    
    // Also set active navigation link on page load
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath === href || 
            (href === '/dashboard-national' && currentPath === '/') || 
            (href === '/statistiques' && currentPath.includes('stats'))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// Function to load and display current user information
async function loadCurrentUser() {
    try {
        const response = await fetch('/t3shield/api/current-user');
        if (response.ok) {
            const user = await response.json();
            
            // Update all user-name elements with the actual full_name
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(element => {
                element.textContent = user.full_name;
            });
        } else {
            console.error('Failed to load current user');
        }
    } catch (error) {
        console.error('Error loading current user:', error);
    }
}