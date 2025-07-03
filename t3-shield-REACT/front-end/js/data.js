// Global tbEntities object - will be populated dynamically from database
const tbEntities = {
    assets: {
        arefs: [],
        dps: [],
        villes: [],
        lycees: []
    },
    relations: []
};

// Function to load location data from database (now uses global cache)
async function loadLocationData() {
    try {
        // Use global cache instead of direct API calls
        const success = await GlobalDataCache.initialize();
        
        if (success) {
            // Generate relations dynamically
            generateRelations();
            return true;
        } else {
            throw new Error('Failed to initialize global cache');
        }
        
    } catch (error) {
        GlobalDataCache.hideSingleLoader();
        
        // Show error message to user
        alert("Erreur lors du chargement des données de localisation. Veuillez rafraîchir la page.");
        
        return false;
    }
}

// Function to generate relations dynamically based on parent-child relationships
function generateRelations() {
    const relations = [];
    
    // Generate AREF to DP relations
    tbEntities.assets.dps.forEach(dp => {
        if (dp.parentId) {
            relations.push({
                from: dp.parentId,
                to: dp.id,
                type: "Contains"
            });
        }
    });
    
    // Generate DP to Ville relations
    tbEntities.assets.villes.forEach(ville => {
        if (ville.parentId) {
            relations.push({
                from: ville.parentId,
                to: ville.id,
                type: "Contains"
            });
        }
    });
    
    // Generate Ville to Lycee relations
    tbEntities.assets.lycees.forEach(lycee => {
        if (lycee.parentId) {
            relations.push({
                from: lycee.parentId,
                to: lycee.id,
                type: "Contains"
            });
        }
    });
    
    tbEntities.relations = relations;
}

// Function to show loading overlay
function showLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

// Function to hide loading overlay  
function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Add consolidated loading functions
function showLoading(duration = 3000) {
    showLoadingOverlay();
    if (duration > 0) {
        setTimeout(() => {
            hideLoadingOverlay();
        }, duration);
    }
}

function hideLoading() {
    hideLoadingOverlay();
}

// Function to initialize analysis counts for each entity
function initializeAnalysisCounts() {
    // Initialize analysis counts for AREFs
tbEntities.assets.arefs.forEach(aref => {
    aref.analysisCounts = {
        generale: { total: 0 },
        mobilite: { total: 0 },
        verifier: { total: 0 },
        denied: { total: 0 },
        total: 0
    };
});

    // Initialize analysis counts for DPs
tbEntities.assets.dps.forEach(dp => {
    dp.analysisCounts = {
        generale: { total: 0 },
        mobilite: { total: 0 },
        verifier: { total: 0 },
        denied: { total: 0 },
        total: 0
    };
});

    // Initialize analysis counts for Villes
tbEntities.assets.villes.forEach(ville => {
    ville.analysisCounts = {
        generale: { total: 0 },
        mobilite: { total: 0 },
        verifier: { total: 0 },
        denied: { total: 0 },
        total: 0
    };
});

    // Initialize analysis counts for Lycees
tbEntities.assets.lycees.forEach(lycee => {
    lycee.analysisCounts = {
        generale: { total: 0 },
        mobilite: { total: 0 },
        verifier: { total: 0 },
        denied: { total: 0 },
        total: 0
    };
});
}

// Create a global analyses database
const analysesDatabase = {
    analyses: {},
    recentAnalyses: []
};

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Function to update current time
function updateCurrentTime() {
    const currentTimeElement = document.getElementById('current-time');
    if (currentTimeElement) {
        const now = new Date();
        currentTimeElement.textContent = now.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }
}

// Helper functions to work with the entity structure
function getArefById(arefId) {
    return tbEntities.assets.arefs.find(r => r.id === arefId);
}

function getDpById(dpId) {
    return tbEntities.assets.dps.find(p => p.id === dpId);
}

function getVilleById(villeId) {
    return tbEntities.assets.villes.find(v => v.id === villeId);
}

