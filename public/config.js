//export const APS_MODEL_URN = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6amFtZXMtYnVja2V0LXRlc3QvQm9zdG9uJTIwTW9ja3VwJTIwV2FsbCUyMDIuMF9BcmNoX1IyNS5ydnQ';
export const APS_MODEL_URN = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6amFtZXMtYnVja2V0LXRlc3QvQ2xvdWRfQVJDSC1TR0FfQURTS18oRkxSJTIwMS0zJTIwKyUyMDYpX0lvQ19Ud2luLnJ2dA';

// For 2D floor plan view, set this to the GUID of a specific floor plan view from your Revit model
// Leave empty ('') for default 3D geometry
// To find available views, check the viewer console or use Model Derivative API
export const APS_MODEL_VIEW = '';

// Alternative: Set to '2d' to force 2D viewing mode for drawings/sheets
// export const APS_MODEL_VIEW = '2d';

export const APS_MODEL_DEFAULT_FLOOR_INDEX = 0;

// For 2D visualization mode - set to true to enable 2D canvas overlay instead of 3D viewer
export const USE_2D_FLOOR_PLAN = false;

// 2D Floor plan configuration
export const FLOOR_PLAN_CONFIG = {
    // Path to your 2D floor plan image (JPG, PNG, SVG)
    // Set to null or empty string to use default grid background
    imagePath: null, // Change to '/floor-plan.png' when you add your floor plan image
    // Coordinate mapping from 3D model coordinates to 2D image coordinates
    coordinateMapping: {
        // Model bounds (3D coordinates)
        modelBounds: {
            minX: 0, maxX: 100,
            minY: 0, maxY: 100,
            minZ: 0, maxZ: 10
        },
        // Image dimensions and scaling
        imageBounds: {
            width: 800, height: 600
        }
    }
};

// Second model configuration
// export const APS_MODEL_URN_SECOND = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6amFtZXMtYnVja2V0LXRlc3QvQm9zdG9uJTIwTW9ja3VwJTIwV2FsbCUyMDIuMF9BcmNoX1IyNS5ydnQ';
// export const APS_MODEL_VIEW_SECOND = '';

export const DEFAULT_TIMERANGE_START = new Date('2022-01-01');
export const DEFAULT_TIMERANGE_END = new Date('2022-01-30');
