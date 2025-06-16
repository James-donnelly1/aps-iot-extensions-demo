// Configuration for Autodesk Construction Cloud integration
// Replace these values with your actual ACC project details

window.ACC_CONFIG = {
    // Your ACC Project/Container IDs
    // You can find these in the ACC URL when viewing your project
    // Format: https://acc.autodesk.com/projects/{PROJECT_ID}/...
    
    // Example project and container IDs (replace with your actual IDs)
    PROJECT_ID: 'b1250bcf-8fd0-47b2-8851-a3e7b331d13a',           // ACC Project ID
    CONTAINER_ID: 'b1250bcf-8fd0-47b2-8851-a3e7b331d13a',       // ACC Container ID (often same as PROJECT_ID)
    
    // Data source selection - choose what data to visualize
    DATA_SOURCES: {
        ISSUES: true,          // Show construction issues
        ASSETS: true,          // Show project assets/equipment
        RFIS: false,          // Show RFIs (Request for Information)
        COST_DATA: false      // Show cost/budget data
    },
    
    // Visualization settings
    VISUALIZATION: {
        // Color coding for different data types
        COLORS: {
            ISSUES: {
                HIGH_PRIORITY: '#FF4444',    // Red for high priority issues
                MEDIUM_PRIORITY: '#FFAA00',  // Orange for medium priority
                LOW_PRIORITY: '#44AA44'      // Green for low priority
            },
            ASSETS: {
                ACTIVE: '#0066CC',           // Blue for active assets
                INACTIVE: '#666666',         // Gray for inactive
                MAINTENANCE: '#CC6600'       // Brown for maintenance
            }
        },
        
        // Default refresh interval for real-time updates (in milliseconds)
        REFRESH_INTERVAL: 300000, // 5 minutes
        
        // Maximum number of items to display
        MAX_ITEMS: 500
    },
    
    // API endpoints (automatically constructed, don't modify)
    get API_ENDPOINTS() {
        return {
            PROJECTS: '/acc/projects',
            PROJECT_DETAILS: `/acc/projects/${this.PROJECT_ID}`,
            ISSUES: `/acc/issues/${this.CONTAINER_ID}`,
            ASSETS: `/acc/assets/${this.PROJECT_ID}`,
            RFIS: `/acc/rfis/${this.CONTAINER_ID}`,
            COST_DATA: `/acc/cost/${this.CONTAINER_ID}`,
            VISUALIZATION_DATA: `/acc/visualization/${this.CONTAINER_ID}/${this.PROJECT_ID}`
        };
    }
};

// Helper function to validate configuration
window.ACC_CONFIG.validate = function() {
    const errors = [];
    
    if (!this.PROJECT_ID || this.PROJECT_ID === 'your-project-id-here') {
        errors.push('PROJECT_ID must be set to your actual ACC project ID');
    }
    
    if (!this.CONTAINER_ID || this.CONTAINER_ID === 'your-container-id-here') {
        errors.push('CONTAINER_ID must be set to your actual ACC container ID');
    }
    
    if (errors.length > 0) {
        console.warn('ACC Configuration Issues:', errors);
        return false;
    }
    
    return true;
}; 