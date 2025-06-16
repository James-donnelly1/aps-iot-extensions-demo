# Autodesk Construction Cloud Integration Setup Guide

## Overview

This guide will help you connect your Autodesk Construction Cloud (ACC) project data to your data visualization application. The integration allows you to visualize construction issues, assets, RFIs, and other project data directly on your 3D models.

## Prerequisites

1. **Autodesk Construction Cloud Account**: You need an active ACC account with project access
2. **APS Application**: Your existing APS application needs additional scopes for ACC
3. **ACC Project Access**: You must have access to the ACC project you want to visualize

## Step 1: Update Your APS Application Scopes

1. Go to [APS Developer Portal](https://aps.autodesk.com/myapps)
2. Select your existing application
3. Add the following scopes:
   - `data:read` - Read project data
   - `data:write` - Write project data (optional, for creating issues)
   - `account:read` - Read account information

## Step 2: Find Your ACC Project and Container IDs

### Method 1: From ACC URL
1. Open your ACC project in a web browser
2. Look at the URL: `https://acc.autodesk.com/projects/{PROJECT_ID}/...`
3. Copy the `PROJECT_ID` from the URL

### Method 2: Using the API
1. Install dependencies: `yarn install`
2. Start the server: `yarn start`
3. Navigate to: `http://localhost:3000/acc/projects`
4. Find your project in the JSON response and note the `id`

### Finding Container ID
The container ID is typically the same as the project ID for most ACC data types (issues, RFIs, etc.).

## Step 3: Configure Your ACC Settings

1. Open `public/acc-config.js`
2. Replace the placeholder values:

```javascript
window.ACC_CONFIG = {
    PROJECT_ID: 'your-actual-project-id-here',
    CONTAINER_ID: 'your-actual-container-id-here',
    
    // Enable/disable data sources
    DATA_SOURCES: {
        ISSUES: true,          // Construction issues
        ASSETS: true,          // Project assets/equipment
        RFIS: false,          // Request for Information
        COST_DATA: false      // Cost/budget data
    },
    
    // Visualization settings
    VISUALIZATION: {
        REFRESH_INTERVAL: 300000, // 5 minutes
        MAX_ITEMS: 500
    }
};
```

## Step 4: Test the Integration

1. Start your server: `yarn start`
2. Open your browser to `http://localhost:3000`
3. Open browser console to check for any errors
4. Test the API endpoints:
   - `http://localhost:3000/acc/projects` - List all projects
   - `http://localhost:3000/acc/issues/YOUR_CONTAINER_ID` - Get issues
   - `http://localhost:3000/acc/assets/YOUR_PROJECT_ID` - Get assets

## Step 5: Understanding the Data Flow

### Backend (Node.js)
- `services/acc.js` - Handles ACC API calls
- `server.js` - Provides REST endpoints for frontend

### Frontend (Browser)
- `acc-config.js` - Configuration settings
- `acc-service.js` - Frontend service for data fetching
- Existing visualization components automatically use ACC data

## Data Types and Visualization

### Issues
- **Visualization**: Displayed as colored markers on 3D model
- **Color Coding**: 
  - Red: High priority issues
  - Orange: Medium priority issues
  - Green: Low priority issues
- **Data**: Title, description, status, priority, location, created date

### Assets
- **Visualization**: Displayed as equipment markers on 3D model
- **Color Coding**:
  - Blue: Active assets
  - Gray: Inactive assets
  - Brown: Assets under maintenance
- **Data**: Name, type, status, location, efficiency data

### RFIs (Optional)
- **Visualization**: Similar to issues but with different color scheme
- **Data**: Title, description, status, responses, due date

## Troubleshooting

### Common Issues

1. **"ACC configuration is invalid"**
   - Check that PROJECT_ID and CONTAINER_ID are set correctly
   - Verify IDs are valid strings, not placeholder text

2. **"Error fetching ACC data"**
   - Verify your APS application has the correct scopes
   - Check that you have access to the specified ACC project
   - Ensure your access token has the required permissions

3. **"No data visible on model"**
   - Verify issues/assets have location data in ACC
   - Check that the model URN in `config.js` matches your ACC project model
   - Confirm the dbId mappings are correct

4. **Authentication Errors**
   - Ensure APS_CLIENT_ID and APS_CLIENT_SECRET are set correctly
   - Verify your APS application is not expired or disabled

### API Endpoints for Testing

Use these endpoints to verify your integration:

```bash
# Get all projects
curl http://localhost:3000/acc/projects

# Get issues for a container
curl http://localhost:3000/acc/issues/YOUR_CONTAINER_ID

# Get assets for a project
curl http://localhost:3000/acc/assets/YOUR_PROJECT_ID

# Get visualization data (combined)
curl http://localhost:3000/acc/visualization/YOUR_CONTAINER_ID/YOUR_PROJECT_ID
```

## Advanced Configuration

### Custom Data Mapping
You can modify the data transformation in `services/acc.js`:

```javascript
// Custom transformation for your specific ACC data structure
function transformDataForVisualization(issues, assets) {
    // Your custom logic here
    return {
        sensors: customIssueMapping(issues),
        assets: customAssetMapping(assets)
    };
}
```

### Real-time Updates
Enable automatic data refresh:

```javascript
// In your frontend code
window.accDataService.startAutoRefresh(); // Starts periodic updates
window.accDataService.stopAutoRefresh();  // Stops updates
```

### Custom Visualization
Extend the visualization by modifying the DataViz extension in `public/extensions/`.

## API Reference

### ACC Service Methods

```javascript
// Get all projects
const projects = await window.accDataService.getProjects();

// Get issues
const issues = await window.accDataService.getIssues();

// Get assets
const assets = await window.accDataService.getAssets();

// Get visualization-ready data
const vizData = await window.accDataService.getVisualizationData();

// Start/stop auto-refresh
window.accDataService.startAutoRefresh();
window.accDataService.stopAutoRefresh();
```

## Security Considerations

1. **API Keys**: Never expose your APS_CLIENT_SECRET in frontend code
2. **Access Control**: Ensure users only access projects they're authorized to view
3. **Data Sensitivity**: Be aware of confidential project information in your visualizations
4. **Token Management**: Tokens are automatically refreshed by the backend

## Support

For additional help:
1. Check the [ACC API Documentation](https://aps.autodesk.com/developer/overview/autodesk-construction-cloud)
2. Visit the [APS Community Forum](https://forums.autodesk.com/t5/autodesk-platform-services/ct-p/autodesk-platform-services)
3. Review the [ACC Integration Guide](https://aps.autodesk.com/autodesk-construction-cloud-apis-integrations)

## What's Next?

Once your integration is working:
1. Customize the visualization colors and styles
2. Add more data types (schedules, documents, etc.)
3. Implement real-time notifications for new issues
4. Create custom dashboards and reports
5. Integrate with other construction tools in your workflow 