function getLyceeById(lyceeId) {
    return tbEntities.assets.lycees.find(l => l.id === lyceeId);
}

function getChildrenOfEntity(entityId) {
    return tbEntities.relations
        .filter(relation => relation.from === entityId)
        .map(relation => relation.to);
}

function getParentOfEntity(entityId) {
    const relation = tbEntities.relations.find(relation => relation.to === entityId);
    return relation ? relation.from : null;
}

// Find or create AREF by name
function findOrCreateAref(arefName) {
    let aref = tbEntities.assets.arefs.find(a => a.name === arefName);
    if (!aref) {
        // Create a new AREF
        const newId = `aref-${tbEntities.assets.arefs.length + 1}`;
        aref = {
            id: newId,
            name: arefName,
            abbreviation: arefName.split('-').map(word => word[0]).join('').toUpperCase(),
            type: "AREF",
            coordinates: [34.0209, -6.8416], // Default coordinates
            additionalInfo: {
                description: `Académie Régionale d'Education et de Formation ${arefName}`
            },
            analysisCounts: {
                generale: { total: 0 },
                mobilite: { total: 0 },
                verifier: { total: 0 },
                denied: { total: 0 },
                total: 0
            }
        };
        tbEntities.assets.arefs.push(aref);
    }
    return aref;
}

// Find or create DP by name and parent AREF
function findOrCreateDp(dpName, arefId) {
    let dp = tbEntities.assets.dps.find(d => d.name === dpName && d.parentId === arefId);
    if (!dp) {
        // Create a new DP
        const aref = getArefById(arefId);
        const newId = `dp-${arefId.split('-')[1]}-${tbEntities.assets.dps.filter(d => d.parentId === arefId).length + 1}`;
        dp = {
            id: newId,
            name: dpName,
            type: "DP",
            parentId: arefId,
            coordinates: aref.coordinates, // Use AREF coordinates as default
            additionalInfo: {
                description: `Direction Provinciale de ${dpName}`
            },
            analysisCounts: {
                generale: { total: 0 },
                mobilite: { total: 0 },
                verifier: { total: 0 },
                denied: { total: 0 },
                total: 0
            }
        };
        tbEntities.assets.dps.push(dp);
        
        // Add relation
        tbEntities.relations.push({ from: arefId, to: newId, type: "Contains" });
    }
    return dp;
}

// Find or create Ville by name and parent DP
function findOrCreateVille(villeName, dpId) {
    let ville = tbEntities.assets.villes.find(v => v.name === villeName && v.parentId === dpId);
    if (!ville) {
        // Create a new Ville
        const dp = getDpById(dpId);
        const dpParts = dpId.split('-');
        const newId = `ville-${dpParts[1]}-${dpParts[2]}-${tbEntities.assets.villes.filter(v => v.parentId === dpId).length + 1}`;
        ville = {
            id: newId,
            name: villeName,
            type: "VILLE",
            parentId: dpId,
            coordinates: dp.coordinates, // Use DP coordinates as default
            additionalInfo: {
                description: `Ville de ${villeName}`
            },
            analysisCounts: {
                generale: { total: 0 },
                mobilite: { total: 0 },
                verifier: { total: 0 },
                denied: { total: 0 },
                total: 0
            }
        };
        tbEntities.assets.villes.push(ville);
        
        // Add relation
        tbEntities.relations.push({ from: dpId, to: newId, type: "Contains" });
    }
    return ville;
}

