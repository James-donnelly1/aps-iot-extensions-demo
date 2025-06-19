// Client-side Configuration
// This file mirrors the server-side config.js structure for browser use

// Import the server config (this will be replaced by build process or server-side rendering)
// For now, we'll duplicate the configuration here for client-side access

// Dynamic Configuration Loader
// Fetches configuration from server - NO hardcoded values!

let CONFIG = null;

// Load configuration from server
async function loadConfig() {
    if (CONFIG) {
        return CONFIG; // Return cached config
    }
    
    try {
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
        }
        CONFIG = await response.json();
        console.log('✅ Configuration loaded from server');
        return CONFIG;
    } catch (error) {
        console.error('❌ Failed to load configuration from server:', error);
        throw new Error(`Configuration unavailable: ${error.message}. Please ensure the server is running and accessible at the correct URL.`);
    }
}

// Export the config loader and CONFIG
export { loadConfig, CONFIG };

// Simple getter functions (only work after loadConfig() succeeds)
export const getConfig = () => CONFIG;
export const getApsModelUrn = () => CONFIG?.aps?.model?.urn;
export const getApsModelView = () => CONFIG?.aps?.model?.view;
export const getDefaultTimeRange = () => CONFIG?.dataVisualization?.defaultTimeRange;

// Legacy exports for backward compatibility (removed - use CONFIG object directly)
