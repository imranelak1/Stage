// Map state
let map = null;
let zoomLevel = 6;
let lastZoomLevel = 6; // To track zoom direction
let selectedEntity = null;
let chart = null;
let regionsLayer = null;
let hoveredLayer = null; // To track the layer under the cursor
let moroccoRegionsGeoJSON = null; // Will store the GeoJSON data
let provincesGeoJSON = null;
let provincesLayer = null;
let currentRegionId = null;
let currentPage = 1;
let itemsPerPage = 10;
let entityAnalyses = [];
let selectedAnalysisType = 'generale';

// Store province layers for each region
let provinceLayers = {};

// Detect if device is mobile/tablet
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
}

// Generate a unique color for each region
function getRegionColor(regionId) {
    // Define a color palette for regions
    const colorPalette = [
        '#3498db', // Blue
        '#2ecc71', // Green
        '#9b59b6', // Purple
        '#e74c3c', // Red
        '#f39c12', // Orange
        '#1abc9c', // Turquoise
        '#d35400', // Pumpkin
        '#34495e', // Dark Blue
        '#16a085', // Sea Green
        '#8e44ad', // Violet
        '#c0392b', // Dark Red
        '#f1c40f'  // Yellow
    ];
    
    // Extract numeric part from region ID (e.g., "aref-6" -> 6)
    const idNumber = parseInt(regionId.split('-')[1]);
    
    // Use modulo to get a color from the palette
    const index = (idNumber - 1) % colorPalette.length;
    return colorPalette[index];
}

function initializeMap() {
    // Create map with unlimited zoom capability
    map = L.map('map', {
        center: [31.7917, -7.0926],
        zoom: zoomLevel,
        minZoom: 5,
        maxZoom: 25,  // Allow very high zoom levels
        maxBounds: [
            [20.0, -18.0],
            [37.0, 0.0]
        ],
        maxBoundsViscosity: 1.0,
        layers: []  // Start with no layers
    });
    
    // Add a very minimal basemap with unlimited zoom
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Esri',
        maxZoom: 25  // Remove zoom limitation
    }).addTo(map);
    
    // Set background color to light gray or white
    document.querySelector('.map-container').style.backgroundColor = '#f8f8f8';
    
    // Add colors to regions (AREFs)
    tbEntities.assets.arefs.forEach(aref => {
        aref.color = getRegionColor(aref.id);
    });
    
    // Load the GeoJSON file
    loadGeoJSON();
    
    // Add simple, non-interfering zoom event listener
    map.on('zoomend', function() {
        const newZoomLevel = map.getZoom();
        
        // Simple cleanup when zooming out from provinces to regions
        if (newZoomLevel <= 7 && zoomLevel >= 8) {
            if (provincesLayer) {
                map.removeLayer(provincesLayer);
                provincesLayer = null;
            }
            currentRegionId = null;
        }
        
        zoomLevel = newZoomLevel;
        updateMap();
    });
    
    // Add event listener for move end (panning)
    map.on('moveend', function() {
        // Only update if we're at a zoom level where provinces should be shown
        if (zoomLevel >= 8) {
            updateMap();
        }
    });
    
    // Initialize details panel close button
    const closeDetailsBtn = document.getElementById('close-details');
    closeDetailsBtn.addEventListener('click', function() {
        hideDetailsPanel();
    });
    
    // Add back to country button
    addBackToCountryButton();
}

function loadGeoJSON() {
    // Always load full regions and provinces for super admin
    fetch('/t3shield/api/geojson/regions')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            moroccoRegionsGeoJSON = data;
            createGeoJSONLayer(data);
            // After regions are loaded, load provinces from database
            return fetch('/t3shield/api/geojson/provinces');
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            provincesGeoJSON = data;
            // Create a provinces layer for each region and store them
            createProvinceLayers();
            // Now that we have both regions and provinces data, update the map
            updateMap();
        })
        .catch(error => {
            updateMap();
        });
}

function createGeoJSONLayer(geoJSONData) {
    // Create the GeoJSON layer
    regionsLayer = L.geoJSON(geoJSONData, {
        style: function(feature) {
            // Get region ID from feature properties
            const regionId = getRegionIdFromFeature(feature);
            const aref = tbEntities.assets.arefs.find(r => r.id === regionId);
            
            return {
                fillColor: aref ? aref.color : '#cccccc',
                weight: 2,
                opacity: 0.7,
                color: '#666666',
                fillOpacity: 0.3
            };
        },
        onEachFeature: function(feature, layer) {
            // Find the matching region in your data
            const regionId = getRegionIdFromFeature(feature);
            const aref = tbEntities.assets.arefs.find(r => r.id === regionId);
            
            if (aref) {
                // Store the layer reference in your region data
                aref.polygon = layer;
                
                // Add mouseover and mouseout events to track hovering (desktop only)
                if (!isMobileDevice()) {
                    layer.on('mouseover', function() {
                        hoveredLayer = layer;
                    });
                    layer.on('mouseout', function() {
                        hoveredLayer = null;
                    });
                }
                
                // Add click event
                layer.on('click', function() {
                    selectedEntity = aref;
                    
                    // Smart mobile zoom behavior: zoom to province level for better UX
                    if (isMobileDevice() && zoomLevel < 8) {
                        setTimeout(() => {
                            map.setView(layer.getBounds().getCenter(), 8, {
                                animate: true,
                                duration: 0.8
                            });
                        }, 100); // Small delay to ensure panel opens first
                    }
                    
                    // Update the map to show provinces for this region
                    updateMap();
                });
                
                // Add a tooltip with the region name
                layer.bindTooltip(aref.name, {
                    permanent: false,
                    direction: 'center'
                });
            }
        }
    }).addTo(map);
    
    // Initial map update after GeoJSON is loaded
    updateMap();
    
    // Add legend
    addRegionLegend();
}

// Helper function to extract region ID from GeoJSON feature
function getRegionIdFromFeature(feature) {
    // Use the ID_Reg property if available
    if (feature.properties.ID_Reg) {
        // Convert to string and format as "aref-X"
        // Handle both string codes like "01", "02" and numbers like 1, 2
        const regionCode = feature.properties.ID_Reg.toString();
        // Remove leading zeros for internal mapping (01 -> 1, 02 -> 2, etc.)
        const regionNumber = parseInt(regionCode);
        return "aref-" + regionNumber;
    }
    
    // Fallback to mapping by name if ID_Reg is not available
    if (feature.properties.Nom_Region) {
        const nameToIdMap = {
            'Tanger-Tetouan-Al Hoceima': 'aref-1',
            'L\'Oriental': 'aref-2',
            'Fès-Meknès': 'aref-3',
            'Rabat-Salé-Kénitra': 'aref-4',
            'Béni Mellal-Khénifra': 'aref-5',
            'Casablanca-Settat': 'aref-6',
            'Marrakech-Safi': 'aref-7',
            'Drâa-Tafilalet': 'aref-8',
            'Souss-Massa': 'aref-9',
            'Guelmim-Oued Noun': 'aref-10',
            'Laâyoune-Sakia El Hamra': 'aref-11',
            'Dakhla-Oued Ed-Dahab': 'aref-12'
        };
        
        return nameToIdMap[feature.properties.Nom_Region] || null;
    }
    
    return null;
}

