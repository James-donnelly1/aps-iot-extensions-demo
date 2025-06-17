import { initViewer, loadModel, loadAdditionalModel, adjustPanelStyle } from './viewer.js';
import {
    SensorListExtensionID,
    SensorSpritesExtensionID,
    SensorDetailExtensionID,
    SensorHeatmapsExtensionID,
    PositionsExtensionID
} from './viewer.js';
import { initTimeline } from './timeline.js';
import { MyDataView } from './dataview.js';
import {
    APS_MODEL_URN,
    APS_MODEL_VIEW,
    // APS_MODEL_URN_SECOND,
    // APS_MODEL_VIEW_SECOND,
    APS_MODEL_DEFAULT_FLOOR_INDEX,
    DEFAULT_TIMERANGE_START,
    DEFAULT_TIMERANGE_END
} from './config.js';

const EXTENSIONS = [
    // SensorListExtensionID,     // Commented out to hide sensors list
    SensorSpritesExtensionID,
    // SensorDetailExtensionID,  // Commented out to hide detail box
    // SensorHeatmapsExtensionID,
    PositionsExtensionID
];

// Forma-style toast notifications
function showFormaToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `forma-toast ${type}`;
    
    const icons = {
        success: '✓',
        error: '⚠',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <div class="forma-toast-content">
            <div class="forma-toast-icon">${icons[type] || icons.info}</div>
            <div class="forma-toast-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// Enhanced loading handler with Forma styling
function updateLoadingState(isLoading, message = 'Loading...') {
    const loadingElement = document.getElementById('viewerLoading');
    const loadingText = loadingElement.querySelector('.forma-loading-text');
    
    if (isLoading) {
        if (loadingText) {
            loadingText.textContent = message;
        }
        loadingElement.classList.remove('hidden');
        loadingElement.setAttribute('aria-hidden', 'false');
    } else {
        loadingElement.classList.add('hidden');
        loadingElement.setAttribute('aria-hidden', 'true');
    }
}

// Enhanced error handler with Forma styling
function handleError(error, context = 'Application') {
    console.error(`${context} Error:`, error);
    
    const errorMessage = error.message || 'An unexpected error occurred';
    showFormaToast(`${context}: ${errorMessage}`, 'error', 6000);
    
    updateLoadingState(false);
}

// Initialize the application with proper error handling
async function initializeApp() {
    try {
        updateLoadingState(true, 'Checking authentication...');
        
        // Test authentication first
        try {
            const tokenResponse = await fetch('/auth/token');
            if (!tokenResponse.ok) {
                if (tokenResponse.status === 0 || !tokenResponse.status) {
                    throw new Error('Cannot connect to server - please ensure the server is running on the correct port');
                }
                const errorText = await tokenResponse.text();
                throw new Error(`Authentication failed: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
            }
            const tokenData = await tokenResponse.json();
            console.log('Authentication successful, token expires in:', tokenData.expires_in, 'seconds');
        } catch (authError) {
            console.error('Authentication test failed:', authError);
            
            if (authError.message.includes('fetch')) {
                showFormaToast('Server not running - please start the server first', 'error', 8000);
                throw new Error('Server not running: Please start the server using "npm start" or "node server.js"');
            } else {
                showFormaToast('Authentication failed - please check server configuration', 'error', 8000);
                throw new Error('Authentication failed: ' + authError.message);
            }
        }
        
        updateLoadingState(true, 'Initializing viewer...');
        
        // Initialize the viewer with enhanced error handling
        const container = document.getElementById('preview');
        if (!container) {
            throw new Error('Could not find viewer container element');
        }
        
        const viewer = await initViewer(container, EXTENSIONS);
        if (!viewer) {
            throw new Error('Failed to initialize Autodesk Viewer');
        }
        
        console.log('Viewer initialized successfully:', viewer);
        
        updateLoadingState(true, 'Loading 3D model...');
        
        // Load the main model with enhanced error handling
        let model, data;
        try {
            console.log('Loading model with URN:', APS_MODEL_URN);
            console.log('Loading model with VIEW:', APS_MODEL_VIEW || 'default geometry');
            
            const result = await loadModel(viewer, APS_MODEL_URN, APS_MODEL_VIEW);
            model = result;
            
            if (!model) {
                throw new Error('loadModel returned null or undefined');
            }
            
            console.log('Model loaded successfully:', model);
            
        } catch (loadError) {
            console.error('Model loading failed:', loadError);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to load 3D model';
            if (loadError.code) {
                switch (loadError.code) {
                    case 3:
                        errorMessage = 'Model not found - please check the URN';
                        break;
                    case 4:
                        errorMessage = 'Access token expired or invalid';
                        break;
                    case 5:
                        errorMessage = 'Model translation failed';
                        break;
                    case 7:
                        errorMessage = 'Model access denied - check permissions';
                        break;
                    default:
                        errorMessage = `Model loading error (code ${loadError.code}): ${loadError.message}`;
                }
            } else if (loadError.message) {
                errorMessage = loadError.message;
            }
            
            throw new Error(errorMessage);
        }
        
        updateLoadingState(true, 'Setting up data visualization...');
        
        // Initialize data view with sample data
        const dataView = new MyDataView();
        
        // Load sensor data using the dataView's init method
        try {
            await dataView.init({
                start: new Date(DEFAULT_TIMERANGE_START),
                end: new Date(DEFAULT_TIMERANGE_END)
            }, 32);
            
            console.log('Sensor data loaded successfully');
            
            // Set the dataView on all extensions (with null checks)
            const spritesExt = viewer.getExtension(SensorSpritesExtensionID);
            if (spritesExt) spritesExt.dataView = dataView;
            
            const listExt = viewer.getExtension(SensorListExtensionID);
            if (listExt) listExt.dataView = dataView;
            
            const detailExt = viewer.getExtension(SensorDetailExtensionID);
            if (detailExt) detailExt.dataView = dataView;
            
            const heatmapsExt = viewer.getExtension(SensorHeatmapsExtensionID);
            if (heatmapsExt) heatmapsExt.dataView = dataView;
            
        } catch (sensorError) {
            console.warn('Could not load sensor data:', sensorError);
            showFormaToast('Sensor data unavailable - using demo mode', 'warning', 3000);
        }
        
        updateLoadingState(true, 'Finalizing setup...');
        
        // Adjust panel styling for Forma theme
        const positionsExt = viewer.getExtension(PositionsExtensionID);
        if (positionsExt && positionsExt.panel) {
            adjustPanelStyle(positionsExt.panel, { 
                left: '20px', 
                bottom: '20px', 
                width: '420px', 
                height: '400px' 
            });
        }
        
        // Set initial floor view if specified
        if (APS_MODEL_DEFAULT_FLOOR_INDEX !== undefined && model && typeof model.getLayersRoot === 'function') {
            try {
                const layersRoot = model.getLayersRoot();
                if (layersRoot && layersRoot.children && layersRoot.children[APS_MODEL_DEFAULT_FLOOR_INDEX]) {
                    layersRoot.children[APS_MODEL_DEFAULT_FLOOR_INDEX].visible = true;
                }
            } catch (layerError) {
                console.warn('Could not set initial floor view:', layerError);
            }
        }
        
        // Hide loading state with a slight delay for smooth transition
        setTimeout(() => {
            updateLoadingState(false);
            showFormaToast('3D model loaded successfully', 'success', 3000);
        }, 500);
        
        // Optional: Load additional model if configured
        // if (APS_MODEL_URN_SECOND && APS_MODEL_VIEW_SECOND) {
        //     try {
        //         updateLoadingState(true, 'Loading secondary model...');
        //         await loadAdditionalModel(viewer, APS_MODEL_URN_SECOND, APS_MODEL_VIEW_SECOND);
        //         showFormaToast('Secondary model loaded', 'info', 2000);
        //     } catch (secondaryError) {
        //         console.warn('Could not load secondary model:', secondaryError);
        //         showFormaToast('Secondary model unavailable', 'warning', 2000);
        //     } finally {
        //         updateLoadingState(false);
        //     }
        // }
        
        // Set up global error handlers
        window.addEventListener('unhandledrejection', (event) => {
            handleError(event.reason, 'Unhandled Promise');
        });
        
        window.addEventListener('error', (event) => {
            handleError(new Error(event.message), 'Runtime');
        });
        
        // Log successful initialization
        console.log('Forma-style DataViz application initialized successfully');
        
    } catch (error) {
        handleError(error, 'Initialization');
    }
}

// Enhanced document ready handler
function onDocumentReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Start the application
onDocumentReady(() => {
    console.log('Starting Forma-style DataViz Extensions Demo...');
    initializeApp();
});

// Export for debugging (remove in production)
window.showFormaToast = showFormaToast;