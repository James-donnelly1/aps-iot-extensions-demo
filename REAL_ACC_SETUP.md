# Real ACC Project Setup Guide

## Step 1: Get Your APS Application Ready

### Add Required Scopes
1. Go to [APS Developer Portal](https://aps.autodesk.com/myapps)
2. Click on your application
3. Go to **API Access** tab
4. Add these scopes:
   - ✅ `data:read` - Read ACC project data
   - ✅ `data:write` - Write ACC project data (optional)
   - ✅ `account:read` - Read account information
   - ✅ `account:write` - Write account information (optional)

### Important Notes:
- Some scopes require Autodesk approval (1-2 business days)
- You'll receive email confirmation when approved
- `data:read` and `account:read` are essential for basic ACC integration

## Step 2: Find Your ACC Project Information

### Method 1: From ACC Web Interface
1. Open your ACC project at https://acc.autodesk.com
2. Navigate to your specific project
3. Look at the URL pattern:
   ```
   https://acc.autodesk.com/projects/YOUR_PROJECT_ID/...
   ```
4. Copy the PROJECT_ID (36-character UUID)

### Method 2: Using Project Finder Tool
1. Click the "🔍 Find ACC Project" button in your visualization
2. Paste your ACC project URL
3. The tool will extract the Project ID automatically

## Step 3: Update Configuration Files

### Update `public/acc-config.js`:
```javascript
window.ACC_CONFIG = {
    PROJECT_ID: 'your-real-project-id-here',        // Replace with actual ID
    CONTAINER_ID: 'your-real-container-id-here',    // Usually same as PROJECT_ID
    
    DATA_SOURCES: {
        ISSUES: true,          // Enable issues visualization
        ASSETS: true,          // Enable assets visualization
        RFIS: false,          // Enable RFIs (optional)
        COST_DATA: false      // Enable cost data (optional)
    },
    
    VISUALIZATION: {
        REFRESH_INTERVAL: 300000, // 5 minutes
        MAX_ITEMS: 500
    }
};
```

## Step 4: Switch to Real ACC Service

### Update `public/index.html`:
```html
<!-- Comment out mock service -->
<!-- <script src="/acc-service-mock.js"></script> -->

<!-- Enable real service -->
<script src="/acc-service.js"></script>
```

## Step 5: Install Node.js and Start Server

### Install Node.js (if not installed):
1. Download from [nodejs.org](https://nodejs.org)
2. Install the LTS version
3. Restart your terminal

### Start the server:
```bash
npm install
npm start
```

## Step 6: Test the Integration

### Check API Endpoints:
1. `http://localhost:3000/acc/projects` - Should list your projects
2. `http://localhost:3000/acc/issues/YOUR_CONTAINER_ID` - Should show issues
3. `http://localhost:3000/acc/assets/YOUR_PROJECT_ID` - Should show assets

### Expected Results:
- ✅ **200 OK**: API working, data retrieved
- ❌ **403 Forbidden**: Missing scopes, update your APS app
- ❌ **404 Not Found**: Wrong project/container ID
- ❌ **500 Server Error**: Check server logs for details

## Troubleshooting

### Common Issues:

#### 1. "403 Forbidden" Error
**Cause**: Missing APS application scopes
**Fix**: Add `data:read` and `account:read` scopes to your APS app

#### 2. "404 Not Found" Error
**Cause**: Incorrect project/container ID
**Fix**: Use the project finder tool to get correct IDs

#### 3. "No data visible" 
**Cause**: Issues/assets don't have location data
**Fix**: Ensure your ACC issues have coordinate information

#### 4. Authentication errors
**Cause**: Invalid APS credentials
**Fix**: Check `APS_CLIENT_ID` and `APS_CLIENT_SECRET` in your environment

### Debug Steps:

1. **Check APS Token**:
   ```bash
   curl http://localhost:3000/auth/token
   ```

2. **Test ACC Projects**:
   ```bash
   curl http://localhost:3000/acc/projects
   ```

3. **Verify Project Access**:
   ```bash
   curl http://localhost:3000/acc/containers/YOUR_PROJECT_ID
   ```

## Real Data vs Mock Data

### Mock Data (Current):
- 5 predefined issues and assets
- No server API calls required
- Good for testing UI functionality

### Real Data (After Setup):
- Live issues from your ACC project
- Real asset information
- Actual project coordinates and status
- Real-time updates

## Security Considerations

### API Keys:
- Never expose `APS_CLIENT_SECRET` in frontend code
- Keep credentials in environment variables only

### Access Control:
- Ensure users only access projects they're authorized for
- Use proper ACC project permissions

### Data Privacy:
- Be aware of sensitive construction information
- Follow your organization's data handling policies

## Next Steps

Once real ACC integration is working:

1. **Customize Data Types**: Add RFIs, schedules, documents
2. **Enhanced Visualization**: Custom colors and markers for specific issue types
3. **Real-time Notifications**: Alert system for new issues
4. **Reporting**: Export data for project reports
5. **Mobile Access**: Optimize for tablet/phone use in field

## Support Resources

- [ACC API Documentation](https://aps.autodesk.com/developer/overview/autodesk-construction-cloud)
- [APS Community Forum](https://forums.autodesk.com/t5/autodesk-platform-services/ct-p/autodesk-platform-services)
- [ACC Developer Support](https://aps.autodesk.com/support)

Remember: The mock data provides immediate functionality, but real ACC integration requires proper authentication scopes and may take 1-2 business days for Autodesk approval. 