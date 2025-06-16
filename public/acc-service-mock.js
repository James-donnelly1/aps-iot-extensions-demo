// Frontend Mock ACC Service - runs entirely in browser
// This provides immediate demo functionality without server dependencies

class MockACCDataService {
    constructor() {
        this.cache = new Map();
        this.listeners = new Set();
        this.mockData = this.generateMockData();
    }

    generateMockData() {
        return {
            issues: [
                {
                    id: 'issue-001',
                    title: 'Electrical wiring issue in Room 204',
                    description: 'Improper electrical connections found during inspection',
                    status: 'open',
                    priority: 'high',
                    created_at: '2024-01-15T10:30:00Z',
                    attributes: {
                        title: 'Electrical wiring issue in Room 204',
                        description: 'Improper electrical connections found during inspection',
                        status: 'open',
                        priority: 'high',
                        created_at: '2024-01-15T10:30:00Z',
                        element_id: 1234,
                        position: { x: 10.5, y: 15.2, z: 3.0 }
                    }
                },
                {
                    id: 'issue-002',
                    title: 'Concrete crack in foundation',
                    description: 'Small crack observed in the foundation wall',
                    status: 'open',
                    priority: 'medium',
                    created_at: '2024-01-14T14:20:00Z',
                    attributes: {
                        title: 'Concrete crack in foundation',
                        description: 'Small crack observed in the foundation wall',
                        status: 'open',
                        priority: 'medium',
                        created_at: '2024-01-14T14:20:00Z',
                        element_id: 5678,
                        position: { x: -5.3, y: 8.7, z: 0.5 }
                    }
                },
                {
                    id: 'issue-003',
                    title: 'Window installation problem',
                    description: 'Window frame not properly aligned',
                    status: 'open',
                    priority: 'low',
                    created_at: '2024-01-13T09:15:00Z',
                    attributes: {
                        title: 'Window installation problem',
                        description: 'Window frame not properly aligned',
                        status: 'open',
                        priority: 'low',
                        created_at: '2024-01-13T09:15:00Z',
                        element_id: 9012,
                        position: { x: 20.1, y: 25.4, z: 8.2 }
                    }
                },
                {
                    id: 'issue-004',
                    title: 'HVAC duct misalignment',
                    description: 'Ductwork not following approved path',
                    status: 'open',
                    priority: 'high',
                    created_at: '2024-01-12T16:45:00Z',
                    attributes: {
                        title: 'HVAC duct misalignment',
                        description: 'Ductwork not following approved path',
                        status: 'open',
                        priority: 'high',
                        created_at: '2024-01-12T16:45:00Z',
                        element_id: 3456,
                        position: { x: 0.0, y: 12.8, z: 12.0 }
                    }
                },
                {
                    id: 'issue-005',
                    title: 'Plumbing leak detected',
                    description: 'Minor leak in bathroom pipe connection',
                    status: 'closed',
                    priority: 'medium',
                    created_at: '2024-01-10T11:30:00Z',
                    attributes: {
                        title: 'Plumbing leak detected',
                        description: 'Minor leak in bathroom pipe connection',
                        status: 'closed',
                        priority: 'medium',
                        created_at: '2024-01-10T11:30:00Z',
                        element_id: 7890,
                        position: { x: 15.7, y: 18.3, z: 6.1 }
                    }
                }
            ],
            assets: [
                {
                    id: 'asset-001',
                    name: 'HVAC Unit #1',
                    status: 'active',
                    created_at: '2024-01-01T08:00:00Z',
                    attributes: {
                        name: 'HVAC Unit #1',
                        category: { name: 'HVAC Equipment' },
                        status: 'active',
                        created_at: '2024-01-01T08:00:00Z',
                        element_id: 2001,
                        position: { x: 5.0, y: 10.0, z: 15.0 }
                    }
                },
                {
                    id: 'asset-002',
                    name: 'Fire Safety Panel',
                    status: 'active',
                    created_at: '2024-01-01T08:00:00Z',
                    attributes: {
                        name: 'Fire Safety Panel',
                        category: { name: 'Safety Equipment' },
                        status: 'active',
                        created_at: '2024-01-01T08:00:00Z',
                        element_id: 2002,
                        position: { x: -10.0, y: 5.0, z: 4.0 }
                    }
                },
                {
                    id: 'asset-003',
                    name: 'Elevator Motor',
                    status: 'maintenance',
                    created_at: '2024-01-01T08:00:00Z',
                    attributes: {
                        name: 'Elevator Motor',
                        category: { name: 'Vertical Transportation' },
                        status: 'maintenance',
                        created_at: '2024-01-01T08:00:00Z',
                        element_id: 2003,
                        position: { x: 0.0, y: 0.0, z: 20.0 }
                    }
                },
                {
                    id: 'asset-004',
                    name: 'Backup Generator',
                    status: 'inactive',
                    created_at: '2024-01-01T08:00:00Z',
                    attributes: {
                        name: 'Backup Generator',
                        category: { name: 'Electrical Equipment' },
                        status: 'inactive',
                        created_at: '2024-01-01T08:00:00Z',
                        element_id: 2004,
                        position: { x: -15.0, y: -10.0, z: 1.0 }
                    }
                },
                {
                    id: 'asset-005',
                    name: 'Water Pump System',
                    status: 'active',
                    created_at: '2024-01-01T08:00:00Z',
                    attributes: {
                        name: 'Water Pump System',
                        category: { name: 'Plumbing Equipment' },
                        status: 'active',
                        created_at: '2024-01-01T08:00:00Z',
                        element_id: 2005,
                        position: { x: 12.0, y: -5.0, z: 2.5 }
                    }
                }
            ]
        };
    }