function showProvincesForRegion(regionId) {
    // Set current region ID
    currentRegionId = regionId;
    
    // Remove existing provinces layer if it exists
    if (provincesLayer) {
        map.removeLayer(provincesLayer);
        provincesLayer = null;
    }
    
    // Get the pre-created province layer for this region
    const regionProvinceLayer = provinceLayers[regionId];
    
    if (regionProvinceLayer) {
        provincesLayer = regionProvinceLayer;
        provincesLayer.addTo(map);
    }
}

function getProvinceColor(provinceName) {
    // Generate a color based on the province name
    // This creates a consistent color for each province
    let hash = 0;
    for (let i = 0; i < provinceName.length; i++) {
        hash = provinceName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to a pastel color
    const h = hash % 360;
    return `hsl(${h}, 70%, 80%)`;
}

// Add a function to show province details
function showProvinceDetails(provinceData) {
    // Find the province in our data structure
    const provinceName = provinceData.Province || provinceData.Commune || "Unknown Province";
    
    // Convert database region code (like "08") to internal format (like "aref-8")
    const databaseRegionCode = provinceData.CodeRegi_1 || "06"; // Default to region 6 if not found
    const regionNumber = parseInt(databaseRegionCode); // Convert "08" to 8
    const regionId = "aref-" + regionNumber; // Convert to "aref-8"
    
    // Find the DP in our data
    const dp = tbEntities.assets.dps.find(d => 
        d.name === provinceName && d.parentId === regionId
    );
    
    if (dp) {
        // Show the details panel with DP data
        selectedEntity = dp;
        showDetailsPanel(dp);
    } else {
        // Create a temporary DP entity with the expected structure
        const aref = getArefById(regionId);
        const tempDp = findOrCreateDp(provinceName, regionId);
        
        // Show the details panel with the temporary DP
        selectedEntity = tempDp;
        showDetailsPanel(tempDp);
    }
}

function updateMap() {
    // Check if map is initialized
    if (!map) {
        return;
    }
    
    // Clear existing markers (but not the GeoJSON layer)
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });
    
    // Apply filters to data
    const filteredArefs = applyFilters(tbEntities.assets.arefs);
    
    // Determine which data to show based on zoom level - STABLE VERSION
    if (zoomLevel <= 7) {
        showArefs(filteredArefs);
        
        // Remove provinces layer when at region level
        if (provincesLayer) {
            map.removeLayer(provincesLayer);
            provincesLayer = null;
        }
        
        // Show regions layer if available
        if (regionsLayer && !map.hasLayer(regionsLayer)) {
            regionsLayer.addTo(map);
        }
        
        // Hide back to country button
        hideBackToCountryButton();
        
    } else if (zoomLevel >= 8 && zoomLevel <= 9) {
        showBackToCountryButton();
        
        // Only show provinces if we have a selected region
        if (selectedEntity && selectedEntity.type === 'AREF') {
            if (currentRegionId !== selectedEntity.id || !provincesLayer) {
                currentRegionId = selectedEntity.id;
                showProvincesForRegion(currentRegionId);
            }
            
            // Show DP dots (province level dots)
            showDpMarkers(selectedEntity.id);
            
        } else {
            // No selected region - show AREF dots
            showArefs(filteredArefs);
            
            // Show regions layer
            if (regionsLayer && !map.hasLayer(regionsLayer)) {
                regionsLayer.addTo(map);
            }
        }
        
    } else if (zoomLevel >= 10) {
        showBackToCountryButton();
        
        // Keep provinces layer for context + show Lycée dots
        if (selectedEntity && selectedEntity.type === 'AREF') {
            if (currentRegionId !== selectedEntity.id || !provincesLayer) {
                currentRegionId = selectedEntity.id;
                showProvincesForRegion(currentRegionId);
            }
            
            // Show Lycée dots (exam center level dots)
            showLycees();
        } else {
            // No selected region - show all lycées
            showLycees();
        }
    }
}

// Function to highlight the selected entity
function highlightEntity(entity) {
    // Reset all regions to default style
    tbEntities.assets.arefs.forEach(aref => {
        if (aref.polygon) {
            // If we have a selected entity and we're showing provinces (zoom >= 8), gray out other regions
            if (selectedEntity && selectedEntity.type === 'AREF' && aref.id !== selectedEntity.id && zoomLevel >= 8) {
                aref.polygon.setStyle({
                    fillOpacity: 0.1,
                    weight: 1,
                    color: '#999999'
                });
            } else {
                // Default style
            aref.polygon.setStyle({
                fillOpacity: 0.3,
                weight: 2
            });
            }
        }
    });
    
    // Highlight the selected entity
    if (entity.polygon) {
        entity.polygon.setStyle({
            fillOpacity: 0.6,
            weight: 3
        });
        
        // Bring the selected polygon to the front
        entity.polygon.bringToFront();
    }
}

function updateTableHeader(analysisType) {
    const tableHeader = document.querySelector('#analyses-table thead tr');
    if (!tableHeader) return;
    
    // Clear existing header
    tableHeader.innerHTML = '';
    
    // Add appropriate columns based on analysis type
    if (analysisType === 'generale') {
        // Yellow: Date Opérateur Type Localisation Matière
        tableHeader.innerHTML = `
            <th>Date</th>
            <th>Opérateur</th>
            <th>Type</th>
            <th>Session</th>
            <th>Localisation</th>
            
        `;
    } else if (analysisType === 'mobilite' || analysisType === 'verifier' || analysisType === 'denied') {
        // Orange/Red/Gray: Date CNE Tour Localisation Matière
        tableHeader.innerHTML = `
            <th>Date</th>
            <th>N° d'Examen</th>
            <th>Session</th>
            <th>Nbr Détection</th>
            <th>Localisation</th>
            
            
        `;
    }
}

function updateDetailsPanelContent(entity, filteredAnalyses, analysisType) {
    // Apply filters to get accurate counts
    const filteredEntity = applyFilters([entity])[0];
    
    // Update counts - highlight the selected type
    const generaleCount = document.getElementById('generale-count-box');
    const mobiliteCount = document.getElementById('mobilite-count-box');
    const verifierCount = document.getElementById('verifier-count-box');
    const deniedCount = document.getElementById('denied-count-box');
    
    // Reset all count boxes
    generaleCount.classList.remove('selected');
    mobiliteCount.classList.remove('selected');
    verifierCount.classList.remove('selected');
    if (deniedCount) deniedCount.classList.remove('selected');
    
    // Update count values
    document.getElementById('generale-count').textContent = filteredEntity.filteredAnalysisCounts.generale.total;
    document.getElementById('mobilite-count').textContent = filteredEntity.filteredAnalysisCounts.mobilite.total;
    document.getElementById('verifier-count').textContent = filteredEntity.filteredAnalysisCounts.verifier.total;
    
    // Update denied count if element exists
    const deniedCountElement = document.getElementById('denied-count');
    if (deniedCountElement && filteredEntity.filteredAnalysisCounts.denied) {
        deniedCountElement.textContent = filteredEntity.filteredAnalysisCounts.denied.total;
    }
    
    // Highlight the selected type
    if (analysisType === 'generale') {
        generaleCount.classList.add('selected');
    } else if (analysisType === 'mobilite') {
        mobiliteCount.classList.add('selected');
    } else if (analysisType === 'verifier') {
        verifierCount.classList.add('selected');
    } else if (analysisType === 'denied' && deniedCount) {
        deniedCount.classList.add('selected');
    }
    
    // Store the filtered analyses for pagination
    entityAnalyses = filteredAnalyses;
    
    // Update the table header based on analysis type
    updateTableHeader(analysisType);
    
    // Display the current page of analyses
    displayAnalysesPage(analysisType);
    
    // Update pagination controls
    updatePaginationControls();
}

