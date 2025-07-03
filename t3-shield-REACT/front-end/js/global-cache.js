// Global data cache system
const GlobalDataCache = {
    // Cache state
    isInitialized: false,
    isLoading: false,
    lastDataFetch: null,
    
    // Cached data
    locationData: {
        arefs: [],
        dps: [],
        villes: [],
        lycees: []
    },
    
    analysesData: {
        general: [],
        mobility: [],
        verified: [],
        lastUpdate: null
    },
    
    // Cache expiry time (5 minutes)
    CACHE_EXPIRY: 5 * 60 * 1000,
    
    // Initialize the cache
    async initialize() {
        if (this.isInitialized && !this.isExpired()) {
            return true;
        }
        
        if (this.isLoading) {
            return await this.waitForInitialization();
        }
        
        this.isLoading = true;
        
        try {
            // Load location data if not cached or expired
            if (!this.locationData.arefs.length || this.isExpired()) {
                await this.loadLocationData();
            }
            
            // Load analysis data
            await this.loadAnalysisData();
            
            this.isInitialized = true;
            this.lastDataFetch = Date.now();
            this.isLoading = false;
            
            // Populate global tbEntities
            this.populateGlobalEntities();
            
            return true;
            
        } catch (error) {
            this.isLoading = false;
            
            // If we have location data but analysis data failed, mark as partially initialized
            if (this.locationData.arefs.length > 0) {
                this.isInitialized = true; // Allow partial functionality
                this.populateGlobalEntities(); // At least populate location data
            }
            
            // Show user-friendly error message
            this.showErrorMessage("Erreur de connexion à la base de données. Veuillez rafraîchir la page ou réessayer plus tard.");
            
            throw error;
        }
    },
    
    // Load location data (optimized for AREF admins)
    async loadLocationData() {
        // Check if user is AREF admin to optimize data loading
        const isArefAdmin = window.userManager && userManager.isUserArefAdmin();
        
        if (isArefAdmin) {
            // Load filtered location data
            const [arefsResponse, dpsResponse, villesResponse, lyceesResponse] = await Promise.all([
                fetch('/t3shield/api/get_arefs'),
                fetch('/t3shield/api/get_dps'),
                fetch('/t3shield/api/get_villes'),
                fetch('/t3shield/api/get_lycees')
            ]);
            
            if (!arefsResponse.ok || !dpsResponse.ok || !villesResponse.ok || !lyceesResponse.ok) {
                throw new Error('Failed to fetch location data');
            }
            
            const [arefs, dps, villes, lycees] = await Promise.all([
                arefsResponse.json(),
                dpsResponse.json(),
                villesResponse.json(),
                lyceesResponse.json()
            ]);
            
            this.locationData = { arefs, dps, villes, lycees };
        } else {
            // Load all location data
            const [arefsResponse, dpsResponse, villesResponse, lyceesResponse] = await Promise.all([
                fetch('/t3shield/api/get_arefs'),
                fetch('/t3shield/api/get_dps'),
                fetch('/t3shield/api/get_villes'),
                fetch('/t3shield/api/get_lycees')
            ]);
            
            if (!arefsResponse.ok || !dpsResponse.ok || !villesResponse.ok || !lyceesResponse.ok) {
                throw new Error('Failed to fetch location data');
            }
            
            const [arefs, dps, villes, lycees] = await Promise.all([
                arefsResponse.json(),
                dpsResponse.json(),
                villesResponse.json(),
                lyceesResponse.json()
            ]);
            
            this.locationData = { arefs, dps, villes, lycees };
        }
    },
    
    // Load analysis data
    async loadAnalysisData() {
        // Get current time range from filters if available
        const timeRange = this.getCurrentTimeRange();
        const queryString = this.buildQueryString(timeRange);
        
        try {
            const [generalResponse, mobilityResponse, verifiedResponse] = await Promise.all([
                fetch(`/api/analyses${queryString ? `?${queryString}` : ''}`),
                fetch(`/api/mobility_analyses${queryString ? `?${queryString}` : ''}`),
                fetch(`/api/verified_analyses${queryString ? `?${queryString}` : ''}`)
            ]);
            
            // Check each response individually for better error reporting
            if (!generalResponse.ok) {
                const errorText = await generalResponse.text();
                throw new Error(`General analyses API error: ${generalResponse.status} - ${errorText}`);
            }
            
            if (!mobilityResponse.ok) {
                const errorText = await mobilityResponse.text();
                throw new Error(`Mobility analyses API error: ${mobilityResponse.status} - ${errorText}`);
            }
            
            if (!verifiedResponse.ok) {
                const errorText = await verifiedResponse.text();
                throw new Error(`Verified analyses API error: ${verifiedResponse.status} - ${errorText}`);
            }
            
            const [general, mobility, verified] = await Promise.all([
                generalResponse.json(),
                mobilityResponse.json(),
                verifiedResponse.json()
            ]);
            
            // Add type property for consistency across all data sources
            general.forEach(a => a.type = 'analyse_generale');
            mobility.forEach(a => a.type = 'analyse_mobilite');

            this.analysesData = {
                general,
                mobility,
                verified,
                lastUpdate: Date.now()
            };
            
        } catch (error) {
            throw error;
        }
    },
    
    // Get current time range from UI
    getCurrentTimeRange() {
        const startTimeInput = document.getElementById('start-time');
        const endTimeInput = document.getElementById('end-time');
        
        if (startTimeInput && endTimeInput && startTimeInput.value && endTimeInput.value) {
            return {
                start: startTimeInput.value,
                end: endTimeInput.value
            };
        }
        
        return null;
    },
    
    // Build query string for API calls
    buildQueryString(timeRange) {
        if (!timeRange) return '';
        
        const params = new URLSearchParams();
        
        if (timeRange.start) {
            const startDate = new Date(timeRange.start);
            const formattedStart = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}:00`;
            params.append('start_time', formattedStart);
        }
        
        if (timeRange.end) {
            const endDate = new Date(timeRange.end);
            const formattedEnd = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:59`;
            params.append('end_time', formattedEnd);
        }
        
        return params.toString();
    },
    
    // Check if cache is expired
    isExpired() {
        if (!this.lastDataFetch) return true;
        return (Date.now() - this.lastDataFetch) > this.CACHE_EXPIRY;
    },
    
    // Wait for initialization to complete
    async waitForInitialization() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (!this.isLoading) {
                    clearInterval(checkInterval);
                    resolve(this.isInitialized);
                }
            }, 100);
        });
    },
    
    // Populate global tbEntities object
    populateGlobalEntities() {
        if (typeof tbEntities !== 'undefined') {
            tbEntities.assets.arefs = this.locationData.arefs;
            tbEntities.assets.dps = this.locationData.dps;
            tbEntities.assets.villes = this.locationData.villes;
            tbEntities.assets.lycees = this.locationData.lycees;
            
            // Initialize analysis counts
            this.initializeAnalysisCounts();
            
            // Process cached analyses
            this.processAllAnalyses();
        }
    },
    
    // Initialize analysis counts for entities
    initializeAnalysisCounts() {
        const resetCounts = {
            generale: { total: 0 },
            mobilite: { total: 0 },
            verifier: { total: 0 },
            denied: { total: 0 },
            total: 0
        };
        
        ['arefs', 'dps', 'villes', 'lycees'].forEach(entityType => {
            if (tbEntities.assets[entityType]) {
                tbEntities.assets[entityType].forEach(entity => {
                    entity.analysisCounts = JSON.parse(JSON.stringify(resetCounts));
                });
            }
        });
    },
    
    // Process all cached analyses
    processAllAnalyses() {
        if (typeof analysesDatabase !== 'undefined') {
            // Clear existing data
            analysesDatabase.analyses = {};
            analysesDatabase.recentAnalyses = [];
            
            // Process general analyses
            this.analysesData.general.forEach(analysis => {
                if (typeof processAnalysis === 'function') {
                    processAnalysis(analysis);
                }
            });
            
            // Process mobility analyses
            this.analysesData.mobility.forEach(analysis => {
                analysis.type = 'analyse_mobilite';
                if (typeof processAnalysis === 'function') {
                    processAnalysis(analysis);
                }
            });
            
            // Process verified analyses
            this.analysesData.verified.forEach(analysis => {
                if (typeof processAnalysis === 'function') {
                    processAnalysis(analysis);
                }
            });
        }
    },
    
    // Refresh data when filters change
    async refreshWithFilters() {
        try {
            await this.loadAnalysisData();
            this.processAllAnalyses();
            
            // Update map if function exists
            if (typeof updateMap === 'function') {
                updateMap();
            }
            
        } catch (error) {
            this.showErrorMessage("Erreur lors du rafraîchissement des données. Veuillez réessayer.");
        }
    },
    
    // Refresh only dynamic data (analyses and cheat rate) without reloading fixed location data
    async refreshDynamicData() {
        try {
            // Only reload analysis data, not location data
            await this.loadAnalysisData();
            this.processAllAnalyses();
            
            // Update last fetch time
            this.lastDataFetch = Date.now();
            
            // Update map if function exists
            if (typeof updateMap === 'function') {
                updateMap();
            }
            
            // Update details panel if it's currently showing
            if (typeof updateDetailsPanel === 'function' && typeof selectedEntity !== 'undefined' && selectedEntity) {
                updateDetailsPanel();
            }
            
        } catch (error) {
            this.showErrorMessage("Erreur lors de l'actualisation des données. Veuillez réessayer.");
            throw error;
        }
    },
    
    // Get cached data for specific page
    getDataForPage(page) {
        switch (page) {
            case 'map':
                return {
                    locationData: this.locationData,
                    analysesData: this.analysesData
                };
            case 'stats':
                return {
                    analysesData: this.analysesData
                };
            default:
                return this.analysesData;
        }
    },
    
    // Show error message to user
    showErrorMessage(message) {
        // Create or update error overlay
        let errorOverlay = document.getElementById('error-overlay');
        if (!errorOverlay) {
            errorOverlay = document.createElement('div');
            errorOverlay.id = 'error-overlay';
            errorOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                color: white;
                text-align: center;
                padding: 20px;
            `;
            document.body.appendChild(errorOverlay);
        }
        
        errorOverlay.innerHTML = `
            <div style="background: #dc3545; padding: 20px; border-radius: 8px; max-width: 500px; position: relative;">
                <button onclick="document.getElementById('error-overlay').style.display='none'" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
                <h3 style="margin: 0 0 15px 0;">Erreur de Connexion</h3>
                <p style="margin: 0 0 20px 0;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="location.reload()" style="
                        background: white;
                        color: #dc3545;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Rafraîchir la page</button>
                    <button onclick="document.getElementById('error-overlay').style.display='none'" style="
                        background: transparent;
                        color: white;
                        border: 2px solid white;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Fermer</button>
                </div>
            </div>
        `;
        
        errorOverlay.style.display = 'flex';
    }
};

// Make it globally available
window.GlobalDataCache = GlobalDataCache; 