    // Initialize the service
    async initialize() {
        console.log('🔧 Mock ACC Data Service initialized (frontend-only)');
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

    // Mock fetch functions that return promises with mock data
    async getProjects() {
        await this.delay(100); // Simulate network delay
        return [{
            id: 'b1250bcf-8fd0-47b2-8851-a3e7b331d13a',
            attributes: {
                name: 'Sample Construction Project',
                description: 'Demo project for ACC integration testing'
            }
        }];
    }

    async getIssues() {
        await this.delay(200);
        console.log('📋 Returning mock issues data');
        return this.mockData.issues;
    }

    async getAssets() {
        await this.delay(200);
        console.log('🏗️ Returning mock assets data');
        return this.mockData.assets;
    }

    async getVisualizationData() {
        await this.delay(300);
        const data = this.transformDataForVisualization(this.mockData.issues, this.mockData.assets);
        this.notifyListeners(data);
        return data;
    }

    // Transform data for visualization (same as server-side)
    transformDataForVisualization(issues, assets) {
        return {
            sensors: issues.map((issue, index) => ({
                id: issue.id,
                dbId: issue.attributes?.element_id || (1000 + index),
                location: issue.attributes?.position || { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, z: Math.random() * 10 },
                sensorType: 'Issue',
                status: issue.attributes?.status || 'open',
                priority: issue.attributes?.priority || 'medium',
                createdAt: issue.attributes?.created_at,
                description: issue.attributes?.title || 'Untitled Issue',
                temperature: Math.random() * 30 + 20,
                humidity: Math.random() * 50 + 30,
                value: this.getIssueVisualizationValue(issue),
                accType: 'issue',
                title: issue.attributes?.title,
                originalIssue: issue
            })),
            assets: assets.map((asset, index) => ({
                id: asset.id,
                dbId: asset.attributes?.element_id || (2000 + index),
                location: asset.attributes?.position || { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10, z: Math.random() * 10 },
                assetType: asset.attributes?.category?.name || 'Equipment',
                status: asset.attributes?.status || 'active',
                name: asset.attributes?.name || 'Unnamed Asset',
                createdAt: asset.attributes?.created_at,
                temperature: Math.random() * 35 + 15,
                efficiency: Math.random() * 100,
                value: this.getAssetVisualizationValue(asset),
                accType: 'asset',
                originalAsset: asset
            }))
        };
    }

    getIssueVisualizationValue(issue) {
        const priority = issue.attributes?.priority?.toLowerCase() || 'medium';
        const priorityValues = { 'high': 85, 'medium': 50, 'low': 20 };
        return priorityValues[priority] || 50;
    }

    getAssetVisualizationValue(asset) {
        const status = asset.attributes?.status?.toLowerCase() || 'active';
        const statusValues = { 'active': 75, 'inactive': 25, 'maintenance': 40 };
        return statusValues[status] || 50;
    }

    async getSensors() {
        const accData = await this.getVisualizationData();
        return this.transformToSensorData(accData);
    }

    async getChannels() {
        const sensors = await this.getSensors();
        return sensors.flatMap(sensor => 
            sensor.channels.map(channel => ({
                ...channel,
                sensorId: sensor.id
            }))
        );
    }

    transformToSensorData(accData) {
        if (!accData || (!accData.sensors && !accData.assets)) {
            return [];
        }

        const sensors = [];
        
        if (accData.sensors) {
            sensors.push(...accData.sensors.map(sensor => ({
                id: sensor.id,
                dbId: sensor.dbId,
                sensorType: sensor.sensorType,
                location: sensor.location,
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
                accType: 'issue',
                status: sensor.status,
                priority: sensor.priority,
                description: sensor.description,
                createdAt: sensor.createdAt
            })));
        }

        if (accData.assets) {
            sensors.push(...accData.assets.map(asset => ({
                id: asset.id,
                dbId: asset.dbId,
                sensorType: asset.assetType,
                location: asset.location,
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
                accType: 'asset',
                status: asset.status,
                name: asset.name,
                createdAt: asset.createdAt
            })));
        }

        return sensors;
    }

    async getSamples(timeRange, resolution) {
        const sensors = await this.getSensors();
        const samples = [];
        
        const start = new Date(timeRange.start);
        const end = new Date(timeRange.end);
        const duration = end - start;
        const steps = Math.min(100, Math.max(10, duration / (resolution || 3600000)));
        
        sensors.forEach(sensor => {
            sensor.channels.forEach(channel => {
                for (let i = 0; i < steps; i++) {
                    const timestamp = new Date(start.getTime() + (duration * i / steps));
                    let value;
                    
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
                            value = 20 + Math.random() * 15;
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

    // Helper function to simulate network delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    startAutoRefresh() {
        console.log('Auto-refresh started (mock data)');
    }

    stopAutoRefresh() {
        console.log('Auto-refresh stopped (mock data)');
    }

    clearCache() {
        this.cache.clear();
    }

    getCacheInfo() {
        return { mock: 'Using frontend mock data' };
    }
}

// Replace the existing accDataService with mock version
window.accDataService = new MockACCDataService();
window.accDataService.initialize();

console.log('🔧 ACC Mock Service loaded - using frontend-only data'); 