// Ensure this function properly maintains the selected analysis type
function showDetailsPanelFiltered(entity, analysisType) {
    // Store the selected entity and analysis type
    selectedEntity = entity;
    selectedAnalysisType = analysisType;
    
    // Update panel title - remove the entity type
    document.getElementById('details-title').textContent = entity.name;
    
    // Get analyses for this entity
    entityAnalyses = getEntityAnalyses(entity);
    
    // Filter analyses by the selected type
    const typeFilteredAnalyses = entityAnalyses.filter(analysis => {
        if (analysisType === 'generale' && analysis.type !== 'analyse_mobilite' && analysis.type !== 'analyse_verifier' && analysis.type !== 'analyse_denied') {
            return true;
        } else if (analysisType === 'mobilite' && analysis.type === 'analyse_mobilite') {
            return true;
        } else if (analysisType === 'verifier' && analysis.type === 'analyse_verifier') {
            return true;
        } else if (analysisType === 'denied' && analysis.type === 'analyse_denied') {
            return true;
        }
        return false;
    });
    
    // Apply other filters to the analyses
    const filteredAnalyses = applyAnalysisFilters(typeFilteredAnalyses);
    
    // Reset pagination to page 1
    currentPage = 1;
    
    // Update the details content
    updateDetailsPanelContent(entity, filteredAnalyses, analysisType);
    
    // Ensure pagination event listeners are properly set up
    addPaginationEventListeners();
    
    // Show the panel if it's not already visible and adjust map container
    const detailsPanel = document.getElementById('details-panel');
    const mapContainer = document.querySelector('.map-container');
    
    if (!detailsPanel.classList.contains('active')) {
        detailsPanel.classList.add('active');
        if (mapContainer) {
            mapContainer.classList.add('with-details');
        }
    }
}

function handleDotClick(entity, analysisType, e) {
    // Stop propagation to prevent the marker click event from firing
    L.DomEvent.stopPropagation(e);
    
    // Set the selected entity
    selectedEntity = entity;
    
    // Set the active analysis type
    selectedAnalysisType = analysisType;
    
    // Show the details panel with filtered data
    showDetailsPanelFiltered(entity, analysisType);
    
    // If the entity has a polygon, highlight it
    if (entity.polygon) {
        highlightEntity(entity);
    }
}

// Update showArefs function
function showArefs(arefs) {
    arefs.forEach(aref => {
        // Skip AREFs with no analyses after filtering
        if (aref.filteredAnalysisCounts.total === 0) return;
        
        // Create marker for AREF
        const marker = createAnalysisMarker(
            aref.coordinates,
            aref.filteredAnalysisCounts,
            getArefAbbreviation(aref.name)
        );
        
        // Add click event to marker
        marker.on('click', function() {
            // Only set default analysis type if this is a new entity
            if (!selectedEntity || selectedEntity.id !== aref.id) {
                selectedAnalysisType = 'generale';
            }
            
            selectedEntity = aref;
            showDetailsPanel(aref);
            highlightEntity(aref);
            
            // Zoom to the region if it has a polygon
            if (aref.polygon) {
                map.fitBounds(aref.polygon.getBounds());
                
                // Update the map to show provinces for this region
                updateMap();
            }
        });
        
        marker.addTo(map);
        
        // Add click events to the dots
        setTimeout(() => {
            const markerElement = marker.getElement();
            if (markerElement) {
                const dots = markerElement.querySelectorAll('.dot');
                dots.forEach(dot => {
                    dot.addEventListener('click', function(e) {
                        const analysisType = this.getAttribute('data-type');
                        handleDotClick(aref, analysisType, e);
                    });
                });
            }
        }, 100);
    });
}

// Update showDpMarkers function similarly
function showDpMarkers(arefId) {
    // Get DPs for the selected AREF
    const arefDps = tbEntities.assets.dps.filter(d => d.parentId === arefId);
    const filteredDps = applyFilters(arefDps);
    
    // Get current map bounds
    const bounds = map.getBounds();
    
    filteredDps.forEach(dp => {
        // Skip DPs with no analyses after filtering
        if (dp.filteredAnalysisCounts.total === 0) return;
        
        // Skip DPs outside the current view
        if (!bounds.contains(L.latLng(dp.coordinates))) return;
        
        // Create marker for DP
        const marker = createAnalysisMarker(
            dp.coordinates,
            dp.filteredAnalysisCounts,
            dp.name
        );
        
        // Add click event to marker
        marker.on('click', function() {
            // Only set default analysis type if this is a new entity
            if (!selectedEntity || selectedEntity.id !== dp.id) {
                selectedAnalysisType = 'generale';
            }
            
            selectedEntity = dp;
            showDetailsPanel(dp);
        });
        
        marker.addTo(map);
        
        // Add click events to the dots
        setTimeout(() => {
            const markerElement = marker.getElement();
            if (markerElement) {
                const dots = markerElement.querySelectorAll('.dot');
                dots.forEach(dot => {
                    dot.addEventListener('click', function(e) {
                        const analysisType = this.getAttribute('data-type');
                        handleDotClick(dp, analysisType, e);
                    });
                });
            }
        }, 100);
    });
}

// Update showLycees function similarly
function showLycees() {
    // Get current map bounds
    const bounds = map.getBounds();
    
    // Get all lycees
    const lycees = tbEntities.assets.lycees;
    const filteredLycees = applyFilters(lycees);
    
    filteredLycees.forEach(lycee => {
        // Skip lycees with no analyses after filtering
        if (lycee.filteredAnalysisCounts.total === 0) return;
        
        // Skip lycees outside the current view
        if (!bounds.contains(L.latLng(lycee.coordinates))) return;
        
        // Create marker for lycee
        const marker = createAnalysisMarker(
            lycee.coordinates,
            lycee.filteredAnalysisCounts,
            lycee.name
        );
        
        // Add click event to marker
        marker.on('click', function() {
            // Only set default analysis type if this is a new entity
            if (!selectedEntity || selectedEntity.id !== lycee.id) {
                selectedAnalysisType = 'generale';
            }
            
            selectedEntity = lycee;
            showDetailsPanel(lycee);
        });
        
        marker.addTo(map);
        
        // Add click events to the dots
        setTimeout(() => {
            const markerElement = marker.getElement();
            if (markerElement) {
                const dots = markerElement.querySelectorAll('.dot');
                dots.forEach(dot => {
                    dot.addEventListener('click', function(e) {
                        const analysisType = this.getAttribute('data-type');
                        handleDotClick(lycee, analysisType, e);
                    });
                });
            }
        }, 100);
    });
}

