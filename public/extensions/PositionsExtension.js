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
        this.createToolbarButton('iot-positions-btn', 'Position Data', 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjMDAwMDAwIj48cGF0aCBkPSJNMTIgMkM4LjEzIDIgNSA1LjEzIDUgOWMwIDUuMjUgNyAxMyA3IDEzczctNy43NSA3LTEzYzAtMy44Ny0zLjEzLTctNy03em0wIDkuNWMtMS4zOCAwLTIuNS0xLjEyLTIuNS0yLjVzMS4xMi0yLjUgMi41LTIuNSAyLjUgMS4xMiAyLjUgMi41LTEuMTIgMi41LTIuNSAyLjV6Ii8+PC9zdmc+');
    }
} 