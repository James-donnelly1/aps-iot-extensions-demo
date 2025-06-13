/// import * as Autodesk from "@types/forge-viewer";

import { UIBaseExtension } from './BaseExtension.js';
import { PositionsPanel } from './PositionsPanel.js';

export const PositionsExtensionID = 'IoT.Positions';

export class PositionsExtension extends UIBaseExtension {
    constructor(viewer, options) {
        super(viewer, options);
    }

    async load() {
        await super.load();
        this.panel = new PositionsPanel(this.viewer, 'iot-positions', 'Position Data');
        console.log(`${PositionsExtensionID} extension loaded.`);
        return true;
    }

    unload() {
        super.unload();
        this.panel?.uninitialize();
        this.panel = undefined;
        console.log(`${PositionsExtensionID} extension unloaded.`);
        return true;
    }

    activate() {
        super.activate();
        this.panel?.setVisible(true);
        return true;
    }

    deactivate() {
        super.deactivate();
        this.panel?.setVisible(false);
        return true;
    }

    onToolbarCreated() {
        this.createToolbarButton('iot-positions-btn', 'Position Data', 'https://img.icons8.com/ios-filled/50/000000/place-marker.png');
    }
} 