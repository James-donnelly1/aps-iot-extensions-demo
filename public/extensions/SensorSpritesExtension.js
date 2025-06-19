/// import * as Autodesk from "@types/forge-viewer";

import { UIBaseExtension } from './BaseExtension.js';

export const SensorSpritesExtensionID = 'IoT.SensorSprites';

export class SensorSpritesExtension extends UIBaseExtension {
    constructor(viewer, options) {
        super(viewer, options);
        this._onSpriteClicked = this._onSpriteClicked.bind(this);
        this._dbIdToSensorId = new Map();
        this.update = this.update.bind(this);
        
        // Multi-view calibration system
        this._calibrations = {
            'default': {
                name: 'Default View',
                viewerDistance: 1.52,
                buildingDistance: 252,
                scaleFactor: 1.52 / 252,
                isCalibrated: true
            }
        };
        
        this._currentCalibrationId = 'default';
        this._autoDetectionEnabled = true;
        
        // Multi-sprite support
        this._sprites = [
            {
                id: 'sprite1',
                positionFile: '/position-data.txt',
                style: null,
                trailStyle: null,
                trailPositions: [],
                currentLineIndex: 0,
                animationCompleted: false,
                startOffset: { x: 0, y: 0, z: 0 },
                positionLines: [],
                needsTrailRebuild: false
            },
            {
                id: 'sprite2',
                positionFile: '/position-data-2.txt',
                style: null,
                trailStyle: null,
                trailPositions: [],
                currentLineIndex: 0,
                animationCompleted: false,
                startOffset: { x: 15, y: 0, z: 0 },
                positionLines: [],
                needsTrailRebuild: false
            }
        ];
        
        // Trail and performance settings
        this._trailEnabled = true;
        this._maxTrailLength = 1000;
        this._updateInterval = 500;
        this._mainViewableData = null;
    }

    onDataViewChanged(oldDataView, newDataView) { this.update(); }

    update() {
        if (this.isActive()) {
            this._refreshSprites();
        }
    }

    async load() {
        await super.load();
        
        // Create styles for each sprite
        this._sprites[0].style = this._createVisualStyle(0);
        this._sprites[0].trailStyle = this._createTrailStyle(0);
        this._sprites[1].style = this._createVisualStyle(1);
        this._sprites[1].trailStyle = this._createTrailStyle(1);
        
        this.viewer.addEventListener(Autodesk.DataVisualization.Core.MOUSE_CLICK, this._onSpriteClicked);
        
        // Listen for camera changes to auto-detect calibration
        this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, () => {
            this._autoDetectCalibration();
        });
        