// Find or create Lycee by name and parent Ville
function findOrCreateLycee(lyceeName, villeId) {
    let lycee = tbEntities.assets.lycees.find(l => l.name === lyceeName && l.parentId === villeId);
    if (!lycee) {
        // Create a new Lycee
        const ville = getVilleById(villeId);
        const villeParts = villeId.split('-');
        const newId = `lycee-${villeParts[1]}-${villeParts[2]}-${villeParts[3]}-${tbEntities.assets.lycees.filter(l => l.parentId === villeId).length + 1}`;
        lycee = {
            id: newId,
            name: lyceeName,
            type: "LYCEE",
            parentId: villeId,
            coordinates: ville.coordinates, // Use Ville coordinates as default
            additionalInfo: {
                description: `${lyceeName} à ${ville.name}`,
                address: `${lyceeName}, ${ville.name}`
            },
            analysisCounts: {
                generale: { total: 0 },
                mobilite: { total: 0 },
                verifier: { total: 0 },
                denied: { total: 0 },
                total: 0
            }
        };
        tbEntities.assets.lycees.push(lycee);
        
        // Add relation
        tbEntities.relations.push({ from: villeId, to: newId, type: "Contains" });
    }
    return lycee;
}

// Updated batch logic function - handles general and mobility analyses with proper batch filtering
function isDuplicateAnalysis(newAnalysis) {
    // For verified/denied analyses, handle verification updates
    if ((newAnalysis.type === 'analyse_verifier' || newAnalysis.type === 'analyse_denied') && newAnalysis.id_analyse_mobilite) {
        let existingVerificationId = null;
        
        // Find if a verification for this mobility analysis already exists
        for (const id in analysesDatabase.analyses) {
            const existing = analysesDatabase.analyses[id];
            if ((existing.type === 'analyse_verifier' || existing.type === 'analyse_denied') && 
                existing.id_analyse_mobilite === newAnalysis.id_analyse_mobilite) {
                
                // If the new one is the same as the old one, it's a duplicate from a refresh
                if (existing.id === newAnalysis.id && existing.type === newAnalysis.type) {
                    return true;
                }
                
                existingVerificationId = id;
                break;
            }
        }
        
        // If an old verification exists, remove it to make way for the new one
        if (existingVerificationId) {
            // Decrement counts for the old one before removing
            decrementEntityAnalysisCounts(analysesDatabase.analyses[existingVerificationId]);
            // Remove the old one from the database
            delete analysesDatabase.analyses[existingVerificationId];
            // And from the recent analyses list
            analysesDatabase.recentAnalyses = analysesDatabase.recentAnalyses.filter(a => a.id !== existingVerificationId);
        }
        
        // Return false to allow the new/updated verification to be processed and added
        return false;
    }
    
    // For general and mobility analyses, implement proper batch logic SEPARATED BY ANALYSIS TYPE
    const isMobility = newAnalysis.type === 'analyse_mobilite';
    const newBatch = newAnalysis.batch || 1;
    const analysisDate = new Date(newAnalysis.date || newAnalysis.timestamp);
    
    // Create location key based on analysis type - FIXED: Include analysis type in the key
    let locationKey;
    if (isMobility) {
        // For mobility: use location+cne+day+type for batch logic
        const analysisDay = analysisDate.toDateString();
        locationKey = `mobilite-${newAnalysis.aref}-${newAnalysis.dp}-${newAnalysis.ville}-${newAnalysis.lycee}-${newAnalysis.salle}-${newAnalysis.matiere}-${newAnalysis.cne}-${analysisDay}`;
    } else {
        // For general: use location+day+type for batch logic
        const analysisDay = analysisDate.toDateString();
        locationKey = `generale-${newAnalysis.aref}-${newAnalysis.dp}-${newAnalysis.ville}-${newAnalysis.lycee}-${newAnalysis.salle}-${newAnalysis.matiere}-${analysisDay}`;
    }
    
    // Find the highest batch for this location key (same analysis type only)
    let highestBatch = 0;
    const analysesToRemove = [];
    let isExactDuplicate = false; // Flag for exact duplicates
    
    for (const id in analysesDatabase.analyses) {
        const existing = analysesDatabase.analyses[id];
        
        // Skip verified/denied analyses in this batch logic
        if (existing.type === 'analyse_verifier' || existing.type === 'analyse_denied') {
            continue;
        }
        
        // FIXED: Only compare analyses of the same type
        if (existing.type !== newAnalysis.type) {
            continue;
        }
        
        const existingIsMobility = existing.type === 'analyse_mobilite';
        
        let existingKey;
        if (existingIsMobility) {
            // For mobility: use location+cne+day+type for batch logic
            const existingDate = new Date(existing.date || existing.timestamp);
            const existingDay = existingDate.toDateString();
            existingKey = `mobilite-${existing.aref}-${existing.dp}-${existing.ville}-${existing.lycee}-${existing.salle}-${existing.matiere}-${existing.cne}-${existingDay}`;
        } else {
            // For general: use location+day+type for batch logic
            const existingDate = new Date(existing.date || existing.timestamp);
            const existingDay = existingDate.toDateString();
            existingKey = `generale-${existing.aref}-${existing.dp}-${existing.ville}-${existing.lycee}-${existing.salle}-${existing.matiere}-${existingDay}`;
        }
        
        if (existingKey === locationKey) {
            const existingBatch = existing.batch || 1;
            
            if (existingBatch > highestBatch) {
                highestBatch = existingBatch;
            }
            
            // If new batch is higher, mark old analyses for removal
            if (newBatch > existingBatch) {
                analysesToRemove.push(id);
            }

            // Check for exact duplicates if batches are the same
            if (newBatch === existingBatch) {
                // Only mark as duplicate if it's the same analysis ID
                if (existing.id === newAnalysis.id) {
                    isExactDuplicate = true;
                }
            }
        }
    }

    // If it's an exact duplicate from the same batch, skip it.
    if (isExactDuplicate) {
        return true;
    }
    
    // If new batch is strictly lower than existing highest batch, it's outdated
    if (newBatch < highestBatch) {
        return true;
    }
    
    // If new batch is higher, remove old analyses
    if (analysesToRemove.length > 0) {
        analysesToRemove.forEach(id => {
            decrementEntityAnalysisCounts(analysesDatabase.analyses[id]);
            delete analysesDatabase.analyses[id];
        });
        analysesDatabase.recentAnalyses = analysesDatabase.recentAnalyses.filter(a => !analysesToRemove.includes(a.id));
    }
    
    return false; // Not a duplicate
}

