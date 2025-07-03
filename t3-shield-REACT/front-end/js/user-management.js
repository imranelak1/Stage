// User management and role-based access control
class UserManager {
    constructor() {
        this.currentUser = null;
        this.userAref = null;
        this.isArefAdmin = false;
        this.isSuperAdmin = false;
    }

    // Get current user information
    async getCurrentUser() {
        try {
            const response = await fetch('/t3shield/api/current-user');
            if (response.ok) {
                this.currentUser = await response.json();
                this.isArefAdmin = this.currentUser.profile_id === 4;
                this.isSuperAdmin = this.currentUser.profile_id === 1;
                this.userAref = this.currentUser.codeAref;
                
                
                
                
                
                
                return this.currentUser;
            } else {
                console.error('Failed to get current user');
                return null;
            }
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Check if user is AREF admin
    isUserArefAdmin() {
        return this.isArefAdmin;
    }

    // Check if user is super admin
    isUserSuperAdmin() {
        return this.isSuperAdmin;
    }

    // Get user's AREF code
    getUserAref() {
        return this.userAref;
    }

    // Apply role-based UI restrictions
    applyRoleBasedRestrictions() {
        if (this.isArefAdmin) {
            this.applyArefAdminRestrictions();
        }
    }

    // Apply restrictions for AREF admin users
    applyArefAdminRestrictions() {
        
        
        // Hide elements that should not be visible to AREF admins
        const elementsToHide = [
            '.admin-only', // Add this class to elements that should be hidden
            '#export-button', // Example: hide export button
            '#settings-button' // Example: hide settings button
        ];
        
        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
            });
        });

        // Modify map behavior for AREF admin
        if (window.map) {
            this.setupArefAdminMapBehavior();
        }
    }

    // Setup map behavior for AREF admin
    setupArefAdminMapBehavior() {
        if (!this.isArefAdmin || !this.userAref) return;

        

        // Wait for map and provinces data to be available
        const waitForMap = () => {
            if (window.map && window.provincesLayer) {
                this.applyArefAdminMapRestrictions();
            } else {
                setTimeout(waitForMap, 100);
            }
        };
        waitForMap();
    }

    // Apply AREF admin map restrictions
    applyArefAdminMapRestrictions() {
        if (!window.map || !window.provincesLayer) return;

        

        // Fit map to the provinces layer bounds
        const bounds = window.provincesLayer.getBounds();
        if (bounds.isValid()) {
            window.map.fitBounds(bounds, { padding: [20, 20] });
            
            // Set minimum zoom to prevent zooming out too far from provinces
            const currentZoom = window.map.getZoom();
            window.map.setMinZoom(Math.max(currentZoom - 1, 7)); // Allow one level zoom out, minimum 7
            
            console.log('Zoomed to AREF provinces with min zoom:', window.map.getMinZoom());
        }

        // Restrict map navigation
        this.restrictMapNavigation();
    }

    // Zoom to user's region
    zoomToUserRegion(region) {
        if (!window.map) return;

        // Find the region feature in the GeoJSON
        if (moroccoRegionsGeoJSON) {
            const regionFeature = moroccoRegionsGeoJSON.features.find(feature => {
                const regionId = getRegionIdFromFeature(feature);
                return regionId === region.id;
            });

            if (regionFeature) {
                // Zoom to the region
                const bounds = L.geoJSON(regionFeature).getBounds();
                window.map.fitBounds(bounds, { padding: [20, 20] });
                
                // Set minimum zoom to prevent zooming out too far
                window.map.setMinZoom(window.map.getZoom());
                
                
            }
        }
    }

    // Restrict map navigation for AREF admin
    restrictMapNavigation() {
        if (!window.map) return;

        // Override zoom end to prevent zooming out too far
        window.map.off('zoomend');
        window.map.on('zoomend', function() {
            const currentZoom = window.map.getZoom();
            const minZoom = window.map.getMinZoom();
            
            // If user tries to zoom out too far, zoom back in
            if (currentZoom < minZoom) {
                window.map.setZoom(minZoom);
            }
        });

        // Override move end to keep user within their region
        window.map.off('moveend');
        window.map.on('moveend', function() {
            // This could be enhanced to keep the map centered on the user's region
            // For now, we just prevent excessive movement
        });
    }

    // Initialize user management
    async initialize() {
        await this.getCurrentUser();
        this.applyRoleBasedRestrictions();
        return this.currentUser;
    }
}

// Create global user manager instance
const userManager = new UserManager();

// Initialize user management when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    await userManager.initialize();
}); 