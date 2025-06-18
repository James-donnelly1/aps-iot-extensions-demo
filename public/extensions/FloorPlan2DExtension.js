/// import * as Autodesk from "@types/forge-viewer";

import { UIBaseExtension } from './BaseExtension.js';

export const FloorPlan2DExtensionID = 'IoT.FloorPlan2D';

export class FloorPlan2DExtension extends UIBaseExtension {
    constructor(viewer, options) {
        super(viewer, options);
        this._2DMode = false;
        this._floorPlanOverlay = null;
        this._canvasContainer = null;
        this._canvas = null;
        this._ctx = null;
        this._floorPlanImage = null;
        this._imageLoaded = false;
        this._coordinateMapper = null;
        this._sensorMarkers = new Map();
        this._animationFrame = null;
        
        // Configuration
        this._config = {
            imagePath: options?.floorPlanConfig?.imagePath ?? null, // Default to null instead of a file path
            coordinateMapping: options?.floorPlanConfig?.coordinateMapping || {
                modelBounds: { minX: 0, maxX: 100, minY: 0, maxY: 100, minZ: 0, maxZ: 10 },
                imageBounds: { width: 800, height: 600 }
            }
        };
        
        this.update = this.update.bind(this);
        this._onResize = this._onResize.bind(this);
        this._onCanvasClick = this._onCanvasClick.bind(this);
    }

    async load() {
        await super.load();
        console.log(`${FloorPlan2DExtensionID} extension loaded.`);
        return true;
    }

    unload() {
        super.unload();
        this._cleanup();
        console.log(`${FloorPlan2DExtensionID} extension unloaded.`);
        return true;
    }

    activate() {
        super.activate();
        this._setup2DMode();
        return true;
    }

    deactivate() {
        super.deactivate();
        this._cleanup();
        return true;
    }

    onToolbarCreated() {
        this.createToolbarButton(
            'iot-floorplan2d-btn', 
            '2D Floor Plan', 
            'https://img.icons8.com/ios-filled/50/000000/floor-plan.png'
        );
        
        this._createViewModeButton();
    }

    onDataViewChanged(oldDataView, newDataView) {
        this.update();
    }

    update() {
        if (this.isActive() && this._2DMode && this.dataView) {
            this._updateSensorMarkers();
            this._render();
        }
    }

    // Switch between 2D and 3D modes
    toggle2DMode() {
        this._2DMode = !this._2DMode;
        
        if (this._2DMode) {
            this._setup2DMode();
        } else {
            this._cleanup();
        }
        
        this._updateViewModeButton();
    }