// Add this function to decrement counts when removing an analysis
function decrementEntityAnalysisCounts(analysis) {
    if (!analysis) return;
    
    // Find the entities
    const aref = findOrCreateAref(analysis.aref);
    const dp = findOrCreateDp(analysis.dp, aref.id);
    const ville = findOrCreateVille(analysis.ville, dp.id);
    const lycee = findOrCreateLycee(analysis.lycee, ville.id);
    
    // Determine analysis type
    let analysisType = 'generale'; // Default to generale
    if (analysis.type === 'analyse_mobilite') {
        analysisType = 'mobilite';
    } else if (analysis.type === 'analyse_verifier') {
        analysisType = 'verifier';
    } else if (analysis.type === 'analyse_denied') {
        analysisType = 'denied';
    }
    
    // Decrement counts
    aref.analysisCounts[analysisType].total = Math.max(0, aref.analysisCounts[analysisType].total - 1);
    aref.analysisCounts.total = Math.max(0, aref.analysisCounts.total - 1);
    
    dp.analysisCounts[analysisType].total = Math.max(0, dp.analysisCounts[analysisType].total - 1);
    dp.analysisCounts.total = Math.max(0, dp.analysisCounts.total - 1);
    
    ville.analysisCounts[analysisType].total = Math.max(0, ville.analysisCounts[analysisType].total - 1);
    ville.analysisCounts.total = Math.max(0, ville.analysisCounts.total - 1);
    
    lycee.analysisCounts[analysisType].total = Math.max(0, lycee.analysisCounts[analysisType].total - 1);
    lycee.analysisCounts.total = Math.max(0, lycee.analysisCounts.total - 1);
}

