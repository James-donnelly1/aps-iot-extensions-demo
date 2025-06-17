/// import * as Autodesk from "@types/forge-viewer";

import { SensorListExtension } from './extensions/SensorListExtension.js';
import { SensorDetailExtension } from './extensions/SensorDetailExtension.js';
import { SensorSpritesExtension } from './extensions/SensorSpritesExtension.js';
import { SensorHeatmapsExtension } from './extensions/SensorHeatmapsExtension.js';
import { PositionsExtension } from './extensions/PositionsExtension.js';

export const SensorListExtensionID = 'IoT.SensorList';
export const SensorDetailExtensionID = 'IoT.SensorDetail';
export const SensorSpritesExtensionID = 'IoT.SensorSprites';
export const SensorHeatmapsExtensionID = 'IoT.SensorHeatmaps';
export const PositionsExtensionID = 'IoT.Positions';

Autodesk.Viewing.theExtensionManager.registerExtension(SensorListExtensionID, SensorListExtension);
Autodesk.Viewing.theExtensionManager.registerExtension(SensorDetailExtensionID, SensorDetailExtension);
Autodesk.Viewing.theExtensionManager.registerExtension(SensorSpritesExtensionID, SensorSpritesExtension);
Autodesk.Viewing.theExtensionManager.registerExtension(SensorHeatmapsExtensionID, SensorHeatmapsExtension);
Autodesk.Viewing.theExtensionManager.registerExtension(PositionsExtensionID, PositionsExtension);

async function getAccessToken(callback) {
    try {
        const resp = await fetch('/auth/token');
        if (!resp.ok) {
            throw new Error(await resp.text());
        }
        const { access_token, expires_in } = await resp.json();
        callback(access_token, expires_in);
    } catch (err) {
        alert('Could not obtain access token. See the console for more details.');
        console.error(err);
    }
}

export function initViewer(container, extensions) {
    return new Promise(function (resolve, reject) {
        Autodesk.Viewing.Initializer({ getAccessToken }, function () {
            const viewer = new Autodesk.Viewing.GuiViewer3D(container, { extensions });
            viewer.start();
            resolve(viewer);
        });
    });
}

export function loadModel(viewer, urn, guid) {
    return new Promise(function (resolve, reject) {
        function onDocumentLoadSuccess(doc) {
            try {
                const viewable = guid ? doc.getRoot().findByGuid(guid) : doc.getRoot().getDefaultGeometry();
                if (!viewable) {
                    reject(new Error('No viewable found in the document'));
                    return;
                }
                
                // loadDocumentNode returns a Promise, so we need to handle it properly
                viewer.loadDocumentNode(doc, viewable)
                    .then(model => {
                        if (model) {
                            console.log('Model node loaded successfully:', model);
                            resolve(model);
                        } else {
                            reject(new Error('loadDocumentNode returned null'));
                        }
                    })
                    .catch(error => {
                        console.error('Error loading document node:', error);
                        reject(error);
                    });
                    
            } catch (error) {
                console.error('Error in onDocumentLoadSuccess:', error);
                reject(error);
            }
        }
        function onDocumentLoadFailure(code, message, errors) {
            console.error('Document load failure:', { code, message, errors });
            reject({ code, message, errors });
        }
        
        console.log('Loading document from URN:', 'urn:' + urn);
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}

export function loadAdditionalModel(viewer, urn, guid) {
    return new Promise(function (resolve, reject) {
        function onDocumentLoadSuccess(doc) {
            const viewable = guid ? doc.getRoot().findByGuid(guid) : doc.getRoot().getDefaultGeometry();
            // Load with keepCurrentModels: true to maintain existing models
            resolve(viewer.loadDocumentNode(doc, viewable, { keepCurrentModels: true }));
        }
        function onDocumentLoadFailure(code, message, errors) {
            reject({ code, message, errors });
        }
        Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    });
}

export function adjustPanelStyle(panel, { left, right, top, bottom, width, height }) {
    const style = panel.container.style;
    style.setProperty('left', left ? left : 'unset');
    style.setProperty('right', right ? right : 'unset');
    style.setProperty('top', top ? top : 'unset');
    style.setProperty('bottom', bottom ? bottom : 'unset');
    style.setProperty('width', width ? width : 'unset');
    style.setProperty('height', height ? height : 'unset');
}

export function getLoadedModels(viewer) {
    return viewer.getAllModels();
}

export function toggleModelVisibility(viewer, modelId) {
    const model = viewer.getModel(modelId);
    if (model) {
        if (!model.isHidden()) {
            viewer.hideModel(modelId);
        } else {
            viewer.showModel(modelId);
        }
    }
}
