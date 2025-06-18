// Utility to discover available views in your model
// Add this to your browser console to see what 2D views are available

function discoverModelViews(urn) {
    console.log('Discovering views for URN:', urn);
    
    function onDocumentLoadSuccess(doc) {
        console.log('Document loaded successfully');
        console.log('Document root:', doc.getRoot());
        
        // Get all viewables (including 2D views)
        const viewables = doc.getRoot().search({ 'type': 'geometry' });
        console.log('All viewables found:', viewables);
        
        viewables.forEach((viewable, index) => {
            console.log(`View ${index}:`, {
                name: viewable.name(),
                guid: viewable.guid(),
                type: viewable.getMetadata('type'),
                role: viewable.getMetadata('role'),
                is2D: viewable.is2D(),
                isLeaf: viewable.isLeaf(),
                metadata: viewable.getMetadata()
            });
        });
        
        // Look specifically for 2D views
        const views2D = viewables.filter(v => v.is2D());
        console.log('2D Views found:', views2D.length);
        
        views2D.forEach((view, index) => {
            console.log(`2D View ${index}:`, {
                name: view.name(),
                guid: view.guid(),
                type: view.getMetadata('type'),
                role: view.getMetadata('role'),
                viewType: view.getMetadata('viewType'),
                metadata: view.getMetadata()
            });
        });
        
        // Look for floor plans specifically
        const floorPlans = viewables.filter(v => {
            const name = v.name() ? v.name().toLowerCase() : '';
            const type = v.getMetadata('type') ? v.getMetadata('type').toLowerCase() : '';
            const role = v.getMetadata('role') ? v.getMetadata('role').toLowerCase() : '';
            
            return name.includes('floor') || name.includes('plan') || 
                   type.includes('floor') || type.includes('plan') ||
                   role.includes('floor') || role.includes('plan');
        });
        
        console.log('Floor Plans found:', floorPlans.length);
        floorPlans.forEach((plan, index) => {
            console.log(`Floor Plan ${index}:`, {
                name: plan.name(),
                guid: plan.guid(),
                is2D: plan.is2D(),
                metadata: plan.getMetadata()
            });
        });
        
        // Return useful information
        return {
            allViews: viewables,
            views2D: views2D,
            floorPlans: floorPlans
        };
    }
    
    function onDocumentLoadFailure(code, message, errors) {
        console.error('Document load failure:', { code, message, errors });
    }
    
    // Load the document
    Autodesk.Viewing.Document.load('urn:' + urn, onDocumentLoadSuccess, onDocumentLoadFailure);
}

// Usage: Call this function in your browser console after the viewer is loaded
// discoverModelViews('your-model-urn-here');

// Export for use in other modules
window.discoverModelViews = discoverModelViews; 