function processAnalysis(analysis) {
    // Ensure batch is set (default to 1 if not provided)
    analysis.batch = analysis.batch || 1;
    
    // Preserve the original ID if it exists, otherwise generate a unique identifier
    if (!analysis.id) {
        analysis.id = `${analysis.type || 'unknown'}-${analysis.date || analysis.timestamp}-${analysis.operateur || analysis.operator}-${analysis.batch}-${Math.random().toString(36).substring(2, 15)}`;
    }
    
    // Check if this is a verification (confirmed or denied analysis)
    const isVerification = analysis.type === 'analyse_verifier' || analysis.type === 'analyse_denied';
    
    // Check if this analysis should be processed based on batch logic
    if (isDuplicateAnalysis(analysis)) {
        const isMobility = analysis.type === 'analyse_mobilite';
        const locationInfo = isMobility 
            ? `${analysis.aref}-${analysis.dp}-${analysis.ville}-${analysis.lycee}-${analysis.salle}-${analysis.matiere}-${analysis.cne}`
            : `${analysis.aref}-${analysis.dp}-${analysis.ville}-${analysis.lycee}-${analysis.salle}-${analysis.matiere}`;
        return;
    }
    
    // Store in analyses database with our generated ID
    analysesDatabase.analyses[analysis.id] = analysis;
    
    // Find or create entities in the hierarchy
    const aref = findOrCreateAref(analysis.aref);
    const dp = findOrCreateDp(analysis.dp, aref.id);
    const ville = findOrCreateVille(analysis.ville, dp.id);
    const lycee = findOrCreateLycee(analysis.lycee, ville.id);
    
    // Determine analysis type based on the analysis object
    let analysisType = 'generale'; // Default to generale
    if (analysis.type === 'analyse_mobilite') {
        analysisType = 'mobilite';
    } else if (analysis.type === 'analyse_verifier') {
        analysisType = 'verifier';
    } else if (analysis.type === 'analyse_denied') {
        analysisType = 'denied';
    }
    
    // Update counts for each entity in the hierarchy
    // For verifications, this is a transfer from mobility to verified/denied
    updateEntityAnalysisCounts(aref, analysisType, isVerification);
    updateEntityAnalysisCounts(dp, analysisType, isVerification);
    updateEntityAnalysisCounts(ville, analysisType, isVerification);
    updateEntityAnalysisCounts(lycee, analysisType, isVerification);
    
    // Add to recent analyses (at the beginning for newest first)
    analysesDatabase.recentAnalyses.unshift(analysis);
    
    // Keep only the most recent analyses (limit to 1000 for better performance)
    if (analysesDatabase.recentAnalyses.length > 1000) {
        analysesDatabase.recentAnalyses = analysesDatabase.recentAnalyses.slice(0, 1000);
    }
}

function updateEntityAnalysisCounts(entity, analysisType, isVerificationTransfer = false) {
    // Increment the appropriate counter
    entity.analysisCounts[analysisType].total++;
    
    // For verification transfers, don't increment total count as it's a transfer, not a new analysis
    if (!isVerificationTransfer) {
        // Only increment total count for non-denied analyses
        if (analysisType !== 'denied') {
    entity.analysisCounts.total++;
        }
    }
    
    // Force map update after counts change
    if (typeof updateMap === 'function' && typeof map !== 'undefined' && map) {
        // Use setTimeout to avoid blocking the main thread
        setTimeout(() => {
            updateMap();
            
            // If the details panel is showing this entity, update it
            if (selectedEntity && selectedEntity.id === entity.id) {
                // Re-apply filters to the selected entity
                const filteredEntity = applyFilters([selectedEntity])[0];
                selectedEntity.filteredAnalysisCounts = filteredEntity.filteredAnalysisCounts;
                
                // Maintain the current analysis type
                if (typeof showDetailsPanelFiltered === 'function' && typeof selectedAnalysisType !== 'undefined') {
                    showDetailsPanelFiltered(selectedEntity, selectedAnalysisType);
                } else {
                    showDetailsPanel(selectedEntity);
                }
            }
        }, 10);
    }
}

// Update time every second
setInterval(updateCurrentTime, 1000);
updateCurrentTime(); // Initial call
