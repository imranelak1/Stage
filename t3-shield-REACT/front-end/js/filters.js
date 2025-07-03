// Filter state
let filterState = {
    analysisTypes: ['generale', 'mobilite', 'verifier', 'denied'],
    operateurs: ['Orange', 'Inwi', 'IAM'],
    typeCommunications: ['GSM', 'Appel Vocal', 'Appel WhatsApp'],
    timeRange: {
        start: null,
        end: null,
        active: false
    }
};
  // Initialize filter event listeners
  function initializeFilters() {
      // Analysis type filters
      const analysisTypeCheckboxes = document.querySelectorAll('input[name="analysis-type"]');
      analysisTypeCheckboxes.forEach(checkbox => {
          checkbox.addEventListener('change', function() {
              updateAnalysisTypeFilters();
              updateMap();
              updateDetailsPanel(); // Add this line
          });
      });

      // Operateur filters
      const operateurCheckboxes = document.querySelectorAll('input[name="operateur"]');
      operateurCheckboxes.forEach(checkbox => {
          checkbox.addEventListener('change', function() {
              updateOperateurFilters();
              updateMap();
              updateDetailsPanel(); // Add this line
          });
      });
    
      // Type Communication filters
      const typeCommunicationCheckboxes = document.querySelectorAll('input[name="type-communication"]');
      typeCommunicationCheckboxes.forEach(checkbox => {
          checkbox.addEventListener('change', function() {
              updateTypeCommunicationFilters();
              updateMap();
              updateDetailsPanel(); // Add this line
          });
      });

      // Time range filter - apply on change instead of button click
      const startTimeInput = document.getElementById('start-time');
      const endTimeInput = document.getElementById('end-time');
    
      startTimeInput.addEventListener('change', function() {
          updateTimeRangeFilter();
          updateMap();
          updateDetailsPanel(); // Add this line
      });
    
      endTimeInput.addEventListener('change', function() {
          updateTimeRangeFilter();
          updateMap();
          updateDetailsPanel(); // Add this line
      });
    
      // Add double-click handler to close date picker and apply filter
      startTimeInput.addEventListener('dblclick', function() {
          this.blur(); // Remove focus to close the picker
          updateTimeRangeFilter();
          updateMap();
          updateDetailsPanel(); // Add this line
      });
    
      endTimeInput.addEventListener('dblclick', function() {
          this.blur(); // Remove focus to close the picker
          updateTimeRangeFilter();
          updateMap();
          updateDetailsPanel(); // Add this line
      });
    
      // Initialize date-time inputs with today's values (8am to 6pm)
      initializeTimeInputs();
  }

  // Add a new function to update the details panel when filters change
  // Modify the updateDetailsPanel function in filters.js
