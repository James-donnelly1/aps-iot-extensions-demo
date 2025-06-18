# How to Use 2D Floor Plan Visualization

## Overview
Your visualization can now display sensor data on a 2D floor plan drawing! There are several ways to implement this:

## Method 1: Using 2D Views from Your Revit Model (Recommended)

### Step 1: Discover Available Views
1. Load your application in the browser
2. Open the browser's Developer Console (F12)
3. Run this command to discover available 2D views:
```javascript
discoverModelViews('dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6amFtZXMtYnVja2V0LXRlc3QvQ2xvdWRfQVJDSC1TR0FfQURTS18oRkxSJTIwMS0zJTIwKyUyMDYpX0lvQ19Ud2luLnJ2dA');
```

### Step 2: Configure the 2D View
1. Look for 2D floor plan views in the console output
2. Copy the GUID of your desired floor plan view
3. Update `public/config.js`:
```javascript
export const APS_MODEL_VIEW = 'your-floor-plan-view-guid-here';
```

## Method 2: Using a Custom Floor Plan Image

### Step 1: Prepare Your Floor Plan Image
1. Export or create a floor plan image (PNG, JPG, or SVG)
2. Place it in the `public/` folder (e.g., `public/floor-plan.png`)

### Step 2: Configure Coordinate Mapping
Update `public/config.js`:
```javascript
export const USE_2D_FLOOR_PLAN = true;

export const FLOOR_PLAN_CONFIG = {
    imagePath: '/floor-plan.png',
    coordinateMapping: {
        modelBounds: {
            // These are the 3D model coordinates that map to your floor plan
            minX: 0, maxX: 100,      // Replace with your model's X range
            minY: 0, maxY: 100,      // Replace with your model's Y range
            minZ: 0, maxZ: 10        // Z range for floor filtering
        },
        imageBounds: {
            width: 800, height: 600  // Your floor plan image dimensions
        }
    }
};
```

### Step 3: Calibrate Coordinate Mapping
1. Use your sensor locations to calibrate the mapping
2. Check the browser console for coordinate conversion logs
3. Adjust the `modelBounds` values until sensors appear in correct positions

## Method 3: Using Both 3D and 2D Views

The application now includes a toggle button that allows switching between 3D and 2D modes:

1. **3D Mode**: Traditional 3D model visualization
2. **2D Mode**: Custom 2D floor plan with sensor overlay

### Using the Toggle Feature
- Click the "2D Floor Plan" button in the toolbar to activate the extension
- Click the "Toggle 2D/3D View" button to switch between modes
- Sensors will be displayed as clickable markers on the 2D floor plan

## Features of 2D Floor Plan Mode

### Interactive Elements
- **Sensor Markers**: Clickable circles showing sensor locations
- **Sensor Labels**: Sensor IDs displayed above markers
- **Legend**: Shows current mode and sensor count
- **Responsive**: Automatically adjusts to window size

### Customization Options
You can customize the 2D visualization by modifying the `FloorPlan2DExtension.js`:

#### Change Sensor Appearance
```javascript
_getSensorColor(sensor) {
    // Color sensors based on their data or type
    if (sensor.type === 'temperature') return '#ff0000';
    if (sensor.type === 'humidity') return '#0000ff';
    return '#00ff00'; // Default green
}
```

#### Add Data-Driven Styling
```javascript
_getSensorColor(sensor) {
    // Get current sensor value
    const currentTime = new Date();
    const samples = this.dataView.getSamples(sensor.id, 'temperature');
    
    if (samples && samples.values.length > 0) {
        const latestValue = samples.values[samples.values.length - 1];
        
        // Color based on temperature ranges
        if (latestValue > 75) return '#ff0000'; // Hot - red
        if (latestValue > 65) return '#ffff00'; // Warm - yellow
        return '#00ff00'; // Cool - green
    }
    
    return '#cccccc'; // No data - gray
}
```

## Troubleshooting

### Issue: Sensors appear in wrong locations
**Solution**: Adjust the coordinate mapping in `config.js`:
```javascript
modelBounds: {
    minX: actual_min_x_from_your_model,
    maxX: actual_max_x_from_your_model,
    minY: actual_min_y_from_your_model,
    maxY: actual_max_y_from_your_model,
    minZ: floor_min_z,
    maxZ: floor_max_z
}
```

### Issue: Floor plan image doesn't load
**Solution**: 
1. Check the image path in `config.js`
2. Ensure the image file exists in the `public/` folder
3. Check browser console for loading errors

### Issue: No 2D views found in Revit model
**Solution**: 
1. Check if your Revit model contains floor plan views
2. Try uploading a model that includes 2D drawings/sheets
3. Use Method 2 (custom floor plan image) instead

## Examples

### Example 1: Office Floor Plan
```javascript
export const FLOOR_PLAN_CONFIG = {
    imagePath: '/office-floor-plan.png',
    coordinateMapping: {
        modelBounds: {
            minX: -50, maxX: 150,    // 200-unit wide building
            minY: -75, maxY: 125,    // 200-unit deep building
            minZ: 0, maxZ: 12        // Ground floor (0-12 feet)
        },
        imageBounds: {
            width: 1200, height: 800 // High-res floor plan
        }
    }
};
```

### Example 2: Multi-Floor Building
```javascript
// Filter sensors by floor using the existing floor filtering
dataView.floor = {
    zMin: 0,   // Ground floor minimum
    zMax: 12   // Ground floor maximum
};
```

## Integration with Existing Features

The 2D floor plan mode integrates with your existing:
- **Sensor data visualization**
- **Timeline controls**
- **Data filtering**
- **Sensor interaction callbacks**

All your existing sensor data, animations, and interactions will work in 2D mode! 