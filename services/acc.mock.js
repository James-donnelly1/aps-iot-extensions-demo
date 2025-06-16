// Mock ACC Data Service - for testing while waiting for API access
// This provides sample data to demonstrate the ACC panel functionality

// Mock Issues Data
const mockIssues = [
    {
        id: 'issue-001',
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
];

// Mock Assets Data
const mockAssets = [
    {
        id: 'asset-001',
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
        attributes: {
            name: 'Water Pump System',
            category: { name: 'Plumbing Equipment' },
            status: 'active',
            created_at: '2024-01-01T08:00:00Z',
            element_id: 2005,
            position: { x: 12.0, y: -5.0, z: 2.5 }
        }
    }
];

// Mock Projects Data
const mockProjects = [
    {
        id: 'b1250bcf-8fd0-47b2-8851-a3e7b331d13a',
        attributes: {
            name: 'Sample Construction Project',
            description: 'Demo project for ACC integration testing'
        }
    }
];

// Mock API Functions
async function getProjects() {
    console.log('📋 Using mock ACC projects data');
    return mockProjects;
}

async function getProject(projectId) {
    console.log(`📋 Using mock ACC project data for: ${projectId}`);
    return mockProjects.filter(p => p.id === projectId);
}

async function getIssues(containerId, limit = 100) {
    console.log(`🔧 Using mock ACC issues data for container: ${containerId}`);
    return mockIssues.slice(0, limit);
}

async function getIssueTypes(limit = 100) {
    console.log('📋 Using mock ACC issue types data');
    return [
        { id: 'electrical', name: 'Electrical' },
        { id: 'structural', name: 'Structural' },
        { id: 'mechanical', name: 'Mechanical' },
        { id: 'plumbing', name: 'Plumbing' },
        { id: 'safety', name: 'Safety' }
    ].slice(0, limit);
}

async function getAssets(projectId, limit = 100) {
    console.log(`🏗️ Using mock ACC assets data for project: ${projectId}`);
    return mockAssets.slice(0, limit);
}

async function getRFIs(containerId, limit = 100) {
    console.log(`📋 Using mock ACC RFIs data for container: ${containerId}`);
    return []; // No mock RFIs for now
}

async function getCostData(containerId, limit = 100) {
    console.log(`💰 Using mock ACC cost data for container: ${containerId}`);
    return []; // No mock cost data for now
}

// Transform mock data for visualization (same as real service)
function transformDataForVisualization(issues, assets) {
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
            // Mock sensor data
            temperature: Math.random() * 30 + 20,
            humidity: Math.random() * 50 + 30,
            value: getIssueVisualizationValue(issue),
            // Preserve original for ACC panel
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
            // Mock sensor data
            temperature: Math.random() * 35 + 15,
            efficiency: Math.random() * 100,
            value: getAssetVisualizationValue(asset),
            // Preserve original for ACC panel
            accType: 'asset',
            originalAsset: asset
        }))
    };
}

function getIssueVisualizationValue(issue) {
    const priority = issue.attributes?.priority?.toLowerCase() || 'medium';
    const priorityValues = { 'high': 85, 'medium': 50, 'low': 20 };
    return priorityValues[priority] || 50;
}

function getAssetVisualizationValue(asset) {
    const status = asset.attributes?.status?.toLowerCase() || 'active';
    const statusValues = { 'active': 75, 'inactive': 25, 'maintenance': 40 };
    return statusValues[status] || 50;
}

// Fake token function for mock service
async function getAccToken() {
    return { access_token: 'mock-token', expires_at: Date.now() + 3600000 };
}

module.exports = {
    getAccToken,
    getProjects,
    getProject,
    getIssues,
    getIssueTypes,
    getAssets,
    getRFIs,
    getCostData,
    transformDataForVisualization
}; 