function updateDetailsPanel() {
    if (selectedEntity) {
        // Re-apply filters to the selected entity
        const filteredEntity = applyFilters([selectedEntity])[0];
        selectedEntity.filteredAnalysisCounts = filteredEntity.filteredAnalysisCounts;
        
        // Get analyses for this entity
        const entityAnalyses = getEntityAnalyses(selectedEntity);
        
        // Apply filters to the analyses
        const filteredAnalyses = applyAnalysisFilters(entityAnalyses);
        
        // Update the details panel with filtered data
        // Instead of calling updateDetailsContent directly, use showDetailsPanelFiltered
        // to maintain the selected analysis type
        if (typeof showDetailsPanelFiltered === 'function' && typeof selectedAnalysisType !== 'undefined') {
            showDetailsPanelFiltered(selectedEntity, selectedAnalysisType);
        } else {
            // Fallback to the original method if the new function isn't available
            updateDetailsContent(selectedEntity, filteredAnalyses);
        }
    }
}


  // Helper function to get all analyses for an entity
  function getEntityAnalyses(entity) {
      // This function should return all analyses for the given entity
      // For now, we'll use a simple approach based on the entity type
      return analysesDatabase.recentAnalyses.filter(analysis => {
          if (entity.type === "AREF") {
              return analysis.aref === entity.name;
          } else if (entity.type === "DP") {
              return analysis.dp === entity.name;
          } else if (entity.type === "VILLE") {
              return analysis.ville === entity.name;
          } else if (entity.type === "LYCEE") {
              return analysis.lycee === entity.name;
          }
          return false;
      });
  }

  // Function to update the details content with filtered data
  function updateDetailsContent(entity, filteredAnalyses) {
      // Update counts
      document.getElementById('generale-count').textContent = entity.filteredAnalysisCounts.generale.total;
      document.getElementById('mobilite-count').textContent = entity.filteredAnalysisCounts.mobilite.total;
      document.getElementById('verifier-count').textContent = entity.filteredAnalysisCounts.verifier.total;
    
      // Update analyses table
      const analysesList = document.getElementById('analyses-list');
      analysesList.innerHTML = '';
    
      // Add filtered analyses to the table
      filteredAnalyses.forEach(analysis => {
          const row = document.createElement('tr');
          const isMobilityAnalysis = analysis.type === 'analyse_mobilite';
        
          // Date cell - use date for general or timestamp for mobility
          const dateCell = document.createElement('td');
          dateCell.textContent = formatDate(analysis.date || analysis.timestamp);
          row.appendChild(dateCell);
        
          // Operateur cell - use operateur for general or operator for mobility
          const operateurCell = document.createElement('td');
          operateurCell.textContent = analysis.operateur || analysis.operator || '';
          row.appendChild(operateurCell);
        
          // Type cell - show type_communication for general or "Mobilité" for mobility
          const typeCell = document.createElement('td');
          typeCell.textContent = isMobilityAnalysis ? 'Mobilité' : (analysis.type_communication || '');
          row.appendChild(typeCell);
        
          // Location cell
          const locationCell = document.createElement('td');
          locationCell.textContent = `${analysis.lycee}, ${analysis.ville}`;
          row.appendChild(locationCell);
        
          // CNE cell (new) - only show for mobility analyses
          const cneCell = document.createElement('td');
          cneCell.textContent = isMobilityAnalysis ? (analysis.cne || '') : '';
          row.appendChild(cneCell);
        
          analysesList.appendChild(row);
      });
    
      // Update pagination if needed
      updatePagination(filteredAnalyses.length);
  }

  // Helper function to update pagination controls
  function updatePagination(totalItems) {
      const pageInfo = document.getElementById('page-info');
      const prevButton = document.getElementById('prev-page');
      const nextButton = document.getElementById('next-page');
    
      if (pageInfo && prevButton && nextButton) {
          // For now, just reset to page 1
          pageInfo.textContent = 'Page 1';
          prevButton.disabled = true;
          nextButton.disabled = totalItems <= 10; // Assuming 10 items per page
      }
  }
  function initializeTimeInputs() {
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    
    // Get today's date
    const today = new Date();
    
    // Set start time to today at 8:00 AM
    const startDate = new Date(today);
    startDate.setHours(8, 0, 0, 0);
    
    // Set end time to today at 6:00 PM
    const endDate = new Date(today);
    endDate.setHours(18, 0, 0, 0);
    
    // Format dates for datetime-local input
    startTimeInput.value = formatDateForInput(startDate);
    endTimeInput.value = formatDateForInput(endDate);
    
    // Initialize filter state
    filterState.timeRange = {
        start: startTimeInput.value,
        end: endTimeInput.value,
        active: true
    };
    
    // Load data with the default time range
    loadFilteredData();
}

// Format date for datetime-local input
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Update analysis type filters based on checkbox state
function updateAnalysisTypeFilters() {
    const analysisTypeCheckboxes = document.querySelectorAll('input[name="analysis-type"]:checked');
    filterState.analysisTypes = Array.from(analysisTypeCheckboxes).map(checkbox => checkbox.value);
}

// Update operateur filters based on checkbox state
function updateOperateurFilters() {
    const operateurCheckboxes = document.querySelectorAll('input[name="operateur"]:checked');
    filterState.operateurs = Array.from(operateurCheckboxes).map(checkbox => checkbox.value);
}

// Update type communication filters based on checkbox state
function updateTypeCommunicationFilters() {
    const typeCommunicationCheckboxes = document.querySelectorAll('input[name="type-communication"]:checked');
    filterState.typeCommunications = Array.from(typeCommunicationCheckboxes).map(checkbox => checkbox.value);
}