// Hardcoded AREF abbreviation mapping to ensure correct display
function getArefAbbreviation(arefName) {
    const abbreviationMap = {
        'Tanger-Tétouan-Al Hoceima': 'TTH',
        'Tanger-Tetouan-Al Hoceima': 'TTH',
        'L\'Oriental': 'LOR',
        'Fès-Meknès': 'FMK',
        'Rabat-Salé-Kénitra': 'RSK',
        'Béni Mellal-Khénifra': 'BMK',
        'Casablanca-Settat': 'CS',
        'Marrakech-Safi': 'MS',
        'Drâa-Tafilalet': 'DT',
        'Souss-Massa': 'SM',
        'Guelmim-Oued Noun': 'GON',
        'Laâyoune-Sakia El Hamra': 'LSH',
        'Dakhla-Oued Ed-Dahab': 'DOD'
    };
    
    return abbreviationMap[arefName] || arefName.split('-').map(word => word[0]).join('').toUpperCase();
}

function createAnalysisMarker(coordinates, analysisCounts, label) {
    // Create HTML for the marker
    let dotsHtml = '';
    let dotCount = 0;
    
    if (filterState.analysisTypes.includes('generale') && analysisCounts.generale.total > 0) {
        dotsHtml += `<div class="dot dot-generale" data-type="generale" style="background-color:rgb(255, 225, 0)">${analysisCounts.generale.total}</div>`;
        dotCount++;
    }
    
    if (filterState.analysisTypes.includes('mobilite') && analysisCounts.mobilite.total > 0) {
        dotsHtml += `<div class="dot dot-mobilite" data-type="mobilite" style="background-color: #FF8C00">${analysisCounts.mobilite.total}</div>`;
        dotCount++;
    }
    
    if (filterState.analysisTypes.includes('verifier') && analysisCounts.verifier.total > 0) {
        dotsHtml += `<div class="dot dot-verifier" data-type="verifier" style="background-color: #DC143C">${analysisCounts.verifier.total}</div>`;
        dotCount++;
    }
    
    if (filterState.analysisTypes.includes('denied') && analysisCounts.denied && analysisCounts.denied.total > 0) {
        dotsHtml += `<div class="dot dot-denied" data-type="denied" style="background-color: #808080">${analysisCounts.denied.total}</div>`;
        dotCount++;
    }
    
    // Calculate the total width needed for the dots
    const dotWidth = 24; // Width of each dot (from CSS)
    const gap = 1; // Gap between dots
    const totalDotsWidth = (dotWidth * dotCount) + (gap * (dotCount - 1));
    
    // Create the full marker HTML with abbreviation above dots
    const markerWidth = Math.max(120, totalDotsWidth);
    const markerHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; width: ${markerWidth}px;">
            <div class="region-label" style="font-size: 12px; font-weight: bold; margin-bottom: 2px; text-align: center;">${label}</div>
            <div style="display: flex; gap: 1px; justify-content: center;">${dotsHtml}</div>
        </div>
    `;
    
    // Create custom icon with centered positioning
    const icon = L.divIcon({
        className: 'analysis-marker',
        html: markerHtml,
        iconSize: [markerWidth, 40], // Increased height to accommodate abbreviation
        iconAnchor: [markerWidth / 2, 20] // Center the marker horizontally and vertically
    });
    
    // Create marker (no tooltip needed since abbreviation is now visible)
    const marker = L.marker(coordinates, { icon: icon });
    
    return marker;
}

// Add a "Back to Country" button
function addBackToCountryButton() {
    // Create a custom control
    const BackToCountryControl = L.Control.extend({
        options: {
            position: 'topleft'
        },
        
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control back-to-country-control');
            container.id = 'back-to-country-btn';
            container.innerHTML = '<a href="#" title="Back to Country View">🔙</a>';
            container.style.display = 'none'; // Hide initially
            
            L.DomEvent.on(container, 'click', function(e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
                
                // Reset view to country level
                resetToCountryView();
            });
            
            return container;
        }
    });
    
    // Add the control to the map
    map.addControl(new BackToCountryControl());
}

// Show the "Back to Country" button
function showBackToCountryButton() {
    const btn = document.getElementById('back-to-country-btn');
    if (btn) {
        btn.style.display = 'block';
    }
}

// Hide the "Back to Country" button
function hideBackToCountryButton() {
    const btn = document.getElementById('back-to-country-btn');
    if (btn) {
        btn.style.display = 'none';
    }
}

// Reset the map to country view
function resetToCountryView() {
    // Reset zoom and center
    map.setView([31.7917, -7.0926], 6);
    
    // Reset selected entity
    selectedEntity = null;
    
    // Hide details panel
    hideDetailsPanel();
    
    // Remove provinces layer if it exists
    if (provincesLayer) {
        map.removeLayer(provincesLayer);
        provincesLayer = null;
    }
    
    // Reset current region ID
    currentRegionId = null;
    
    // Reset all region styles to default
    resetRegionStyles();
    
    // Show regions layer if it exists and not already on map
    if (regionsLayer && !map.hasLayer(regionsLayer)) {
        regionsLayer.addTo(map);
    }
    
    // Update the map
    updateMap();
}

// Add a variable to track the last update time for the details panel
let lastDetailsPanelUpdate = 0;

// Update showDetailsPanel function to properly refresh when a new entity is selected
function showDetailsPanel(entity) {
    // Store the selected entity
    selectedEntity = entity;
    
    // If no analysis type is selected yet, default to generale
    if (!selectedAnalysisType) {
        selectedAnalysisType = 'generale';
    }
    
    // Update panel title - remove the entity type
    document.getElementById('details-title').textContent = entity.name;
    
    // Get analyses for this entity
    entityAnalyses = getEntityAnalyses(entity);
    
    // Filter analyses by the selected type
    const typeFilteredAnalyses = entityAnalyses.filter(analysis => {
        if (selectedAnalysisType === 'generale' && analysis.type !== 'analyse_mobilite' && analysis.type !== 'analyse_verifier' && analysis.type !== 'analyse_denied') {
            return true;
        } else if (selectedAnalysisType === 'mobilite' && analysis.type === 'analyse_mobilite') {
            return true;
        } else if (selectedAnalysisType === 'verifier' && analysis.type === 'analyse_verifier') {
            return true;
        } else if (selectedAnalysisType === 'denied' && analysis.type === 'analyse_denied') {
            return true;
        }
        return false;
    });
    
    // Apply other filters to the analyses
    const filteredAnalyses = applyAnalysisFilters(typeFilteredAnalyses);
    
    // Reset pagination to page 1
    currentPage = 1;
    
    // Update the details content
    updateDetailsPanelContent(entity, filteredAnalyses, selectedAnalysisType);
    
    // Show the panel and adjust map container
    const detailsPanel = document.getElementById('details-panel');
    const mapContainer = document.querySelector('.map-container');
    
    detailsPanel.classList.add('active');
    if (mapContainer) {
        mapContainer.classList.add('with-details');
    }
    
    // On mobile, collapse the filter panel when details are shown
    if (window.innerWidth <= 768) {
        const filterToggle = document.querySelector('.filter-toggle');
        const filterContent = document.querySelector('.filter-content');
        if (filterToggle && filterContent) {
            filterToggle.classList.add('collapsed');
            filterContent.classList.add('collapsed');
        }
    }
}

function updateDetailsContent(entity, filteredAnalyses) {
    // Apply filters to get accurate counts
    const filteredEntity = applyFilters([entity])[0];
    
    // Update counts
    document.getElementById('generale-count').textContent = filteredEntity.filteredAnalysisCounts.generale.total;
    document.getElementById('mobilite-count').textContent = filteredEntity.filteredAnalysisCounts.mobilite.total;
    document.getElementById('verifier-count').textContent = filteredEntity.filteredAnalysisCounts.verifier.total;
    
    // Update denied count if element exists
    const deniedCountElement = document.getElementById('denied-count');
    if (deniedCountElement && filteredEntity.filteredAnalysisCounts.denied) {
        deniedCountElement.textContent = filteredEntity.filteredAnalysisCounts.denied.total;
    }
    
    // Store the filtered analyses for pagination
    entityAnalyses = filteredAnalyses;
    
    // Display the current page of analyses
    displayAnalysesPage();
    
    // Update pagination controls
    updatePaginationControls();
}

function calculateBatchNumber(analysis) {
    // If batch is directly available, use it
    if (analysis.batch) {
        return analysis.batch;
    }
    
    // Otherwise, we need to calculate it
    // Get all analyses for the same location, matiere, salle
    const locationKey = `${analysis.aref}-${analysis.dp}-${analysis.ville}-${analysis.lycee}-${analysis.salle}-${analysis.matiere}`;
    
    // Get all analyses with the same CNE at this location
    const cneAnalyses = analysesDatabase.recentAnalyses.filter(a => 
        a.cne === analysis.cne && 
        `${a.aref}-${a.dp}-${a.ville}-${a.lycee}-${a.salle}-${a.matiere}` === locationKey
    );
    
    // Group by date (day only)
    const dateGroups = {};
    cneAnalyses.forEach(a => {
        const date = new Date(a.date || a.timestamp);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        
        if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(a);
    });
    
    // Count the number of date groups
    return Object.keys(dateGroups).length;
}

function displayAnalysesPage(analysisType) {
    // If no analysis type is provided, use the selected one
    if (!analysisType && selectedAnalysisType) {
        analysisType = selectedAnalysisType;
    }
    
    const analysesList = document.getElementById('analyses-list');
    analysesList.innerHTML = '';
    
    // If no analyses, show a message
    if (entityAnalyses.length === 0) {
        const noAnalysesRow = document.createElement('tr');
        const noAnalysesCell = document.createElement('td');
        noAnalysesCell.colSpan = analysisType === 'generale' ? 5 : 6; // Updated colspan to include matière
        noAnalysesCell.textContent = 'Aucune analyse trouvée.';
        noAnalysesCell.style.textAlign = 'center';
        noAnalysesCell.style.padding = '20px';
        noAnalysesRow.appendChild(noAnalysesCell);
        analysesList.appendChild(noAnalysesRow);
        return;
    }
    
    // Calculate start and end indices for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, entityAnalyses.length);
    
    // Display analyses for the current page
    for (let i = startIndex; i < endIndex; i++) {
        const analysis = entityAnalyses[i];
        if (!analysis) continue; // Skip if analysis is undefined
        
        // Create table row
        const row = document.createElement('tr');
        
        if (analysisType === 'generale') {
            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = formatDate(analysis.date || analysis.timestamp) || 'Unknown';
            row.appendChild(dateCell);
            
            // Operateur cell
            const operateurCell = document.createElement('td');
            operateurCell.textContent = analysis.operateur || analysis.operator || 'Unknown';
            row.appendChild(operateurCell);
            
            // Type cell
            const typeCell = document.createElement('td');
            typeCell.textContent = analysis.type_communication || 'Unknown';
            row.appendChild(typeCell);
            
            // Matière cell (moved before location)
            const matiereCell = document.createElement('td');
            matiereCell.textContent = analysis.matiere || 'Unknown';
            row.appendChild(matiereCell);
            
            // Location cell
            const locationCell = document.createElement('td');
            
            // Determine the appropriate path to display based on the entity type
            let displayPath = '';
            
            if (selectedEntity.type === 'AREF') {
                // At AREF level, show DP -> ville -> lycee -> salle
                displayPath = `${analysis.dp} → ${analysis.ville} → ${analysis.lycee}`;
            } else if (selectedEntity.type === 'DP') {
                // At DP level, show ville -> lycee -> salle
                displayPath = `${analysis.ville} → ${analysis.lycee}`;
            } else if (selectedEntity.type === 'VILLE') {
                // At ville level, show lycee -> salle
                displayPath = `${analysis.lycee} → ${analysis.salle}`;
            } else if (selectedEntity.type === 'LYCEE') {
                // At lycee level, show salle
                displayPath = analysis.salle;
            } else {
                // Default to full path for other entity types
                displayPath = `${analysis.aref} → ${analysis.dp} → ${analysis.ville} → ${analysis.lycee}`;
            }
            
            locationCell.textContent = displayPath;
            row.appendChild(locationCell);
            
        } else if (analysisType === 'mobilite' || analysisType === 'verifier' || analysisType === 'denied') {
            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = formatDate(analysis.date || analysis.timestamp) || 'Unknown';
            row.appendChild(dateCell);
            
            // CNE cell
            const cneCell = document.createElement('td');
            cneCell.textContent = analysis.cne || '';
            row.appendChild(cneCell);
            
            // Matière cell (moved before location)
            const matiereCell = document.createElement('td');
            matiereCell.textContent = analysis.matiere || 'Unknown';
            row.appendChild(matiereCell);
            
            // Tour (batch) cell
            const tourCell = document.createElement('td');
            // Calculate the tour/batch number
            const batchNumber = calculateBatchNumber(analysis);
            tourCell.textContent = batchNumber;
            row.appendChild(tourCell);
            
            // Location cell
            const locationCell = document.createElement('td');
            
            // Determine the appropriate path to display based on the entity type
            let displayPath = '';
            
            if (selectedEntity.type === 'AREF') {
                // At AREF level, show DP -> ville -> lycee -> salle
                displayPath = `${analysis.dp} → ${analysis.ville} → ${analysis.lycee}`;
            } else if (selectedEntity.type === 'DP') {
                // At DP level, show ville -> lycee -> salle
                displayPath = `${analysis.ville} → ${analysis.lycee}`;
            } else if (selectedEntity.type === 'VILLE') {
                // At ville level, show lycee -> salle
                displayPath = `${analysis.lycee} → ${analysis.salle}`;
            } else if (selectedEntity.type === 'LYCEE') {
                // At lycee level, show salle
                displayPath = analysis.salle;
            } else {
                // Default to full path for other entity types
                displayPath = `${analysis.aref} → ${analysis.dp} → ${analysis.ville} → ${analysis.lycee}`;
            }
            
            locationCell.textContent = displayPath;
            row.appendChild(locationCell);
        }
        
        // Add row to table
        analysesList.appendChild(row);

        // Add click handler to show modal with full details
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() {
            showAnalysisDetailsModal(analysis);
        });
    }
}

// Add a new function to update pagination controls
function updatePaginationControls() {
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    
    // Calculate total pages
    const totalPages = Math.ceil(entityAnalyses.length / itemsPerPage);
    
    // Update page info
    pageInfo.textContent = `Page ${currentPage} sur ${totalPages || 1}`;
    
    // Update button states
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages || totalPages === 0;
}

// Add pagination event listeners when DOM is loaded
function addPaginationEventListeners() {
    // Add pagination event listeners
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (prevPageBtn && nextPageBtn) {
        // Remove existing event listeners to prevent duplicates
        prevPageBtn.removeEventListener('click', handlePrevPage);
        nextPageBtn.removeEventListener('click', handleNextPage);
        
        // Add new event listeners
        prevPageBtn.addEventListener('click', handlePrevPage);
        nextPageBtn.addEventListener('click', handleNextPage);
    }
}

// Separate handler functions for pagination
function handlePrevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayAnalysesPage();
        updatePaginationControls();
    }
}

function handleNextPage() {
    const totalPages = Math.ceil(entityAnalyses.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayAnalysesPage();
        updatePaginationControls();
    }
}

// Hide details panel
function hideDetailsPanel() {
    const detailsPanel = document.getElementById('details-panel');
    const mapContainer = document.querySelector('.map-container');
    
    detailsPanel.classList.remove('active');
    if (mapContainer) {
        mapContainer.classList.remove('with-details');
    }
    
    selectedEntity = null;
    // Don't reset selectedAnalysisType here to maintain user preference
    
    // Reset all region highlights
    tbEntities.assets.arefs.forEach(aref => {
        if (aref.polygon) {
            aref.polygon.setStyle({
                fillOpacity: 0.3,
                weight: 2
            });
        }
    });
    
    // No automatic filter toggling on mobile - user controls filter manually
    
    // Force map resize after layout change with multiple attempts
    const resizeMap = () => {
        if (typeof map !== 'undefined' && map) {
            console.log("Resizing map after details panel hidden");
            map.invalidateSize();
            
            // Force a second resize after a short delay to ensure it takes effect
            setTimeout(() => {
                if (map) {
                    map.invalidateSize();
                    // Trigger a third resize to be absolutely sure
                    setTimeout(() => {
                        if (map) {
            map.invalidateSize();
        }
                    }, 50);
                }
            }, 50);
        }
    };
    
    // Initial resize attempt
    setTimeout(resizeMap, 100);
    
    // Additional resize attempts to handle CSS transitions
    setTimeout(resizeMap, 300);
    setTimeout(resizeMap, 500);
}

// Update analysis type chart
function updateAnalysisChart(analysisCounts) {
    const ctx = document.getElementById('analysis-chart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (chart) {
        chart.destroy();
    }
    
    // Create data for chart
    const data = {
        labels: ['Analyses'],
        datasets: [
            {
                label: 'Générale',
                data: [analysisCounts.generale.total],
                backgroundColor: '#FFD700'
            },
            {
                label: 'Mobilité',
                data: [analysisCounts.mobilite.total],
                backgroundColor: '#FF8C00'
            },
            {
                label: 'Vérifier',
                data: [analysisCounts.verifier.total],
                backgroundColor: '#DC143C'
            },
            {
                label: 'Fausse alerte',
                data: [analysisCounts.denied ? analysisCounts.denied.total : 0],
                backgroundColor: '#808080'
            }
        ]
    };
    
    // Create new chart
    chart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

// Add a legend to the map
function addRegionLegend() {
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.display = 'none'; // Hide legend by default
        div.innerHTML = '<h4>AREFs</h4>';
        
        // Sort AREFs by ID for consistent display
        const sortedArefs = [...tbEntities.assets.arefs].sort((a, b) => {
            const idA = parseInt(a.id.split('-')[1]);
            const idB = parseInt(b.id.split('-')[1]);
            return idA - idB;
        });
        
        sortedArefs.forEach(aref => {
            div.innerHTML += 
                `<div class="legend-item">
                    <span class="color-box" style="background-color:${aref.color}"></span>
                    <span>${aref.name}</span>
                </div>`;
        });
        
        return div;
    };
    
    legend.addTo(map);
    
    // Add a toggle button for the legend
    const toggleBtn = L.control({position: 'bottomright'});
    
    toggleBtn.onAdd = function(map) {
        const btn = L.DomUtil.create('button', 'legend-toggle');
        btn.innerHTML = 'Afficher la légende';
        btn.onclick = function() {
            const legendElement = document.querySelector('.legend');
            if (legendElement.style.display === 'none' || !legendElement.style.display) {
                legendElement.style.display = 'block';
                btn.innerHTML = 'Masquer la légende';
            } else {
                legendElement.style.display = 'none';
                btn.innerHTML = 'Afficher la légende';
            }
            return false;
        };
        return btn;
    };
    
    toggleBtn.addTo(map);
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for user manager to be initialized first
   // if (window.userManager) {
            //await userManager.initialize();
    //    }
    
    // Load location data from database before initializing map
    const dataLoaded = await loadLocationData();
    
    if (dataLoaded) {
        initializeMap();
        
        // Add pagination event listeners after map is initialized
        addPaginationEventListeners();
    }
});

function getEntityAnalyses(entity) {
    const analyses = [];
    
    // Get all analyses
    analysesDatabase.recentAnalyses.forEach(analysis => {
        // Check if the analysis belongs to this entity
        if (entity.type === 'AREF' && analysis.aref === entity.name) {
            analyses.push(analysis);
        } else if (entity.type === 'DP' && analysis.dp === entity.name) {
            analyses.push(analysis);
        } else if (entity.type === 'VILLE' && analysis.ville === entity.name) {
            analyses.push(analysis);
        } else if (entity.type === 'LYCEE' && analysis.lycee === entity.name) {
            analyses.push(analysis);
        }
    });
    
    return analyses;
}

function switchAnalysisType(analysisType) {
    if (!selectedEntity) return;
    
    // Set the selected analysis type
    selectedAnalysisType = analysisType;
    
    // Get analyses for this entity
    const allEntityAnalyses = getEntityAnalyses(selectedEntity);
    
    // Filter analyses by the selected type
    const typeFilteredAnalyses = allEntityAnalyses.filter(analysis => {
        if (analysisType === 'generale' && analysis.type !== 'analyse_mobilite' && analysis.type !== 'analyse_verifier' && analysis.type !== 'analyse_denied') {
            return true;
        } else if (analysisType === 'mobilite' && analysis.type === 'analyse_mobilite') {
            return true;
        } else if (analysisType === 'verifier' && analysis.type === 'analyse_verifier') {
            return true;
        } else if (analysisType === 'denied' && analysis.type === 'analyse_denied') {
            return true;
        }
        return false;
    });
    
    // Apply other filters to the analyses
    const filteredAnalyses = applyAnalysisFilters(typeFilteredAnalyses);
    
    // Reset pagination to page 1
    currentPage = 1;
    
    // Update the details content with the filtered analyses
    updateDetailsPanelContent(selectedEntity, filteredAnalyses, analysisType);
    
    // Ensure pagination event listeners are properly set up
    addPaginationEventListeners();
}

// Function to reset all region styles to default
function resetRegionStyles() {
    tbEntities.assets.arefs.forEach(aref => {
        if (aref.polygon) {
            aref.polygon.setStyle({
                fillOpacity: 0.3,
                weight: 2,
                color: '#666666'
            });
        }
    });
}

// Create provinces layer specifically for AREF admin users
function createArefProvincesLayer(geoJSONData) {
    if (!geoJSONData || !geoJSONData.features) {
        return;
    }

    console.log("Creating AREF provinces layer...");
    
    // Create provinces layer for AREF admin
    provincesLayer = L.geoJSON(geoJSONData, {
        style: function(feature) {
            const provinceName = feature.properties.Province || feature.properties.Commune || "Unknown";
            return {
                fillColor: getProvinceColor(provinceName),
                weight: 1.5,
                opacity: 0.8,
                color: '#444',
                fillOpacity: 0.4
            };
        },
        onEachFeature: function(feature, layer) {
            // Add click event for provinces
            layer.on('click', function() {
                // Don't show details panel for province clicks - only for dot clicks
            });
            
            // Add hover effects (desktop only)
            if (!isMobileDevice()) {
                layer.on('mouseover', function(e) {
                    layer.setStyle({
                        weight: 2,
                        fillOpacity: 0.6
                    });
                    hoveredLayer = layer;
                });
                
                layer.on('mouseout', function(e) {
                    layer.setStyle({
                        weight: 1.5,
                        fillOpacity: 0.4
                    });
                    hoveredLayer = null;
                });
            }
            
            // Add a tooltip with the province name
            const provinceName = feature.properties.Province || feature.properties.Commune || "Unknown";
            layer.bindTooltip(provinceName, {
                permanent: false,
                direction: 'center'
            });
        }
    });
    
    // Add the layer to the map immediately for AREF admins
    provincesLayer.addTo(map);
    console.log(`Created AREF provinces layer with ${geoJSONData.features.length} provinces`);
}

// Add this after the loadGeoJSON function
// Store province layers for each region
function createProvinceLayers() {
    console.log("Creating province layers for all regions...");
    
    if (!provincesGeoJSON || !provincesGeoJSON.features) {
        console.error("No provinces data available");
        return;
    }
    
    // Create a layer for each region
    for (let regionNumber = 1; regionNumber <= 12; regionNumber++) {
        const regionCode = regionNumber.toString().padStart(2, '0'); // "01", "02", etc.
        const regionId = `aref-${regionNumber}`;
        
        // Filter provinces for this region
        const regionProvinces = provincesGeoJSON.features.filter(feature => {
            if (!feature.properties || feature.properties.CodeRegi_1 === undefined) {
                return false;
            }
            // Compare with both the formatted code and the number
            return feature.properties.CodeRegi_1 === regionCode || 
                   feature.properties.CodeRegi_1 === regionNumber ||
                   String(feature.properties.CodeRegi_1) === String(regionCode) ||
                   String(feature.properties.CodeRegi_1) === String(regionNumber);
        });
        
        if (regionProvinces.length > 0) {
            const provincesFeatures = {
                type: "FeatureCollection",
                features: regionProvinces
            };
            
            // Create the layer but don't add it to map yet
            provinceLayers[regionId] = L.geoJSON(provincesFeatures, {
                style: function(feature) {
                    const provinceName = feature.properties.Province || feature.properties.Commune || "Unknown";
                    const color = getProvinceColor(provinceName);
                    
                    return {
                        fillColor: color,
                        weight: 1.5,
                        opacity: 0.8,
                        color: '#444',
                        fillOpacity: 0.4
                    };
                },
                onEachFeature: function(feature, layer) {
                    // Add mouseover and mouseout events to track hovering (desktop only)
                    if (!isMobileDevice()) {
                        layer.on('mouseover', function() {
                            hoveredLayer = layer;
                        });
                        layer.on('mouseout', function() {
                            hoveredLayer = null;
                        });
                    }
                    
                    // Add click event
                    layer.on('click', function() {
                        // Don't show details panel for province clicks - only for dot clicks
                    });
                    
                    // Add a tooltip with the province name
                    const provinceName = feature.properties.Province || feature.properties.Commune || "Unknown";
                    layer.bindTooltip(provinceName, {
                        permanent: false,
                        direction: 'center'
                    });
                }
            });
            
            console.log(`Created province layer for region ${regionId} with ${regionProvinces.length} provinces`);
        }
    }
}

// Export functionality
function initializeExportButton() {
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
}

function exportData() {
    try {
        console.log('Export button clicked');
        
        // Show loading state
        const exportBtn = document.getElementById('export-btn');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h1.5V3.5A.5.5 0 0 1 8 3zm3 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h.5V3.5A.5.5 0 0 1 11 3z"/>
                <path d="M3.732 1.732a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 0 1-.707.707L4.732 2.439a.5.5 0 0 1 0-.707z"/>
                <path d="M2.5 11a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Exportation...
        `;
        exportBtn.disabled = true;
        
        // Get current date filter values
        const startDateInput = document.getElementById('start-time');
        const endDateInput = document.getElementById('end-time');
        
        console.log('Date inputs found:', {
            startDateInput: startDateInput,
            endDateInput: endDateInput,
            startDateValue: startDateInput?.value,
            endDateValue: endDateInput?.value
        });
        
        // Check if inputs exist
        if (!startDateInput || !endDateInput) {
            console.error('Time input elements not found');
            alert('Erreur: Les champs de date ne sont pas disponibles. Veuillez recharger la page.');
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
            return;
        }
        
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        
        // Check if inputs have values
        if (!startDate || !endDate) {
            console.log('No time range set, will use default (today 8am-6pm)');
        } else {
            console.log('Time range set by user:', { startDate, endDate });
        }
        
        // Convert datetime-local format to backend expected format (YYYY-MM-DD HH:MM:SS)
        let startTime = null;
        let endTime = null;
        
        if (startDate) {
            // Convert from YYYY-MM-DDTHH:MM to YYYY-MM-DD HH:MM:SS
            startTime = startDate.replace('T', ' ') + ':00';
            console.log('Start date converted:', startDate, '->', startTime);
        } else {
            console.log('No start date provided, will use default (today 8am)');
        }
        
        if (endDate) {
            // Convert from YYYY-MM-DDTHH:MM to YYYY-MM-DD HH:MM:SS
            endTime = endDate.replace('T', ' ') + ':00';
            console.log('End date converted:', endDate, '->', endTime);
        } else {
            console.log('No end date provided, will use default (today 6pm)');
        }
        
        // Build URL with date parameters
        let url = '/api/export-data';
        const params = new URLSearchParams();
        
        if (startTime) {
            params.append('start_time', startTime);
        }
        if (endTime) {
            params.append('end_time', endTime);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        console.log('Export URL with parameters:', url);
        console.log('Time range being exported:', {
            startTime: startTime || 'default (today 8am)',
            endTime: endTime || 'default (today 6pm)'
        });
        
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
                console.log('Export successful, downloading file:', filename);
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
            })
            .finally(() => {
                // Restore original button state
                exportBtn.innerHTML = originalText;
                exportBtn.disabled = false;
            });
            
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Erreur lors de l\'exportation des données');
        
        // Restore original button state
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Exporter
            `;
            exportBtn.disabled = false;
        }
    }
}

// Initialize export button when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for all elements to be loaded
    setTimeout(() => {
        initializeExportButton();
        initializeRefreshButton();
    }, 100);
});

// Also initialize when the page is fully loaded
window.addEventListener('load', function() {
    initializeExportButton();
    initializeRefreshButton();
});

// Initialize refresh button functionality
function initializeRefreshButton() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', handleRefreshClick);
    }
}

// Handle refresh button click
async function handleRefreshClick() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (!refreshBtn) return;
    
    try {
        // Show loading state
        const originalText = refreshBtn.innerHTML;
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h1.5V3.5A.5.5 0 0 1 8 3zm3 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h.5V3.5A.5.5 0 0 1 11 3z"/>
                <path d="M3.732 1.732a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 0 1-.707.707L4.732 2.439a.5.5 0 0 1 0-.707z"/>
                <path d="M2.5 11a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Actualisation...
        `;
        
        // Refresh dynamic data
        if (typeof GlobalDataCache !== 'undefined') {
            await GlobalDataCache.refreshDynamicData();
        } else {
            throw new Error('GlobalDataCache not available');
        }
        
        // Show success feedback
        refreshBtn.style.backgroundColor = '#28a745';
        setTimeout(() => {
            refreshBtn.style.backgroundColor = '';
        }, 1000);
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        
        // Show error feedback
        refreshBtn.style.backgroundColor = '#dc3545';
        setTimeout(() => {
            refreshBtn.style.backgroundColor = '';
        }, 2000);
        
    } finally {
        // Restore original button state
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h1.5V3.5A.5.5 0 0 1 8 3zm3 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h.5V3.5A.5.5 0 0 1 11 3z"/>
                <path d="M3.732 1.732a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 0 1-.707.707L4.732 2.439a.5.5 0 0 1 0-.707z"/>
                <path d="M2.5 11a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Actualiser
        `;
    }
}

// Floating filter bar and overlay logic
function initializeFloatingFilterBar() {
    const floatingBar = document.getElementById('floating-filter-bar');
    const filterOverlay = document.getElementById('filter-overlay');
    const filtersToggle = document.getElementById('filters-toggle');
    const closeOverlayBtn = document.getElementById('close-filter-overlay');
    const mobileFiltersToggle = document.getElementById('mobile-filters-toggle');

    function openOverlay() {
        // Hide only the filter toggle button, keep export button visible
        filtersToggle.classList.add('hidden');
        filterOverlay.style.display = 'flex';
        filterOverlay.classList.add('open');
    }
    function closeOverlay() {
        filterOverlay.style.display = 'none';
        // Show the filter toggle button again
        filtersToggle.classList.remove('hidden');
        filterOverlay.classList.remove('open');
    }

    if (filtersToggle && filterOverlay && floatingBar) {
        filtersToggle.addEventListener('click', function() {
            if (filterOverlay.classList.contains('open')) {
                closeOverlay();
            } else {
                openOverlay();
            }
        });
    }
    if (closeOverlayBtn && filterOverlay && floatingBar) {
        closeOverlayBtn.addEventListener('click', function() {
            closeOverlay();
        });
    }
    if (mobileFiltersToggle && filterOverlay && floatingBar) {
        mobileFiltersToggle.addEventListener('click', function() {
            closeOverlay();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeFloatingFilterBar();
});

// Show modal with full details for a record
function showAnalysisDetailsModal(analysis) {
    const modal = document.getElementById('details-modal');
    const modalBody = document.getElementById('details-modal-body');
    const closeBtn = document.getElementById('close-details-modal');

    // Determine the risk type based on analysis type
    let typeRisque = 'Potentiel'; // Default for general analyses
    if (analysis.type === 'analyse_mobilite') {
        typeRisque = 'Annoté';
    } else if (analysis.type === 'analyse_verifier') {
        typeRisque = 'Vérifié';
    } else if (analysis.type === 'analyse_denied') {
        typeRisque = 'Fausse alerte';
    }

    // Check if CNE is available (for mobility, verified, and denied analyses)
    const hasCNE = analysis.cne && analysis.cne.trim() !== '';

    // Build details HTML with only the requested fields and French labels
    let html = '<table style="width:100%;font-size:1rem;">';
    // Date
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>Date</td><td style='padding:4px 8px;'>${formatDate(analysis.date || analysis.timestamp) || ''}</td></tr>`;
    // CNE (only if available)
    if (hasCNE) {
        html += `<tr><td style='font-weight:600;padding:4px 8px;'>N° d'Examen</td><td style='padding:4px 8px;'>${analysis.cne}</td></tr>`;
    }
    // Type Risque
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>Type Risque</td><td style='padding:4px 8px;'>${typeRisque}</td></tr>`;
    // Aref
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>Aref</td><td style='padding:4px 8px;'>${analysis.aref || ''}</td></tr>`;
    // DP
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>DP</td><td style='padding:4px 8px;'>${analysis.dp || ''}</td></tr>`;
    // Centre d'examen (lycee)
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>Centre d'examen</td><td style='padding:4px 8px;'>${analysis.lycee || ''}</td></tr>`;
    // Salle
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>Salle</td><td style='padding:4px 8px;'>${analysis.salle || ''}</td></tr>`;
    // Session (matiere)
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>Session</td><td style='padding:4px 8px;'>${analysis.matiere || ''}</td></tr>`;
    // Nbr Détection (batch)
    html += `<tr><td style='font-weight:600;padding:4px 8px;'>Nbr Détection</td><td style='padding:4px 8px;'>${calculateBatchNumber(analysis) || ''}</td></tr>`;
    html += '</table>';
    modalBody.innerHTML = html;
    modal.style.display = 'flex';

    // Close logic
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    // Also close when clicking outside modal content
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}