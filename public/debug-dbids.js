/**
 * Debug utility to help find valid DBids in the model
 * Run these functions in the browser console after the model loads
 */

// Function to list all DBids in the model
window.listAllDBids = function(viewer) {
    const model = viewer.model;
    if (!model) {
        console.error('No model loaded');
        return;
    }
    
    const tree = model.getInstanceTree();
    if (!tree) {
        console.error('No instance tree available');
        return;
    }
    
    const dbids = [];
    tree.enumNodeFragments(tree.getRootId(), function(fragId) {
        // Get all fragment dbids
    }, true);
    
    // Alternative approach - get all node IDs
    const allDbIds = [];
    tree.enumNodeChildren(tree.getRootId(), function(dbid) {
        const name = tree.getNodeName(dbid);
        if (name) {
            allDbIds.push({ dbid, name });
        }
    }, true);
    
    console.log('Found DBids in model:', allDbIds.slice(0, 20)); // Show first 20
    console.log(`Total DBids found: ${allDbIds.length}`);
    return allDbIds;
};

// Function to search for DBids by name
window.searchDBidsByName = function(viewer, searchTerm) {
    const model = viewer.model;
    if (!model) {
        console.error('No model loaded');
        return;
    }
    
    const tree = model.getInstanceTree();
    if (!tree) {
        console.error('No instance tree available');
        return;
    }
    
    const matches = [];
    tree.enumNodeChildren(tree.getRootId(), function(dbid) {
        const name = tree.getNodeName(dbid);
        if (name && name.toLowerCase().includes(searchTerm.toLowerCase())) {
            matches.push({ dbid, name });
        }
    }, true);
    
    console.log(`Found ${matches.length} DBids matching "${searchTerm}":`, matches);
    return matches;
};

// Function to get info about a specific DBid
window.getDBidInfo = function(viewer, dbid) {
    const model = viewer.model;
    if (!model) {
        console.error('No model loaded');
        return;
    }
    
    const tree = model.getInstanceTree();
    if (!tree) {
        console.error('No instance tree available');
        return;
    }
    
    const name = tree.getNodeName(dbid);
    if (!name) {
        console.error(`DBid ${dbid} not found in model`);
        return null;
    }
    
    const bbox = window.getBoundingBox(model, dbid);
    const info = {
        dbid,
        name,
        boundingBox: bbox,
        center: bbox ? {
            x: (bbox.min.x + bbox.max.x) / 2,
            y: (bbox.min.y + bbox.max.y) / 2,
            z: (bbox.min.z + bbox.max.z) / 2
        } : null
    };
    
    console.log(`DBid ${dbid} info:`, info);
    return info;
};

// Helper function to get bounding box (referenced in getDBidInfo)
window.getBoundingBox = function(model, dbid) {
    try {
        const tree = model.getInstanceTree();
        if (!tree) return null;
        
        const bbox = new THREE.Box3();
        tree.enumNodeFragments(dbid, function(fragId) {
            const fragProxy = model.getFragmentList().getFragmentProxy(model, fragId);
            fragProxy.updateAnimTransform();
            const fragBbox = new THREE.Box3();
            fragProxy.getWorldBounds(fragBbox);
            bbox.union(fragBbox);
        }, true);
        
        return bbox.isEmpty() ? null : bbox;
    } catch (error) {
        console.warn('Could not get bounding box for DBid', dbid, error);
        return null;
    }
};

