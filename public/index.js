import { initViewer, loadModel, loadAdditionalModel, adjustPanelStyle } from './viewer.js';
import {
    SensorListExtensionID,
    SensorSpritesExtensionID,
    SensorDetailExtensionID,
    SensorHeatmapsExtensionID,
    PositionsExtensionID
} from './viewer.js';
import { initTimeline } from './timeline.js';
import { MyDataView } from './dataview.js';
import {
    APS_MODEL_URN,
    APS_MODEL_VIEW,
    // APS_MODEL_URN_SECOND,
    // APS_MODEL_VIEW_SECOND,
    APS_MODEL_DEFAULT_FLOOR_INDEX,
    DEFAULT_TIMERANGE_START,
    DEFAULT_TIMERANGE_END
} from './config.js';

const EXTENSIONS = [
    // SensorListExtensionID,     // Commented out to hide sensors list
    SensorSpritesExtensionID,
    // SensorDetailExtensionID,  // Commented out to hide detail box
    // SensorHeatmapsExtensionID, // Commented out to hide heatmaps
    PositionsExtensionID,         // Position data dialog (static display)
    'Autodesk.AEC.LevelsExtension'
];

const viewer = await initViewer(document.getElementById('preview'), EXTENSIONS);

// Load primary model
console.log('Loading primary model...');
try {
    const firstModel = await loadModel(viewer, APS_MODEL_URN, APS_MODEL_VIEW);
    
    // Load second model (commented out)
    // const [firstModel, secondModel] = await Promise.all([
    //     loadModel(viewer, APS_MODEL_URN, APS_MODEL_VIEW),
    //     loadAdditionalModel(viewer, APS_MODEL_URN_SECOND, APS_MODEL_VIEW_SECOND)
    // ]);
    
    console.log('Model loaded successfully:', { firstModel });
    
    // Fit to view to see the model
    viewer.fitToView();
} catch (error) {
    console.error('Error loading model:', error);
}

// Make viewer globally accessible for console debugging and advanced users
window.viewer = viewer;

viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, async () => {
    // Initialize the timeline with error handling
    try {
        await initTimeline(document.getElementById('timeline'), onTimeRangeChanged, onTimeMarkerChanged);
        console.log('Timeline initialized successfully');
    } catch (error) {
        console.error('Timeline initialization failed:', error);
        console.log('Continuing without timeline functionality...');
    }

    // Initialize our data view
    const dataView = new MyDataView();
    await dataView.init({ start: DEFAULT_TIMERANGE_START, end: DEFAULT_TIMERANGE_END });

    // Configure and activate our custom IoT extensions
    const extensions = [/* SensorListExtensionID, */ SensorSpritesExtensionID, /* SensorDetailExtensionID, */ /* SensorHeatmapsExtensionID, */ PositionsExtensionID].map(id => viewer.getExtension(id));
    for (const ext of extensions) {
        if (ext.dataView !== undefined) {
            ext.dataView = dataView;
        }
        ext.activate();
    }
    // adjustPanelStyle(viewer.getExtension(SensorListExtensionID).panel, { right: '10px', top: '10px', width: '500px', height: '300px' });  // Commented out
    // adjustPanelStyle(viewer.getExtension(SensorDetailExtensionID).panel, { right: '10px', top: '320px', width: '500px', height: '300px' });  // Commented out
    // adjustPanelStyle(viewer.getExtension(SensorHeatmapsExtensionID).panel, { left: '10px', top: '320px', width: '300px', height: '150px' });  // Commented out
    adjustPanelStyle(viewer.getExtension(PositionsExtensionID).panel, { left: '10px', bottom: '10px', width: '420px', height: '400px' });

    // Configure and activate the levels extension
    const levelsExt = viewer.getExtension('Autodesk.AEC.LevelsExtension');
    levelsExt.levelsPanel.setVisible(true);
    levelsExt.floorSelector.addEventListener(Autodesk.AEC.FloorSelector.SELECTED_FLOOR_CHANGED, onLevelChanged);
    levelsExt.floorSelector.selectFloor(APS_MODEL_DEFAULT_FLOOR_INDEX, true);
    adjustPanelStyle(levelsExt.levelsPanel, { left: '10px', top: '10px', width: '300px', height: '300px' });

    // viewer.getExtension(SensorListExtensionID).onSensorClicked = (sensorId) => onCurrentSensorChanged(sensorId);  // Commented out
    viewer.getExtension(SensorSpritesExtensionID).onSensorClicked = (sensorId) => onCurrentSensorChanged(sensorId);
    // viewer.getExtension(SensorHeatmapsExtensionID).onChannelChanged = (channelId) => onCurrentChannelChanged(channelId);  // Commented out
    onTimeRangeChanged(DEFAULT_TIMERANGE_START, DEFAULT_TIMERANGE_END);

    async function onTimeRangeChanged(start, end) {
        await dataView.refresh({ start, end });
        extensions.forEach(ext => ext.dataView = dataView);
    }

    function onLevelChanged({ target, levelIndex }) {
        dataView.floor = levelIndex !== undefined ? target.floorData[levelIndex] : null;
        extensions.forEach(ext => ext.dataView = dataView);
    }

    function onTimeMarkerChanged(time) {
        extensions.forEach(ext => ext.currentTime = time);
    }

    function onCurrentSensorChanged(sensorId) {
        const sensor = dataView.getSensors().get(sensorId);
        if (sensor && sensor.objectId) {
            viewer.fitToView([sensor.objectId]);
        }
        extensions.forEach(ext => ext.currentSensorID = sensorId);
    }

    function onCurrentChannelChanged(channelId) {
        extensions.forEach(ext => ext.currentChannelID = channelId);
    }
});

window.getBoundingBox = function (model, dbid) {
    const tree = model.getInstanceTree();
    const frags = model.getFragmentList();
    const bounds = new THREE.Box3();
    const result = new THREE.Box3();
    tree.enumNodeFragments(dbid, function (fragid) {
        frags.getWorldBounds(fragid, bounds);
        result.union(bounds);
    }, true);
    return result;
};

// The primary model is loaded automatically on startup.
// The viewer is accessible via window.viewer for console debugging if needed.