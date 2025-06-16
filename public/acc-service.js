// ACC Data Service for Frontend
// Handles fetching and processing Autodesk Construction Cloud data

class ACCDataService {
    constructor() {
        this.cache = new Map();
        this.refreshInterval = null;
        this.listeners = new Set();
    }

    // Initialize the service
    async initialize() {
        if (!window.ACC_CONFIG) {
            throw new Error('ACC_CONFIG not found. Please include acc-config.js');
        }
        
        if (!window.ACC_CONFIG.validate()) {
            throw new Error('ACC configuration is invalid. Please check acc-config.js');
        }
        
        console.log('ACC Data Service initialized');
        return this;
    }

    // Add event listener for data updates
    addEventListener(callback) {
        this.listeners.add(callback);
    }

    // Remove event listener
    removeEventListener(callback) {
        this.listeners.delete(callback);
    }

    // Notify all listeners of data update
    notifyListeners(data) {
        this.listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in ACC data listener:', error);
            }
        });
    }

    // Fetch all ACC projects
    async getProjects() {
        try {
            const response = await fetch(window.ACC_CONFIG.API_ENDPOINTS.PROJECTS);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching ACC projects:', error);
            throw error;
        }
    }

    // Fetch issues for the configured container
    async getIssues() {
        const cacheKey = 'issues';
        
        try {
            const response = await fetch(window.ACC_CONFIG.API_ENDPOINTS.ISSUES);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching ACC issues:', error);
            // Return cached data if available
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.warn('Using cached issues data');
                return cached.data;
            }
            throw error;
        }
    }

    // Fetch assets for the configured project
    async getAssets() {
        const cacheKey = 'assets';
        
        try {
            const response = await fetch(window.ACC_CONFIG.API_ENDPOINTS.ASSETS);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.error('Error fetching ACC assets:', error);
            // Return cached data if available
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.warn('Using cached assets data');
                return cached.data;
            }
            throw error;
        }
    }

    // Fetch visualization data (processed for DataViz extension)
    async getVisualizationData() {
        const cacheKey = 'visualization';
        
        try {
            const response = await fetch(window.ACC_CONFIG.API_ENDPOINTS.VISUALIZATION_DATA);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            // Notify listeners of new data
            this.notifyListeners(data);
            
            return data;
        } catch (error) {
            console.error('Error fetching ACC visualization data:', error);
            // Return cached data if available
            const cached = this.cache.get(cacheKey);
            if (cached) {
                console.warn('Using cached visualization data');
                return cached.data;
            }
            throw error;
        }
    }

    // Start auto-refresh for real-time updates
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        const interval = window.ACC_CONFIG.VISUALIZATION.REFRESH_INTERVAL;
        this.refreshInterval = setInterval(async () => {
            try {
                await this.getVisualizationData();
                console.log('ACC data refreshed automatically');
            } catch (error) {
                console.error('Auto-refresh failed:', error);
            }
        }, interval);

        console.log(`Auto-refresh started (${interval / 1000}s interval)`);
    }

    // Stop auto-refresh
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('Auto-refresh stopped');
        }
    }

    // Transform ACC data for compatibility with existing IoT mock structure
    transformToSensorData(accData) {
        if (!accData || (!accData.sensors && !accData.assets)) {
            return [];
        }

        const sensors = [];
        
        // Add issues as sensors
        if (accData.sensors) {
            sensors.push(...accData.sensors.map(sensor => ({
                id: sensor.id,
                dbId: sensor.dbId,
                sensorType: sensor.sensorType,
                location: sensor.location,
                // Add required properties for compatibility
                channels: [
                    {
                        id: `${sensor.id}_priority`,
                        name: 'Priority Level',
                        description: `Issue priority: ${sensor.priority}`,
                        type: 'double',
                        unit: 'priority'
                    },
                    {
                        id: `${sensor.id}_age`,
                        name: 'Issue Age',
                        description: 'Days since issue was created',
                        type: 'double',
                        unit: 'days'
                    }
                ],
                // Custom properties
                accType: 'issue',
                status: sensor.status,
                priority: sensor.priority,
                description: sensor.description,
                createdAt: sensor.createdAt
            })));
        }

        // Add assets as sensors
        if (accData.assets) {
            sensors.push(...accData.assets.map(asset => ({
                id: asset.id,
                dbId: asset.dbId,
                sensorType: asset.assetType,
                location: asset.location,
                // Add required properties for compatibility
                channels: [
                    {
                        id: `${asset.id}_efficiency`,
                        name: 'Efficiency',
                        description: `Asset efficiency: ${asset.status}`,
                        type: 'double',
                        unit: 'percent'
                    },
                    {
                        id: `${asset.id}_temperature`,
                        name: 'Temperature',
                        description: 'Asset operating temperature',
                        type: 'double',
                        unit: '°C'
                    }
                ],
                // Custom properties
                accType: 'asset',
                status: asset.status,
                name: asset.name,
                createdAt: asset.createdAt
            })));
        }

        return sensors;
    }

    // Get sensor data in IoT mock format for compatibility
    async getSensors() {
        try {
            const accData = await this.getVisualizationData();
            return this.transformToSensorData(accData);
        } catch (error) {
            console.error('Error getting sensors from ACC:', error);
            return [];
        }
    }

    // Get channels for compatibility with existing timeline
    async getChannels() {
        const sensors = await this.getSensors();
        return sensors.flatMap(sensor => 
            sensor.channels.map(channel => ({
                ...channel,
                sensorId: sensor.id
            }))
        );
    }

    // Generate sample data for timeline (mock data for demonstration)
    async getSamples(timeRange, resolution) {
        const sensors = await this.getSensors();
        const samples = [];
        
        const start = new Date(timeRange.start);
        const end = new Date(timeRange.end);
        const duration = end - start;
        const steps = Math.min(100, Math.max(10, duration / (resolution || 3600000))); // Default 1 hour resolution
        
        sensors.forEach(sensor => {
            sensor.channels.forEach(channel => {
                for (let i = 0; i < steps; i++) {
                    const timestamp = new Date(start.getTime() + (duration * i / steps));
                    let value;
                    
                    // Generate realistic sample data based on ACC data
                    if (sensor.accType === 'issue') {
                        if (channel.unit === 'priority') {
                            const priorities = { 'high': 85, 'medium': 50, 'low': 20 };
                            value = priorities[sensor.priority?.toLowerCase()] || 50;
                        } else if (channel.unit === 'days') {
                            value = sensor.createdAt ? 
                                Math.floor((Date.now() - new Date(sensor.createdAt)) / (1000 * 3600 * 24)) : 
                                Math.random() * 30;
                        }
                    } else if (sensor.accType === 'asset') {
                        if (channel.unit === 'percent') {
                            const efficiencies = { 'active': 85, 'inactive': 0, 'maintenance': 45 };
                            value = efficiencies[sensor.status?.toLowerCase()] || 50;
                        } else if (channel.unit === '°C') {
                            value = 20 + Math.random() * 15; // 20-35°C range
                        }
                    }
                    
                    samples.push({
                        channelId: channel.id,
                        timestamp: timestamp.toISOString(),
                        value: value || Math.random() * 100
                    });
                }
            });
        });
        
        return samples;
    }

    // Clear all cached data
    clearCache() {
        this.cache.clear();
        console.log('ACC data cache cleared');
    }

    // Get cache info for debugging
    getCacheInfo() {
        const info = {};
        this.cache.forEach((value, key) => {
            info[key] = {
                size: JSON.stringify(value.data).length,
                timestamp: new Date(value.timestamp).toISOString(),
                age: Date.now() - value.timestamp
            };
        });
        return info;
    }
}

// Create global instance
window.accDataService = new ACCDataService();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.accDataService.initialize().catch(console.error);
    });
} else {
    window.accDataService.initialize().catch(console.error);
} 