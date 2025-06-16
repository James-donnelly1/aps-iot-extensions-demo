const { getPublicToken } = require('./aps.js');
const fetch = require('node-fetch');

// ACC API Base URL
const ACC_BASE_URL = 'https://developer.api.autodesk.com';

// Generic API request helper
async function makeAccRequest(endpoint, method = 'GET', body = null) {
    const token = await getPublicToken();
    const response = await fetch(`${ACC_BASE_URL}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`ACC API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`ACC API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
}

// Get all projects
async function getProjects() {
    try {
        const response = await makeAccRequest('/project/v1/hubs');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching ACC projects:', error);
        throw error;
    }
}

// Get project details
async function getProject(projectId) {
    try {
        const response = await makeAccRequest(`/project/v1/hubs/${projectId}/projects`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching project details:', error);
        throw error;
    }
}

// Get issues for a project/container
async function getIssues(containerId, limit = 100) {
    try {
        const response = await makeAccRequest(
            `/construction/issues/v1/containers/${containerId}/issues?limit=${limit}&sort=created_at`
        );
        return response.data || [];
    } catch (error) {
        console.error('Error fetching ACC issues:', error);
        throw error;
    }
}

// Get issue types
async function getIssueTypes(limit = 100) {
    try {
        const response = await makeAccRequest(`/construction/issues/v1/issue-types?limit=${limit}`);
        return response.data || [];
    } catch (error) {
        console.error('Error fetching ACC issue types:', error);
        throw error;
    }
}

// Get assets for a project
async function getAssets(projectId, limit = 100) {
    try {
        const response = await makeAccRequest(
            `/construction/assets/v1/projects/${projectId}/assets?limit=${limit}`
        );
        return response.data || [];
    } catch (error) {
        console.error('Error fetching ACC assets:', error);
        throw error;
    }
}

// Get RFIs (Request for Information)
async function getRFIs(containerId, limit = 100) {
    try {
        const response = await makeAccRequest(
            `/construction/rfis/v1/containers/${containerId}/rfis?limit=${limit}`
        );
        return response.data || [];
    } catch (error) {
        console.error('Error fetching ACC RFIs:', error);
        throw error;
    }
}

// Get cost data
async function getCostData(containerId, limit = 100) {
    try {
        const response = await makeAccRequest(
            `/cost/v1/containers/${containerId}/budgets?limit=${limit}`
        );
        return response.data || [];
    } catch (error) {
        console.error('Error fetching ACC cost data:', error);
        throw error;
    }
}

// Transform ACC data for visualization
function transformDataForVisualization(issues, assets) {
    return {
        sensors: issues.map((issue, index) => ({
            id: issue.id,
            dbId: issue.attributes?.element_id || (1000 + index), // Fallback to sequential IDs
            location: issue.attributes?.position || { x: 0, y: 0, z: 0 },
            sensorType: issue.attributes?.issue_type?.name || 'Issue',
            status: issue.attributes?.status || 'Open',
            priority: issue.attributes?.priority || 'Medium',
            createdAt: issue.attributes?.created_at,
            description: issue.attributes?.title || 'Untitled Issue',
            // Add additional properties for visualization
            temperature: Math.random() * 30 + 20, // Mock temperature data
            humidity: Math.random() * 50 + 30,    // Mock humidity data
            value: getIssueVisualizationValue(issue)
        })),
        assets: assets.map((asset, index) => ({
            id: asset.id,
            dbId: asset.attributes?.element_id || (2000 + index),
            location: asset.attributes?.position || { x: 0, y: 0, z: 0 },
            assetType: asset.attributes?.category?.name || 'Equipment',
            status: asset.attributes?.status || 'Active',
            name: asset.attributes?.name || 'Unnamed Asset',
            createdAt: asset.attributes?.created_at,
            // Add mock sensor data
            temperature: Math.random() * 35 + 15,
            efficiency: Math.random() * 100,
            value: getAssetVisualizationValue(asset)
        }))
    };
}

// Convert issue attributes to visualization values
function getIssueVisualizationValue(issue) {
    const priority = issue.attributes?.priority?.toLowerCase() || 'medium';
    const priorityValues = {
        'high': 85,
        'medium': 50,
        'low': 20
    };
    return priorityValues[priority] || 50;
}

// Convert asset attributes to visualization values
function getAssetVisualizationValue(asset) {
    const status = asset.attributes?.status?.toLowerCase() || 'active';
    const statusValues = {
        'active': 75,
        'inactive': 25,
        'maintenance': 40
    };
    return statusValues[status] || 50;
}

module.exports = {
    getProjects,
    getProject,
    getIssues,
    getIssueTypes,
    getAssets,
    getRFIs,
    getCostData,
    transformDataForVisualization
}; 