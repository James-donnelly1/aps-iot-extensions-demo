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

console.log('Debug functions loaded. Use:');
console.log('- listAllDBids(viewer) - List all DBids');
console.log('- searchDBidsByName(viewer, "room") - Search by name');
console.log('- getDBidInfo(viewer, 1234) - Get info about specific DBid'); 