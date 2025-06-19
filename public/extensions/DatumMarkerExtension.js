/// import * as Autodesk from "@types/forge-viewer";

import { UIBaseExtension } from './BaseExtension.js';

export const DatumMarkerExtensionID = 'IoT.DatumMarker';

/**
 * Extension to add a datum marker at the origin (0,0,0) of the viewer
 */
export class DatumMarkerExtension extends UIBaseExtension {
    constructor(viewer, options) {
        super(viewer, options);
        this._datumViewableData = null;
        this._isVisible = true;
    }

    async load() {
        await super.load();
        console.log(`${DatumMarkerExtensionID} extension loaded.`);
        return true;
    }

    unload() {
        super.unload();
        this._removeDatumMarker();
        console.log(`${DatumMarkerExtensionID} extension unloaded.`);
        return true;
    }

    activate() {
        super.activate();
        this._refreshDatumMarker();
        return true;
    }

    deactivate() {
        super.deactivate();
        if (this._dataVizExt) {
            this._dataVizExt.removeAllViewables();
        }
        this._datumViewableData = null;
        return true;
    }

    onToolbarCreated() {
        this._createToggleButton();
    }

    /**
     * Refresh the datum marker display
     */
    _refreshDatumMarker() {
        if (!this._dataVizExt) {
            console.warn('DataVisualization extension not available');
            return;
        }

        // Clear existing viewables
        this._dataVizExt.removeAllViewables();
        this._datumViewableData = null;

        // Only add the marker if it should be visible
        if (!this._isVisible) {
            console.log('Datum marker is hidden');
            return;
        }

        // Create the datum marker at origin (0,0,0)
        const originPosition = new THREE.Vector3(0, 0, 0);
        
        // Create viewable data
        const viewableData = new Autodesk.DataVisualization.Core.ViewableData();
        viewableData.spriteSize = 24; // Smaller size for better visibility
        
        // Create a distinctive style for the datum marker
        const datumStyle = this._createDatumStyle();
        
        // Create the sprite viewable at origin
        const datumViewable = new Autodesk.DataVisualization.Core.SpriteViewable(
            originPosition,
            datumStyle,
            999999 // Unique ID for the datum marker
        );
        
        viewableData.addViewable(datumViewable);
        
        // Add to viewer
        viewableData.finish().then(() => {
            this._dataVizExt.addViewables(viewableData);
            this._datumViewableData = viewableData; // Store reference after successful addition
            console.log('Datum marker added at origin (0,0,0)');
        }).catch(error => {
            console.error('Failed to add datum marker:', error);
        });
    }

    /**
     * Remove the datum marker from the viewer
     */
    _removeDatumMarker() {
        // Since the DataVisualization extension doesn't have a method to remove individual viewables,
        // we'll hide the marker by not adding it when _addDatumMarker is called
        // The extension will be deactivated which effectively hides it
        if (this._datumViewableData) {
            this._datumViewableData = null;
            console.log('Datum marker reference cleared');
        }
    }

    /**
     * Create a distinctive visual style for the datum marker
     */
    _createDatumStyle() {
        const DataVizCore = Autodesk.DataVisualization.Core;
        const viewableType = DataVizCore.ViewableType.SPRITE;
        
        // Use a distinctive red color for the datum marker
        const datumColor = new THREE.Color(0xff0000); // Red
        
        // Use a crosshair/target icon for the datum marker
        const datumIcon = 'https://img.icons8.com/ios-filled/50/ff0000/target.png';
        
        return new DataVizCore.ViewableStyle(viewableType, datumColor, datumIcon);
    }



    /**
     * Create a toggle button to show/hide the datum marker
     */
    _createToggleButton() {
        const toolbarGroupId = 'iot-toolbar';
        let group = this.viewer.toolbar.getControl(toolbarGroupId);
        if (!group) {
            group = new Autodesk.Viewing.UI.ControlGroup(toolbarGroupId);
            this.viewer.toolbar.addControl(group);
        }

        this._toggleButton = new Autodesk.Viewing.UI.Button('datum-toggle-btn');
        this._toggleButton.setToolTip('Hide Datum Marker');
        
        this._toggleButton.onClick = () => {
            this._isVisible = !this._isVisible;
            this._updateToggleButton();
            this._refreshDatumMarker();
        };
        
        this._updateToggleButton();
        group.addControl(this._toggleButton);
    }

    /**
     * Update the toggle button appearance based on visibility state
     */
    _updateToggleButton() {
        if (!this._toggleButton) return;
        
        const icon = this._toggleButton.container.querySelector('.adsk-button-icon');
        
        if (this._isVisible) {
            this._toggleButton.setToolTip('Hide Datum Marker');
            this._toggleButton.container.style.backgroundColor = 'transparent';
            this._toggleButton.container.style.border = '1px solid #ff0000';
            this._toggleButton.setState(Autodesk.Viewing.UI.Button.State.ACTIVE);
            
            if (icon) {
                icon.style.backgroundImage = 'url(https://img.icons8.com/ios-filled/50/ff0000/visible.png)';
                icon.style.backgroundSize = '24px';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.filter = 'none';
            }
        } else {
            this._toggleButton.setToolTip('Show Datum Marker');
            this._toggleButton.container.style.backgroundColor = 'transparent';
            this._toggleButton.container.style.border = '1px solid #ccc';
            this._toggleButton.setState(Autodesk.Viewing.UI.Button.State.INACTIVE);
            
            if (icon) {
                icon.style.backgroundImage = 'url(https://img.icons8.com/ios-filled/50/808080/invisible.png)';
                icon.style.backgroundSize = '24px';
                icon.style.backgroundRepeat = 'no-repeat';
                icon.style.backgroundPosition = 'center';
                icon.style.filter = 'none';
            }
        }
    }

    /**
     * Toggle visibility of the datum marker
     */
    toggleVisibility() {
        this._isVisible = !this._isVisible;
        this._updateToggleButton();
        this._refreshDatumMarker();
    }

    /**
     * Check if datum marker is currently visible
     */
    isVisible() {
        return this._isVisible && this._datumViewableData !== null;
    }


} 