    async _setup2DMode() {
        if (this._canvasContainer) {
            return; // Already set up
        }

        // Create canvas overlay
        this._canvasContainer = document.createElement('div');
        this._canvasContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: auto;
            z-index: 1000;
            background: #2c2c2c;
        `;

        this._canvas = document.createElement('canvas');
        this._canvas.style.cssText = `
            width: 100%;
            height: 100%;
            display: block;
        `;
        
        this._canvasContainer.appendChild(this._canvas);
        this.viewer.container.appendChild(this._canvasContainer);
        
        this._ctx = this._canvas.getContext('2d');
        
        // Set up coordinate mapper
        this._coordinateMapper = new CoordinateMapper(this._config.coordinateMapping);
        
        // Load floor plan image
        await this._loadFloorPlanImage();
        
        // Set up event listeners
        window.addEventListener('resize', this._onResize);
        this._canvas.addEventListener('click', this._onCanvasClick);
        
        // Initial render
        this._onResize();
        this.update();
    }

    async _loadFloorPlanImage() {
        return new Promise((resolve, reject) => {
            // Skip loading if no image path is provided
            if (!this._config.imagePath) {
                console.log('No floor plan image path provided, using default grid background');
                this._imageLoaded = false;
                this._floorPlanImage = null;
                resolve();
                return;
            }
            
            this._floorPlanImage = new Image();
            this._floorPlanImage.onload = () => {
                console.log('Floor plan image loaded successfully');
                this._imageLoaded = true;
                resolve();
            };
            this._floorPlanImage.onerror = () => {
                console.warn('Could not load floor plan image, using default background');
                this._imageLoaded = false;
                this._floorPlanImage = null; // Clear the broken image
                resolve(); // Continue without image
            };
            this._floorPlanImage.src = this._config.imagePath;
        });
    }

    _cleanup() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
        
        if (this._canvasContainer) {
            this.viewer.container.removeChild(this._canvasContainer);
            this._canvasContainer = null;
            this._canvas = null;
            this._ctx = null;
        }
        
        window.removeEventListener('resize', this._onResize);
    }

    _onResize() {
        if (!this._canvas || !this._ctx) return;
        
        const container = this.viewer.container;
        const rect = container.getBoundingClientRect();
        
        this._canvas.width = rect.width;
        this._canvas.height = rect.height;
        
        // Update coordinate mapper canvas dimensions
        this._coordinateMapper?.updateCanvasDimensions(rect.width, rect.height);
        
        this._render();
    }

    _onCanvasClick(event) {
        const rect = this._canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Convert to model coordinates
        const modelCoords = this._coordinateMapper.canvasToModel(x, y);
        console.log('Clicked at canvas:', x, y, 'model:', modelCoords);
        
        // Check if clicked on a sensor
        for (const [sensorId, marker] of this._sensorMarkers) {
            if (this._isPointInCircle(x, y, marker.canvasX, marker.canvasY, marker.radius)) {
                console.log('Clicked on sensor:', sensorId);
                this._onSensorClicked(sensorId);
                break;
            }
        }
    }

    _onSensorClicked(sensorId) {
        if (this.onSensorClicked) {
            this.onSensorClicked(sensorId);
        }
    }

    _isPointInCircle(px, py, cx, cy, radius) {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= radius * radius;
    }

    _updateSensorMarkers() {
        this._sensorMarkers.clear();
        
        if (!this.dataView) return;
        
        for (const [sensorId, sensor] of this.dataView.getSensors()) {
            const canvasCoords = this._coordinateMapper.modelToCanvas(
                sensor.location.x, 
                sensor.location.y
            );
            
            this._sensorMarkers.set(sensorId, {
                sensor: sensor,
                canvasX: canvasCoords.x,
                canvasY: canvasCoords.y,
                radius: 8,
                color: this._getSensorColor(sensor)
            });
        }
    }

    _getSensorColor(sensor) {
        // Color based on sensor data or type
        // You can customize this based on your sensor data
        return '#00ff00'; // Default green
    }

    _render() {
        if (!this._ctx || !this._canvas) return;
        
        const ctx = this._ctx;
        const canvas = this._canvas;
        
        // Clear canvas
        ctx.fillStyle = '#2c2c2c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw floor plan image if available and loaded successfully
        if (this._imageLoaded && this._floorPlanImage && this._floorPlanImage.complete && this._floorPlanImage.naturalWidth > 0) {
            try {
                const scale = Math.min(
                    canvas.width / this._floorPlanImage.width,
                    canvas.height / this._floorPlanImage.height
                );
                
                const scaledWidth = this._floorPlanImage.width * scale;
                const scaledHeight = this._floorPlanImage.height * scale;
                const x = (canvas.width - scaledWidth) / 2;
                const y = (canvas.height - scaledHeight) / 2;
                
                ctx.drawImage(this._floorPlanImage, x, y, scaledWidth, scaledHeight);
            } catch (error) {
                console.warn('Error drawing floor plan image:', error);
                this._imageLoaded = false; // Disable future attempts
            }
        } else {
            // Draw a default grid background when no image is available
            this._drawDefaultBackground(ctx, canvas);
        }
        
        // Draw sensor markers
        for (const [sensorId, marker] of this._sensorMarkers) {
            this._drawSensorMarker(ctx, marker, sensorId);
        }
        
        // Draw legend
        this._drawLegend(ctx);
    }

    _drawSensorMarker(ctx, marker, sensorId) {
        ctx.save();
        
        // Draw sensor circle
        ctx.beginPath();
        ctx.arc(marker.canvasX, marker.canvasY, marker.radius, 0, 2 * Math.PI);
        ctx.fillStyle = marker.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw sensor label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(sensorId, marker.canvasX, marker.canvasY - marker.radius - 5);
        
        ctx.restore();
    }

    _drawDefaultBackground(ctx, canvas) {
        // Draw a grid background when no floor plan image is available
        ctx.save();
        
        const gridSize = 50;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Draw center message
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('2D Floor Plan View', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '14px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText('Add floor-plan.png to public/ folder for custom background', canvas.width / 2, canvas.height / 2 + 10);
        
        ctx.restore();
    }

    _drawLegend(ctx) {
        ctx.save();
        
        const legendX = 10;
        const legendY = 10;
        const legendWidth = 200;
        const legendHeight = 80;
        
        // Legend background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
        
        // Legend content
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('2D Floor Plan View', legendX + 10, legendY + 20);
        ctx.font = '12px Arial';
        ctx.fillText(`Sensors: ${this._sensorMarkers.size}`, legendX + 10, legendY + 40);
        
        // Show image status
        if (this._imageLoaded) {
            ctx.fillStyle = '#00ff00';
            ctx.fillText('✓ Floor plan loaded', legendX + 10, legendY + 60);
        } else {
            ctx.fillStyle = '#ffaa00';
            ctx.fillText('⚠ Using default grid', legendX + 10, legendY + 60);
        }
        
        ctx.restore();
    }

    _createViewModeButton() {
        const toolbar = this.viewer.getToolbar(true);
        if (!toolbar) return;
        
        this._viewModeButton = new Autodesk.Viewing.UI.Button('view-mode-btn');
        this._viewModeButton.setToolTip('Toggle 2D/3D View');
        this._viewModeButton.setIcon('https://img.icons8.com/ios-filled/50/000000/toggle-on.png');
        this._viewModeButton.onClick = () => this.toggle2DMode();
        
        const navTools = toolbar.getControl('navTools');
        if (navTools) {
            navTools.addControl(this._viewModeButton);
        }
    }

    _updateViewModeButton() {
        if (this._viewModeButton) {
            this._viewModeButton.setToolTip(this._2DMode ? 'Switch to 3D View' : 'Switch to 2D View');
            this._viewModeButton.setState(this._2DMode ? Autodesk.Viewing.UI.Button.State.ACTIVE : Autodesk.Viewing.UI.Button.State.INACTIVE);
        }
    }
}

// Utility class for coordinate mapping between model and canvas coordinates
class CoordinateMapper {
    constructor(mapping) {
        this.modelBounds = mapping.modelBounds;
        this.imageBounds = mapping.imageBounds;
        this.canvasWidth = 800;
        this.canvasHeight = 600;
    }
    
    updateCanvasDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
    }
    
    modelToCanvas(modelX, modelY) {
        // Convert model coordinates to canvas coordinates
        const normalizedX = (modelX - this.modelBounds.minX) / (this.modelBounds.maxX - this.modelBounds.minX);
        const normalizedY = (modelY - this.modelBounds.minY) / (this.modelBounds.maxY - this.modelBounds.minY);
        
        return {
            x: normalizedX * this.canvasWidth,
            y: (1 - normalizedY) * this.canvasHeight // Flip Y axis
        };
    }
    
    canvasToModel(canvasX, canvasY) {
        // Convert canvas coordinates to model coordinates
        const normalizedX = canvasX / this.canvasWidth;
        const normalizedY = 1 - (canvasY / this.canvasHeight); // Flip Y axis
        
        return {
            x: this.modelBounds.minX + normalizedX * (this.modelBounds.maxX - this.modelBounds.minX),
            y: this.modelBounds.minY + normalizedY * (this.modelBounds.maxY - this.modelBounds.minY)
        };
    }
} 