        console.log(`${SensorSpritesExtensionID} extension loaded.`);
        return true;
    }

    unload() {
        super.unload();
        
        // Clean up animation interval
        if (this._animationInterval) {
            clearInterval(this._animationInterval);
            this._animationInterval = undefined;
        }
        
        this.viewer.removeEventListener(Autodesk.DataVisualization.Core.MOUSE_CLICK, this._onSpriteClicked);
        console.log(`${SensorSpritesExtensionID} extension unloaded.`);
        return true;
    }

    activate() {
        super.activate();
        this._refreshSprites();
        return true;
    }

    deactivate() {
        super.deactivate();
        this._dataVizExt.removeAllViewables();
        this._clearAllTrails();
        return true;
    }

    onToolbarCreated() {
        this.createToolbarButton('iot-sensor-sprites-btn', 'IoT Sensor Sprites', 'https://img.icons8.com/ios-filled/50/000000/iot-sensor.png');
        this._createTrailToggleButton();
        this._createRestartButton();
        this._createCalibrationButton();
    }

    _onSpriteClicked(ev) {
        if (this.onSensorClicked) {
            this.onSensorClicked(this._dbIdToSensorId.get(ev.dbId));
        }
    }

    _refreshSprites() {
        this._dataVizExt.removeAllViewables();
        this._sprites.forEach(sprite => sprite.trailPositions = []);
        
        if (!this.dataView) {
            return;
        }
        
        const viewableData = new Autodesk.DataVisualization.Core.ViewableData();
        viewableData.spriteSize = 32;
        this._dbIdToSensorId.clear();
        let dbid = 1000000;
        
        // Create sprites for each configuration
        this._sprites.forEach((spriteConfig, index) => {
            const sensors = Array.from(this.dataView.getSensors().values());
            if (sensors.length > 0) {
                const baseSensor = sensors[0];
                const { x, y, z } = baseSensor.location;
                
                const spritePosition = new THREE.Vector3(
                    x + spriteConfig.startOffset.x, 
                    y + spriteConfig.startOffset.y, 
                    z + spriteConfig.startOffset.z
                );
                
                // Store the dbId for this sprite
                spriteConfig.dbId = dbid;
                this._dbIdToSensorId.set(dbid, `sprite_${index}`);
                const viewable = new Autodesk.DataVisualization.Core.SpriteViewable(spritePosition, spriteConfig.style, dbid++);
                viewableData.addViewable(viewable);
            }
        });
        
        this._mainViewableData = viewableData;
        
        viewableData.finish().then(() => {
            this._dataVizExt.addViewables(viewableData);
            this._startAnimation();
        });
    }

    _startAnimation() {
        // Clean up existing interval
        if (this._animationInterval) {
            clearInterval(this._animationInterval);
        }
        
        // Shared animation state for synchronization
        this._sharedAnimationIndex = 0;
        this._allAnimationsCompleted = false;
        
        // Pre-load all position data
        this._preloadAllPositionData().then(() => {
            console.log('All position data loaded, starting synchronized animation');
            
            this._animationInterval = setInterval(() => {
                try {
                    if (this._allAnimationsCompleted) {
                        return;
                    }
                    
                    let anySpriteMoved = false;
                    
                    // Move all sprites to the same step index simultaneously
                    for (let i = 0; i < this._sprites.length; i++) {
                        const sprite = this._sprites[i];
                        
                        if (sprite.animationCompleted || this._sharedAnimationIndex >= sprite.positionLines.length) {
                            if (!sprite.animationCompleted) {
                                console.log(`${sprite.id} animation completed.`);
                                sprite.animationCompleted = true;
                            }
                            continue;
                        }
                        
                        const currentLine = sprite.positionLines[this._sharedAnimationIndex];
                        if (!currentLine) {
                            continue;
                        }
                        
                        const values = currentLine.includes(',') ? 
                            currentLine.split(',').map(v => v.trim()) : 
                            currentLine.split(/\s+/);
                        
                        if (values.length >= 3) {
                            const xpos = parseFloat(values[0]) || 0;
                            const ypos = parseFloat(values[1]) || 0;
                            const zpos = parseFloat(values[2]) || 0;
                            
                            // Apply current view's calibration scale
                            const currentCalibration = this._calibrations[this._currentCalibrationId];
                            const scale = currentCalibration?.isCalibrated ? currentCalibration.scaleFactor : 1.0;
                            
                            const sensors = Array.from(this.dataView.getSensors().values());
                            const originalPosition = sensors[0]?.location || { x: 0, y: 0, z: 0 };
                            
                            const newPosition = {
                                x: originalPosition.x + (xpos * scale) + sprite.startOffset.x,
                                y: originalPosition.y + (ypos * scale) + sprite.startOffset.y,
                                z: originalPosition.z + (zpos * scale) + sprite.startOffset.z
                            };
                            
                            // Log calibration effect (only for first few positions)
                            if (this._sharedAnimationIndex < 3) {
                                console.log(`Sprite ${sprite.id} scaled movement: building-data(${xpos.toFixed(1)},${ypos.toFixed(1)},${zpos.toFixed(1)}) -> viewer(${(xpos*scale).toFixed(3)},${(ypos*scale).toFixed(3)},${(zpos*scale).toFixed(3)}) scale=${scale.toFixed(6)}`);
                            }
                            
                            if (this._trailEnabled) {
                                // Add trail position directly without scheduling separate rebuild
                                sprite.trailPositions.push({
                                    x: newPosition.x,
                                    y: newPosition.y,
                                    z: newPosition.z
                                });
                                
                                // If we exceed max trail length, we need to rebuild to remove old positions
                                if (sprite.trailPositions.length > this._maxTrailLength) {
                                    sprite.trailPositions.shift(); // Remove oldest position
                                    sprite.needsTrailRebuild = true; // Flag for rebuild
                                }
                            }
                            
                            // Use the stored dbId for this specific sprite
                            if (sprite.dbId) {
                                this._dataVizExt.invalidateViewables([sprite.dbId], (viewable) => {
                                    return { position: newPosition };
                                });
                            }
                            
                            anySpriteMoved = true;
                        }
                    }
                    
                    // Increment shared index for next step
                    this._sharedAnimationIndex++;
                    
                    // Update trails if any sprite moved and trails are enabled
                    if (anySpriteMoved && this._trailEnabled) {
                        // Check if any sprite needs a full trail rebuild (due to max length exceeded)
                        const needsRebuild = this._sprites.some(sprite => sprite.needsTrailRebuild);
                        
                        if (needsRebuild) {
                            // Reset rebuild flags
                            this._sprites.forEach(sprite => sprite.needsTrailRebuild = false);
                            this._rebuildTrailViewables();
                        } else {
                            // Just add new trail positions
                            this._addNewTrailPositions();
                        }
                    }
                    
                    // Check if all animations are completed
                    if (!anySpriteMoved || this._sprites.every(sprite => sprite.animationCompleted)) {
                        console.log('All sprite animations completed');
                        this._allAnimationsCompleted = true;
                    }
                    
                } catch (error) {
                    console.error('Animation error:', error);
                }
            }, this._updateInterval);
        });
    }
    
    async _preloadAllPositionData() {
        const loadPromises = this._sprites.map(async (sprite) => {
            try {
                const response = await fetch(sprite.positionFile);
                const text = await response.text();
                sprite.positionLines = text.trim().split('\n').filter(line => line.trim() !== '');
                console.log(`Loaded ${sprite.positionLines.length} position lines for ${sprite.id}`);
                sprite.animationCompleted = false;
                sprite.currentLineIndex = 0;
            } catch (error) {
                console.error(`Error loading position data for ${sprite.id}:`, error);
                sprite.positionLines = [];
                sprite.animationCompleted = true;
            }
        });
        
        await Promise.all(loadPromises);
    }

    _createVisualStyle(index) {
        const DataVizCore = Autodesk.DataVisualization.Core;
        const viewableType = DataVizCore.ViewableType.SPRITE;
        
        const colors = [0xffffff, 0x00ff00]; // White and green
        const icons = [
            'https://img.icons8.com/emoji/48/man-construction-worker.png',
            'https://img.icons8.com/emoji/48/woman-construction-worker.png'
        ];
        
        const spriteColor = new THREE.Color(colors[index] || 0xffffff);
        const spriteIconUrl = icons[index] || icons[0];
        
        return new DataVizCore.ViewableStyle(viewableType, spriteColor, spriteIconUrl);
    }

    _createTrailStyle(index) {
        const DataVizCore = Autodesk.DataVisualization.Core;
        const viewableType = DataVizCore.ViewableType.SPRITE;
        
        const trailColors = [0x357aff, 0x35ff6b]; // Blue and lime green
        const trailIcons = [
            'https://img.icons8.com/ios-filled/50/357aff/record.png',
            'https://img.icons8.com/ios-filled/50/35ff6b/record.png'
        ];
        
        const trailColor = new THREE.Color(trailColors[index] || 0xff6b35);
        const trailIconUrl = trailIcons[index] || trailIcons[0];
        
        return new DataVizCore.ViewableStyle(viewableType, trailColor, trailIconUrl);
    }


    
    _addNewTrailPositions() {
        // Only add trails if enabled and we have new positions
        if (!this._trailEnabled) return;
        
        // Add only the latest trail positions as new viewables
        this._sprites.forEach((sprite, spriteIndex) => {
            const lastPosition = sprite.trailPositions[sprite.trailPositions.length - 1];
            if (lastPosition) {
                const trailViewableData = new Autodesk.DataVisualization.Core.ViewableData();
                trailViewableData.spriteSize = 24; // Smaller size for trail points
                
                const trailDbId = 2000000 + spriteIndex * 1000 + sprite.trailPositions.length - 1;
                const trailViewable = new Autodesk.DataVisualization.Core.SpriteViewable(
                    new THREE.Vector3(lastPosition.x, lastPosition.y, lastPosition.z),
                    sprite.trailStyle,
                    trailDbId
                );
                trailViewableData.addViewable(trailViewable);
                
                trailViewableData.finish().then(() => {
                    this._dataVizExt.addViewables(trailViewableData);
                });
            }
        });
    }

    _rebuildTrailViewables() {
        // Only rebuild if trails are enabled and we have positions
        if (!this._trailEnabled) return;
        
        // Create a new combined viewable data with both sprites and trails
        const combinedViewableData = new Autodesk.DataVisualization.Core.ViewableData();
        combinedViewableData.spriteSize = 32;
        
        let dbid = 1000000;
        
        // Add main sprites first
        this._sprites.forEach((spriteConfig, index) => {
            const sensors = Array.from(this.dataView.getSensors().values());
            if (sensors.length > 0) {
                const baseSensor = sensors[0];
                const { x, y, z } = baseSensor.location;
                
                const spritePosition = new THREE.Vector3(
                    x + spriteConfig.startOffset.x, 
                    y + spriteConfig.startOffset.y, 
                    z + spriteConfig.startOffset.z
                );
                
                spriteConfig.dbId = dbid;
                this._dbIdToSensorId.set(dbid, `sprite_${index}`);
                const viewable = new Autodesk.DataVisualization.Core.SpriteViewable(spritePosition, spriteConfig.style, dbid++);
                combinedViewableData.addViewable(viewable);
            }
        });
        
        // Add trail sprites
        this._sprites.forEach((sprite, spriteIndex) => {
            sprite.trailPositions.forEach((position, trailIndex) => {
                const trailViewable = new Autodesk.DataVisualization.Core.SpriteViewable(
                    new THREE.Vector3(position.x, position.y, position.z),
                    sprite.trailStyle,
                    2000000 + spriteIndex * 1000 + trailIndex
                );
                combinedViewableData.addViewable(trailViewable);
            });
        });
        
        // Replace the current viewables
        combinedViewableData.finish().then(() => {
            this._dataVizExt.removeAllViewables();
            this._dataVizExt.addViewables(combinedViewableData);
            this._mainViewableData = combinedViewableData; // Update reference
        });
    }
    


    _clearAllTrails() {        
        // Clear trail positions arrays
        this._sprites.forEach(sprite => {
            sprite.trailPositions = [];
            sprite.needsTrailRebuild = false;
        });
        
        // Rebuild viewables without trails
        this._refreshSprites();
    }

    _createTrailToggleButton() {
        const toolbarGroupId = 'iot-toolbar';
        let group = this.viewer.toolbar.getControl(toolbarGroupId);
        if (!group) {
            group = new Autodesk.Viewing.UI.ControlGroup(toolbarGroupId);
            this.viewer.toolbar.addControl(group);
        }

        this._trailButton = new Autodesk.Viewing.UI.Button('iot-trail-toggle-btn');
        this._trailButton.setToolTip(this._trailEnabled ? 'Disable Trail' : 'Enable Trail');

        this._trailButton.onClick = () => {
            this._trailEnabled = !this._trailEnabled;
            this._updateTrailButton();
            
            if (!this._trailEnabled) {
                this._clearAllTrails();
            } else {
                // When enabling trails, rebuild if there are existing trail positions
                const hasTrailPositions = this._sprites.some(sprite => sprite.trailPositions.length > 0);
                if (hasTrailPositions) {
                    this._rebuildTrailViewables();
                }
            }
        };

        this._updateTrailButton();
        group.addControl(this._trailButton);
    }

    _updateTrailButton() {
        if (!this._trailButton) return;
        
        const icon = this._trailButton.container.querySelector('.adsk-button-icon');
        
        if (this._trailEnabled) {
            this._trailButton.setToolTip('Disable Trail');
            this._trailButton.container.style.backgroundColor = 'transparent';
            this._trailButton.container.style.border = '1px solid #357aff';
            this._trailButton.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
            
            if (icon) {
                icon.style.backgroundImage = 'url(https://img.icons8.com/ios-filled/50/357aff/record.png)';
                icon.style.backgroundSize = '24px';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.filter = 'none';
            }
        } else {
            this._trailButton.setToolTip('Enable Trail');
            this._trailButton.container.style.backgroundColor = 'transparent';
            this._trailButton.container.style.border = '1px solid #ccc';
            this._trailButton.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
            
            if (icon) {
                icon.style.backgroundImage = 'url(https://img.icons8.com/ios-filled/50/808080/record.png)';
                icon.style.backgroundSize = '24px';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.filter = 'none';
            }
            
            this._clearAllTrails();
        }
    }

    restartAnimation() {
        console.log('Restarting sprite animations...');
        
        // Reset shared animation state
        this._sharedAnimationIndex = 0;
        this._allAnimationsCompleted = false;
        
        // Reset individual sprite states
        this._sprites.forEach(sprite => {
            sprite.animationCompleted = false;
            sprite.currentLineIndex = 0;
            sprite.trailPositions = [];
            sprite.needsTrailRebuild = false;
        });
        
        this._refreshSprites();
    }

             /**
     * Add or update a calibration profile for a specific view
     * @param {string} id - Unique identifier for this calibration
     * @param {string} name - Human-readable name
     * @param {number} viewerDistance - Distance measured in viewer (inches)
     * @param {number} buildingDistance - Equivalent distance in building (inches)
     */
    addCalibration(id, name, viewerDistance, buildingDistance) {
        const scaleFactor = viewerDistance / buildingDistance;
        this._calibrations[id] = {
            name: name,
            viewerDistance: viewerDistance,
            buildingDistance: buildingDistance,
            scaleFactor: scaleFactor,
            isCalibrated: true
        };
        
        console.log(`Calibration '${name}' (${id}) added: ${buildingDistance}" building = ${viewerDistance}" viewer, scale=${scaleFactor.toFixed(6)}`);
    }

    /**
     * Switch to a different calibration profile
     * @param {string} id - Calibration profile ID
     */
    setCalibration(id) {
        if (this._calibrations[id]) {
            this._currentCalibrationId = id;
            const cal = this._calibrations[id];
            console.log(`Switched to calibration: '${cal.name}' (scale=${cal.scaleFactor.toFixed(6)})`);
        } else {
            console.warn(`Calibration '${id}' not found`);
        }
    }

    /**
     * Get current calibration information
     */
    getCurrentCalibration() {
        return { 
            id: this._currentCalibrationId,
            ...this._calibrations[this._currentCalibrationId] 
        };
    }

    /**
     * Get all available calibrations
     */
    getAllCalibrations() {
        return { ...this._calibrations };
    }

    /**
     * Remove a calibration profile
     * @param {string} id - Calibration profile ID
     */
    removeCalibration(id) {
        if (id === 'default') {
            console.warn('Cannot remove default calibration');
            return;
        }
        
        if (this._calibrations[id]) {
            delete this._calibrations[id];
            
            // Switch to default if current was removed
            if (this._currentCalibrationId === id) {
                this._currentCalibrationId = 'default';
                console.log(`Removed calibration '${id}', switched to default`);
            }
        }
    }

    /**
     * Auto-detect and switch calibration based on camera position/zoom
     */
    _autoDetectCalibration() {
        if (!this._autoDetectionEnabled) return;
        
        const camera = this.viewer.getCamera();
        const distance = camera.position.distanceTo(camera.target);
        
        // Example auto-detection logic (customize based on your needs)
        let targetCalibration = 'default';
        
        if (distance < 100) {
            targetCalibration = 'close-up';
        } else if (distance > 1000) {
            targetCalibration = 'overview';
        }
        
        // Only switch if the calibration exists and is different
        if (this._calibrations[targetCalibration] && targetCalibration !== this._currentCalibrationId) {
            this.setCalibration(targetCalibration);
        }
    }

    /**
     * Enable/disable automatic calibration detection
     * @param {boolean} enabled 
     */
    setAutoDetection(enabled) {
        this._autoDetectionEnabled = enabled;
        console.log(`Auto-detection ${enabled ? 'enabled' : 'disabled'}`);
    }

    _createRestartButton() {
        const toolbarGroupId = 'iot-toolbar';
        let group = this.viewer.toolbar.getControl(toolbarGroupId);
        if (!group) {
            group = new Autodesk.Viewing.UI.ControlGroup(toolbarGroupId);
            this.viewer.toolbar.addControl(group);
        }

        this._restartButton = new Autodesk.Viewing.UI.Button('iot-restart-btn');
        this._restartButton.setToolTip('Restart Animation');

        this._restartButton.onClick = () => {
            this.restartAnimation();
        };

        const icon = this._restartButton.container.querySelector('.adsk-button-icon');
        if (icon) {
            icon.style.backgroundImage = 'url(https://img.icons8.com/ios-filled/50/000000/restart.png)';
            icon.style.backgroundSize = '24px';
            icon.style.backgroundRepeat = 'no-repeat';
            icon.style.backgroundPosition = 'center';
            icon.style.filter = 'invert(1)';
        }

        this._restartButton.container.style.backgroundColor = 'transparent';
        this._restartButton.container.style.border = '1px solid #ccc';
        this._restartButton.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
        
        group.addControl(this._restartButton);
    }

    _createCalibrationButton() {
        const toolbarGroupId = 'iot-toolbar';
        let group = this.viewer.toolbar.getControl(toolbarGroupId);
        if (!group) {
            group = new Autodesk.Viewing.UI.ControlGroup(toolbarGroupId);
            this.viewer.toolbar.addControl(group);
        }

        this._calibrationButton = new Autodesk.Viewing.UI.Button('iot-calibration-btn');
        this._calibrationButton.setToolTip('Calibration Settings');

        this._calibrationButton.onClick = () => {
            this._showCalibrationDialog();
        };

        this._calibrationButton.container.style.backgroundColor = 'transparent';
        this._calibrationButton.container.style.border = '1px solid #0080ff';
        
        const icon = this._calibrationButton.container.querySelector('.adsk-button-icon');
        if (icon) {
            icon.style.backgroundImage = 'url(https://img.icons8.com/ios-filled/50/0080ff/ruler.png)';
            icon.style.backgroundSize = '24px';
            icon.style.backgroundRepeat = 'no-repeat';
            icon.style.backgroundPosition = 'center';
        }

        group.addControl(this._calibrationButton);
    }

    _showCalibrationDialog() {
        const current = this.getCurrentCalibration();
        const allCals = this.getAllCalibrations();
        
        let dialog = `
            <div style="padding: 10px; font-family: Arial;">
                <h3>Calibration Management</h3>
                
                <div style="margin-bottom: 15px;">
                    <strong>Current:</strong> ${current.name} (Scale: ${current.scaleFactor.toFixed(6)})
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label>Switch to:</label><br>
                    <select id="calibration-select" style="width: 100%; padding: 5px;">
        `;
        
        Object.keys(allCals).forEach(id => {
            const cal = allCals[id];
            const selected = id === this._currentCalibrationId ? 'selected' : '';
            dialog += `<option value="${id}" ${selected}>${cal.name} (${cal.scaleFactor.toFixed(6)})</option>`;
        });
        
        dialog += `
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <button onclick="spriteExt._switchCalibrationFromDialog()">Switch Calibration</button>
                    <button onclick="spriteExt._toggleAutoDetection()">${this._autoDetectionEnabled ? 'Disable' : 'Enable'} Auto-Detection</button>
                </div>
                
                <hr>
                <h4>Add New Calibration</h4>
                <div>
                    <label>Name:</label><br>
                    <input type="text" id="cal-name" placeholder="e.g., Floor 1 Close-up" style="width: 100%; margin-bottom: 5px;">
                </div>
                <div>
                    <label>ID:</label><br>
                    <input type="text" id="cal-id" placeholder="e.g., floor1-close" style="width: 100%; margin-bottom: 5px;">
                </div>
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <label>Viewer Distance (inches):</label><br>
                        <input type="number" id="viewer-dist" step="0.01" style="width: 100%;">
                    </div>
                    <div style="flex: 1;">
                        <label>Building Distance (inches):</label><br>
                        <input type="number" id="building-dist" step="0.01" style="width: 100%;">
                    </div>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="spriteExt._addCalibrationFromDialog()">Add Calibration</button>
                </div>
            </div>
        `;
        
        // Store reference for dialog callbacks
        window.spriteExt = this;
        
        // Create and show dialog (simplified - you might want to use a proper modal)
        const existingDialog = document.getElementById('calibration-dialog');
        if (existingDialog) existingDialog.remove();
        
        const dialogDiv = document.createElement('div');
        dialogDiv.id = 'calibration-dialog';
        dialogDiv.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: white; border: 2px solid #ccc; border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 10000; max-width: 400px;
        `;
        dialogDiv.innerHTML = dialog + '<div style="text-align: right; padding: 10px;"><button onclick="document.getElementById(\'calibration-dialog\').remove()">Close</button></div>';
        
        document.body.appendChild(dialogDiv);
    }

    _switchCalibrationFromDialog() {
        const select = document.getElementById('calibration-select');
        if (select) {
            this.setCalibration(select.value);
        }
    }

    _toggleAutoDetection() {
        this.setAutoDetection(!this._autoDetectionEnabled);
        // Refresh dialog to show updated state
        this._showCalibrationDialog();
    }

    _addCalibrationFromDialog() {
        const name = document.getElementById('cal-name').value;
        const id = document.getElementById('cal-id').value;
        const viewerDist = parseFloat(document.getElementById('viewer-dist').value);
        const buildingDist = parseFloat(document.getElementById('building-dist').value);
        
        if (name && id && viewerDist && buildingDist) {
            this.addCalibration(id, name, viewerDist, buildingDist);
            // Refresh dialog to show new calibration
            this._showCalibrationDialog();
        } else {
            alert('Please fill in all fields');
        }
    }
}