// Update time range filter based on input values
function updateTimeRangeFilter() {
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    
    // Check if inputs have values
    const hasStartValue = startTimeInput.value && startTimeInput.value.trim() !== '';
    const hasEndValue = endTimeInput.value && endTimeInput.value.trim() !== '';
    
    // Only activate the filter if at least one input has a value
    const isActive = hasStartValue || hasEndValue;
    
    // Update filter state
    filterState.timeRange = {
        start: hasStartValue ? startTimeInput.value : null,
        end: hasEndValue ? endTimeInput.value : null,
        active: isActive
    };
    
    
    
    // If time range changed, reload data from server
    if (isActive) {
        loadFilteredData();
    }
}
    // Load data from server based on current time filter
async function loadFilteredData() {
    try {
        
        
        // Check if this is just a filter change or initial load
        const isInitialLoad = !GlobalDataCache.isInitialized;
        
        if (isInitialLoad) {
            // Initial load - use global cache initialization
            const success = await GlobalDataCache.initialize();
            if (!success) {
                throw new Error('Failed to initialize global cache');
            }
        } else {
            // Filter change - refresh with new filters
            await GlobalDataCache.refreshWithFilters();
        }
        
        
        
        // Update the map display
        if (typeof updateMap === 'function') {
            updateMap();
        }
        
    } catch (error) {
        console.error("Error loading filtered data:", error);
        GlobalDataCache.hideSingleLoader();
        
        // Show error message
        alert("Erreur lors du chargement des données filtrées. Veuillez réessayer.");
    }
}

// Reset all entity analysis counts
function resetEntityCounts() {
    const resetCounts = {
        generale: { total: 0 },
        mobilite: { total: 0 },
        verifier: { total: 0 },
        denied: { total: 0 },
        total: 0
    };
    
    tbEntities.assets.arefs.forEach(aref => {
        aref.analysisCounts = JSON.parse(JSON.stringify(resetCounts));
    });
    
    tbEntities.assets.dps.forEach(dp => {
        dp.analysisCounts = JSON.parse(JSON.stringify(resetCounts));
    });
    
    tbEntities.assets.villes.forEach(ville => {
        ville.analysisCounts = JSON.parse(JSON.stringify(resetCounts));
    });
    
    tbEntities.assets.lycees.forEach(lycee => {
        lycee.analysisCounts = JSON.parse(JSON.stringify(resetCounts));
    });
}

function applyFilters(entities) {
    return entities.map(entity => {
        // Create a deep copy of the analysis counts
        const filteredCounts = {
            generale: { total: 0 },
            mobilite: { total: 0 },
            verifier: { total: 0 },
            denied: { total: 0 },
            total: 0
        };
        
        // Make sure entity has analysisCounts
        if (!entity.analysisCounts) {
            entity.analysisCounts = {
                generale: { total: 0 },
                mobilite: { total: 0 },
                verifier: { total: 0 },
                denied: { total: 0 },
                total: 0
            };
        }
        
        // Get all analyses for this entity
        const entityAnalyses = getEntityAnalyses(entity);
        
        // Apply all filters to the analyses
        const filteredAnalyses = applyAnalysisFilters(entityAnalyses);
        
        // Count the filtered analyses by type
        filteredAnalyses.forEach(analysis => {
            // Check analysis type
            if (analysis.type === 'analyse_mobilite' && filterState.analysisTypes.includes('mobilite')) {
                filteredCounts.mobilite.total++;
                filteredCounts.total++;
            } else if (analysis.type === 'analyse_verifier' && filterState.analysisTypes.includes('verifier')) {
                filteredCounts.verifier.total++;
                filteredCounts.total++;
            } else if (analysis.type === 'analyse_denied' && filterState.analysisTypes.includes('denied')) {
                filteredCounts.denied.total++;
                // Don't add denied to total count
            } else if (analysis.type !== 'analyse_mobilite' && analysis.type !== 'analyse_verifier' && analysis.type !== 'analyse_denied' && filterState.analysisTypes.includes('generale')) {
                filteredCounts.generale.total++;
                filteredCounts.total++;
            }
        });
        
        // Return entity with filtered counts
        return {
            ...entity,
            filteredAnalysisCounts: filteredCounts
        };
    });
}

