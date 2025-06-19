/// <reference types="forge-viewer" />

import { UIBaseExtension } from './BaseExtension';

export declare const DatumMarkerExtensionID: string;

/**
 * Extension to add a datum marker at the origin (0,0,0) of the viewer
 */
export declare class DatumMarkerExtension extends UIBaseExtension {
    private _datumViewableData;
    private _isVisible;

    constructor(viewer: Autodesk.Viewing.GuiViewer3D, options?: any);

    load(): Promise<boolean>;
    unload(): boolean;
    activate(): boolean;
    deactivate(): boolean;
    onToolbarCreated(): void;

    /**
     * Add the datum marker at the origin (0,0,0)
     */
    private _addDatumMarker(): void;

    /**
     * Remove the datum marker from the viewer
     */
    private _removeDatumMarker(): void;

    /**
     * Create a distinctive visual style for the datum marker
     */
    private _createDatumStyle(): Autodesk.DataVisualization.Core.ViewableStyle;

    /**
     * Create a toggle button to show/hide the datum marker
     */
    private _createToggleButton(): void;

    /**
     * Toggle visibility of the datum marker
     */
    toggleVisibility(): void;

    /**
     * Check if datum marker is currently visible
     */
    isVisible(): boolean;
} 