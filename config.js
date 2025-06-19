const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

let { APS_CLIENT_ID, APS_CLIENT_SECRET, PORT } = process.env;
if (!APS_CLIENT_ID || !APS_CLIENT_SECRET) {
    console.warn('Missing some of the environment variables.');
    process.exit(1);
}
PORT = PORT || 3000;

// Centralized Configuration
const CONFIG = {
    // Server Configuration
    server: {
        port: PORT,
        staticPath: 'public'
    },

    // APS (Autodesk Platform Services) Configuration
    aps: {
        clientId: APS_CLIENT_ID,
        clientSecret: APS_CLIENT_SECRET,
        // Model Configuration
        model: {
            urn: 'dXJuOmFkc2sud2lwcHJvZDpmcy5maWxlOnZmLlVuSzBqTmRMU3JhZlRfakdPR1Fnb1E_dmVyc2lvbj0xMA',
            view: '', // '37fe6109-0f64-447a-bf7f-b984f9fecf23-001bd202'
            defaultFloorIndex: 0
        },
        // Secondary model (if needed)
        secondaryModel: {
            urn: 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6amFtZXMtYnVja2V0LXRlc3QvQm9zdG9uJTIwTW9ja3VwJTIwV2FsbCUyMDIuMF9BcmNoX1IyNS5ydnQ',
            view: '',
            enabled: false
        }
    },

    // Data Visualization Configuration
    dataVisualization: {
        // Default time range for data queries
        defaultTimeRange: {
            start: new Date('2022-01-01'),
            end: new Date('2022-01-30')
        },
        
        // Update intervals and performance settings
        updateInterval: 500, // milliseconds
        maxTrailLength: 1000,
        spriteSize: 32
    },

    // Calibration System Configuration (Single calibration only)
    calibration: {
        viewerDistance: 1.52,
        buildingDistance: 252,
        scaleFactor: 1.52 / 252,
        isCalibrated: true
    },

    // Sprite Configuration
    sprites: {
        configurations: [
            {
                id: 'sprite1',
                positionFile: '/position-data.txt',
                startOffset: { x: 0, y: 0, z: 0 },
                color: { r: 1.0, g: 0.0, b: 0.0 },
                trailColor: { r: 1.0, g: 0.5, b: 0.5 }
            },
            {
                id: 'sprite2',
                positionFile: '/position-data-2.txt',
                startOffset: { x: 15, y: 0, z: 0 },
                color: { r: 0.0, g: 1.0, b: 0.0 },
                trailColor: { r: 0.5, g: 1.0, b: 0.5 }
            }
        ],
        trailEnabled: true
    },

    // IoT Sensor Configuration
    iot: {
        // Default sensor definitions
        sensors: {
            'sensor-1': {
                name: 'Josh',
                description: 'RTLS sensor.',
                groupName: 'Level 1',
                location: { x: 0, y: 0, z: 0 },
                objectId: 1
            }
        },
        
        // Channel definitions
        channels: {
            'temp': {
                name: 'Temperature',
                description: 'External temperature in degrees Celsius.',
                type: 'double',
                unit: '°C',
                min: 18.0,
                max: 28.0
            },
            'co2': {
                name: 'CO₂',
                description: 'Level of carbon dioxide.',
                type: 'double',
                unit: 'ppm',
                min: 482.81,
                max: 640.00
            }
        },

        // Data generation settings for mocked data
        dataGeneration: {
            defaultResolution: 32,
            temperatureRange: { min: 18.0, max: 28.0, delta: 1.0 },
            co2Range: { min: 540.0, max: 600.0, delta: 5.0 }
        }
    },

    // Extension Configuration
    extensions: {
        // Default enabled extensions
        enabled: [
            'SensorSpritesExtension',
            'PositionsExtension', 
            'DatumMarkerExtension'
        ],
        
        // Available but disabled by default
        available: [
            'SensorListExtension',
            'SensorDetailExtension',
            'SensorHeatmapsExtension'
        ]
    },

    // UI Configuration
    ui: {
        // Toast notification settings
        notifications: {
            defaultDuration: 4000,
            errorDuration: 6000
        },
        
        // Loading states
        loadingMessages: {
            auth: 'Checking authentication...',
            viewer: 'Initializing viewer...',
            model: 'Loading 3D model...',
            data: 'Setting up data visualization...'
        }
    }
};

// Export for Node.js (server-side)
module.exports = CONFIG;

// Also export individual legacy values for backward compatibility
module.exports.APS_CLIENT_ID = APS_CLIENT_ID;
module.exports.APS_CLIENT_SECRET = APS_CLIENT_SECRET;
module.exports.PORT = PORT;