// Helper function to download text as file
window.downloadTextFile = function(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

// Function to export all model views and information to a text file
window.exportModelViewsToFile = function(viewer, filename = 'model-views-export.txt') {
    const model = viewer.model;
    if (!model) {
        console.error('No model loaded');
        return;
    }
    
    let exportText = '';
    const separator = '=' .repeat(60);
    const timestamp = new Date().toISOString();
    
    // Header information
    exportText += `MODEL VIEWS AND INFORMATION EXPORT\n`;
    exportText += `Generated: ${timestamp}\n`;
    exportText += `${separator}\n\n`;
    
    // Basic model information
    try {
        const docNode = model.getDocumentNode();
        const modelName = docNode ? docNode.name() : 'Unknown';
        exportText += `MODEL BASIC INFORMATION\n`;
        exportText += `${'-'.repeat(30)}\n`;
        exportText += `Model Name: ${modelName}\n`;
        exportText += `Model ID: ${model.id || 'N/A'}\n`;
        exportText += `Is Hidden: ${model.isHidden()}\n`;
        exportText += `Has Instance Tree: ${model.getInstanceTree() ? 'Yes' : 'No'}\n\n`;
    } catch (error) {
        exportText += `Error getting basic model info: ${error.message}\n\n`;
    }
    
    // Document viewables/views
    exportText += `DOCUMENT VIEWABLES/VIEWS\n`;
    exportText += `${'-'.repeat(30)}\n`;
    try {
        const document = model.getDocumentNode().getDocument();
        const root = document.getRoot();
        const viewables = [];
        
        root.search({ 'type': 'geometry' }, function(node) {
            viewables.push({
                name: node.name(),
                guid: node.guid(),
                role: node.role(),
                mime: node.getMimeType(),
                viewableID: node.getViewableID(),
                urn: node.urn()
            });
        });
        
        if (viewables.length > 0) {
            viewables.forEach((viewable, index) => {
                exportText += `${index + 1}. ${viewable.name || 'Unnamed View'}\n`;
                exportText += `   GUID: ${viewable.guid}\n`;
                exportText += `   Role: ${viewable.role}\n`;
                exportText += `   MIME Type: ${viewable.mime}\n`;
                exportText += `   Viewable ID: ${viewable.viewableID || 'N/A'}\n`;
                exportText += `   URN: ${viewable.urn || 'N/A'}\n\n`;
            });
        } else {
            exportText += `No geometry viewables found in document\n\n`;
        }
    } catch (error) {
        exportText += `Error accessing document viewables: ${error.message}\n\n`;
    }
    
    // Model layers/floors information
    exportText += `MODEL LAYERS/FLOORS\n`;
    exportText += `${'-'.repeat(30)}\n`;
    try {
        if (typeof model.getLayersRoot === 'function') {
            const layersRoot = model.getLayersRoot();
            if (layersRoot && layersRoot.children) {
                exportText += `Total Layers/Floors: ${layersRoot.children.length}\n\n`;
                layersRoot.children.forEach((layer, index) => {
                    exportText += `${index + 1}. ${layer.name || `Layer ${index}`}\n`;
                    exportText += `   Visible: ${layer.visible}\n`;
                    exportText += `   Type: ${layer.type || 'Unknown'}\n\n`;
                });
            } else {
                exportText += `No layers found in model\n\n`;
            }
        } else {
            exportText += `Model does not support layer information\n\n`;
        }
    } catch (error) {
        exportText += `Error accessing layer information: ${error.message}\n\n`;
    }
    
    // Instance tree information
    exportText += `INSTANCE TREE SUMMARY\n`;
    exportText += `${'-'.repeat(30)}\n`;
    try {
        const tree = model.getInstanceTree();
        if (tree) {
            exportText += `Root ID: ${tree.getRootId()}\n`;
            exportText += `Node Count: ${tree.nodeAccess ? tree.nodeAccess.numNodes : 'Unknown'}\n`;
            
            // Get some sample nodes
            const sampleNodes = [];
            let nodeCount = 0;
            tree.enumNodeChildren(tree.getRootId(), function(dbid) {
                if (nodeCount < 20) { // Limit to first 20 nodes
                    const name = tree.getNodeName(dbid);
                    if (name) {
                        sampleNodes.push({ dbid, name });
                        nodeCount++;
                    }
                }
            }, true);
            
            exportText += `Sample Nodes (first 20):\n`;
            sampleNodes.forEach(node => {
                exportText += `  - DBid ${node.dbid}: ${node.name}\n`;
            });
            exportText += `\n`;
        } else {
            exportText += `No instance tree available\n\n`;
        }
    } catch (error) {
        exportText += `Error accessing instance tree: ${error.message}\n\n`;
    }
    
    // All loaded models (in case there are multiple)
    exportText += `ALL LOADED MODELS\n`;
    exportText += `${'-'.repeat(30)}\n`;
    try {
        const allModels = viewer.getAllModels();
        exportText += `Total Loaded Models: ${allModels.length}\n\n`;
        allModels.forEach((model, index) => {
            const docNode = model.getDocumentNode();
            exportText += `${index + 1}. ${docNode ? docNode.name() : 'Unknown Model'}\n`;
            exportText += `   Model ID: ${model.id}\n`;
            exportText += `   Hidden: ${model.isHidden()}\n`;
            exportText += `   Has Data: ${model.getData() ? 'Yes' : 'No'}\n\n`;
        });
    } catch (error) {
        exportText += `Error getting loaded models: ${error.message}\n\n`;
    }
    
    // Footer
    exportText += `${separator}\n`;
    exportText += `Export completed at: ${new Date().toISOString()}\n`;
    exportText += `Total lines: ${exportText.split('\n').length}\n`;
    
    // Download the file
    window.downloadTextFile(filename, exportText);
    console.log(`Model views exported to ${filename}`);
    console.log('Export preview (first 500 characters):');
    console.log(exportText.substring(0, 500) + '...');
    
    return exportText;
};

console.log('Debug functions loaded. Use:');
console.log('- listAllDBids(viewer) - List all DBids');
console.log('- searchDBidsByName(viewer, "room") - Search by name');
console.log('- getDBidInfo(viewer, 1234) - Get info about specific DBid');
console.log('- exportModelViewsToFile(viewer, "filename.txt") - Export all model views to text file'); 