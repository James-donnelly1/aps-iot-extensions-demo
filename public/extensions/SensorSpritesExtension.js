/// import * as Autodesk from "@types/forge-viewer";

import { UIBaseExtension } from './BaseExtension.js';
import { loadConfig } from '../config.js';

export const SensorSpritesExtensionID = 'IoT.SensorSprites';

export class SensorSpritesExtension extends UIBaseExtension {
    constructor(viewer, options) {
        super(viewer, options);
        this._onSpriteClicked = this._onSpriteClicked.bind(this);
        this._dbIdToSensorId = new Map();
        this.update = this.update.bind(this);
        
        // Configuration will be loaded in load() method
        this._calibration = null;
        this._sprites = [];
        this._trailEnabled = true;
        this._maxTrailLength = 1000;
        this._updateInterval = 100;
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
        
        // Load configuration from server
        const CONFIG = await loadConfig();
        
        // Initialize configuration-dependent properties
        this._calibration = CONFIG.calibration;
        this._trailEnabled = CONFIG.sprites.trailEnabled;
        this._maxTrailLength = CONFIG.dataVisualization.maxTrailLength;
        this._updateInterval = CONFIG.dataVisualization.updateInterval;
        
        // Initialize sprites from config
        this._sprites = CONFIG.sprites.configurations.map(config => ({
            id: config.id,
            positionFile: config.positionFile,
            style: null,
            trailStyle: null,
            trailPositions: [],
            currentLineIndex: 0,
            animationCompleted: false,
            startOffset: config.startOffset,
            positionLines: [],
            needsTrailRebuild: false,
            config: config // Store the original config for colors
        }));
        
        // Create styles for each sprite
        this._sprites.forEach((sprite, index) => {
            sprite.style = this._createVisualStyle(index);
            sprite.trailStyle = this._createTrailStyle(index);
        });
        
        this.viewer.addEventListener(Autodesk.DataVisualization.Core.MOUSE_CLICK, this._onSpriteClicked);
        
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
        this.createToolbarButton('iot-sensor-sprites-btn', 'IoT Sensor Sprites', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNMTMuNSAuNjdzLjc0IDIuNjUuNzQgNC44Yy4wMSAxLjEtLjg5IDEuNzMtMS45OSAxLjczcy0yLS42My0yLTEuNzNjMC0yLjE1Ljc0LTQuOC43NC00LjhIMTMuNXptLTIuOTIgMTJjMS4wNiAwIDEuOTIuOTQgMS45MiAyLjFsLS4wMSAyLjdjMCAxLjE2LS44NyAyLjEtMS45MyAyLjFzLTEuOTMtLjk0LTEuOTMtMi4xVjE0Ljc3YzAtMS4xNi44Ny0yLjEgMS45NS0yLjF6bTEuNTQgNy44NWMuMzEuNjIuOTMgMS4wNCAxLjY4IDEuMDQuOTkgMCAxLjgxLS44MiAxLjgxLTEuODFzLS44Mi0xLjgxLTEuODEtMS44MWMtLjc1IDAtMS4zOC40Mi0xLjY4IDEuMDR6bTUuNDMtMTAuNTJjLS4yOCAwLS41Ni0uMTEtLjc3LS4zMmwtMS45NC0xLjk0Yy0uNDEtLjQxLS40MS0xLjEyIDAtMS41M3MxLjEyLS40MSAxLjUzIDBsMS45NCAxLjk0Yy40MS40MS40MSAxLjEyIDAgMS41M3MtMS4xMi40MS0xLjUzIDBjLS4yMS4yMi0uNDkuMzItLjc3LjMyaC0uNDZ6Ii8+PC9zdmc+');
        this._createTrailToggleButton();
        this._createRestartButton();
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
        viewableData.spriteSize = 12; // Use default or load from config in load()
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
                            
                            // Apply calibration scale
                            const scale = this._calibration?.isCalibrated ? this._calibration.scaleFactor : 1.0;
                            
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
        
        // Using Autodesk pantone colors
        // copy the chosen color to the trailIcons
        // Dawn and Morning
//        const icons = [
//            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=f09d4f',
//            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=2ad0a9'
//        ];

        // Dusk and Twilight
//       const icons = [
//            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=f2520a',
//            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=1d91d0'
//        ];

        // Hello Yellow and Autodesk Black
          const icons = [
           'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=ffff00',
           'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=000000'
           ];

//       const icons = [
//            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=f09d4f',
//            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=2ad0a9'
//        ];

        const spriteIconUrl = icons[index] || icons[0];
        
        // Use white color to let the icon's embedded color show through
        return new DataVizCore.ViewableStyle(viewableType, new THREE.Color(1, 1, 1), spriteIconUrl);
    }

    _createTrailStyle(index) {
        const DataVizCore = Autodesk.DataVisualization.Core;
        const viewableType = DataVizCore.ViewableType.SPRITE;
        
        const trailIcons = [
            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=ffff00',
            'https://img.icons8.com/?size=100&id=Fra0jAwRETVA&format=png&color=000000'
        ];
        
        const trailIconUrl = trailIcons[index] || trailIcons[0];
        
        // Use white color to let the icon's embedded color show through
        return new DataVizCore.ViewableStyle(viewableType, new THREE.Color(1, 1, 1), trailIconUrl);
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
            this._trailButton.container.style.border = '1px solid#2ad0a9';
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


}