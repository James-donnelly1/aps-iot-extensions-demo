/// import * as Autodesk from "@types/forge-viewer";

import { UIBaseExtension } from './BaseExtension.js';

export const SensorSpritesExtensionID = 'IoT.SensorSprites';

export class SensorSpritesExtension extends UIBaseExtension {
    constructor(viewer, options) {
        super(viewer, options);
        this._onSpriteClicked = this._onSpriteClicked.bind(this);
        this._dbIdToSensorId = new Map();
        this.update = this.update.bind(this);
        
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
                            
                            const sensors = Array.from(this.dataView.getSensors().values());
                            const originalPosition = sensors[0]?.location || { x: 0, y: 0, z: 0 };
                            
                            const newPosition = {
                                x: originalPosition.x + xpos + sprite.startOffset.x,
                                y: originalPosition.y + ypos + sprite.startOffset.y,
                                z: originalPosition.z + zpos + sprite.startOffset.z
                            };
                            
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