function applyAnalysisFilters(analyses) {
    return analyses.filter(analysis => {
        // Skip if analysis is undefined
        if (!analysis) return false;
        
        // Check analysis type
        if (analysis.type === 'analyse_mobilite' && !filterState.analysisTypes.includes('mobilite')) {
            return false;
        } else if (analysis.type === 'analyse_verifier' && !filterState.analysisTypes.includes('verifier')) {
            return false;
        } else if (analysis.type === 'analyse_denied' && !filterState.analysisTypes.includes('denied')) {
            return false;
        } else if (analysis.type !== 'analyse_mobilite' && analysis.type !== 'analyse_verifier' && analysis.type !== 'analyse_denied' && !filterState.analysisTypes.includes('generale')) {
            return false;
        }
        
        // Apply operateur filter - case insensitive comparison
        const operateurMatches = filterState.operateurs.some(op => 
            (analysis.operateur && analysis.operateur.toLowerCase() === op.toLowerCase()) ||
            // For mobility analysis, check operator instead of operateur
            (analysis.operator && analysis.operator.toLowerCase() === op.toLowerCase())
        );
        if (!operateurMatches) {
            return false;
        }
        
        // Apply type communication filter only for general analyses
        if (analysis.type !== 'analyse_mobilite' && analysis.type !== 'analyse_verifier' && analysis.type !== 'analyse_denied') {
            const typeCommMatches = filterState.typeCommunications.some(type => {
                // Convert UI filter values to match API values
                let apiType = type.toLowerCase();
                if (apiType === "gsm") {
                    return analysis.type_communication && analysis.type_communication.toLowerCase() === "gsm";
                } else if (apiType === "appel vocal") {
                    return analysis.type_communication && analysis.type_communication.toLowerCase() === "vocal";
                } else if (apiType === "appel whatsapp") {
                    return analysis.type_communication && analysis.type_communication.toLowerCase() === "whatsapp";
                }
                return analysis.type_communication && analysis.type_communication.toLowerCase() === apiType.toLowerCase();
            });
            
            if (!typeCommMatches) {
                return false;
            }
        }
        
        // Apply time range filter only if it's active
        if (filterState.timeRange.active) {
            try {
                // Get the timestamp from the appropriate field based on analysis type
                const timestamp = (analysis.type === 'analyse_mobilite' || analysis.type === 'analyse_verifier' || analysis.type === 'analyse_denied') ? analysis.timestamp : analysis.date;
                const analysisTime = new Date(timestamp);
                
                if (filterState.timeRange.start) {
                    const startTime = new Date(filterState.timeRange.start);
                    if (analysisTime < startTime) {
                        return false;
                    }
                }
                
                if (filterState.timeRange.end) {
                    const endTime = new Date(filterState.timeRange.end);
                    if (analysisTime > endTime) {
                        return false;
                    }
                }
            } catch (error) {
                console.error("Error comparing dates:", error, "Analysis timestamp:", 
                    (analysis.type === 'analyse_mobilite' || analysis.type === 'analyse_verifier' || analysis.type === 'analyse_denied') ? analysis.timestamp : analysis.date);
                // If there's an error parsing dates, don't filter this analysis
            }
        }
        
        // Analysis passed all filters
        return true;
    });
}
// Initialize filters when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize filter toggle functionality
    initializeFilterToggle();
    
    // Wait for location data to be loaded before initializing filters
    const waitForLocationData = setInterval(() => {
        if (tbEntities && tbEntities.assets && tbEntities.assets.arefs.length > 0) {
            clearInterval(waitForLocationData);
            
            // Check if user is AREF admin for optimized loading
            const isArefAdmin = window.userManager && userManager.isUserArefAdmin();
            if (isArefAdmin) {
                console.log("Location data loaded (AREF admin optimized), initializing filters...");
            } else {
                console.log("Location data loaded (super admin - all data), initializing filters...");
            }
            
            initializeFilters();
        }
    }, 100);
});

// Initialize filter toggle functionality
function initializeFilterToggle() {
    const filterToggle = document.querySelector('.filter-toggle');
    const filterContent = document.querySelector('.filter-content');
    
    if (filterToggle && filterContent) {
        // Add click event listener
        filterToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            filterToggle.classList.toggle('collapsed');
            filterContent.classList.toggle('collapsed');
            
            // Trigger map resize after layout change
            setTimeout(() => {
                if (typeof map !== 'undefined' && map) {
                    map.invalidateSize();
                }
            }, 100);
        });
        
        // On mobile, start with filters collapsed
        if (window.innerWidth <= 768) {
            filterToggle.classList.add('collapsed');
            filterContent.classList.add('collapsed');
        }
    }
    
    // Handle window resize (orientation change, etc.)
    window.addEventListener('resize', function() {
        // Trigger map resize to handle layout changes
        if (typeof map !== 'undefined' && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    });
}
