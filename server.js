const express = require('express');
const { getPublicToken } = require('./services/aps.js');
const { getSensors, getChannels, getSamples } = require('./services/iot.mocked.js');

// Real ACC service with proper scopes configured
const { 
    getProjects, 
    getProject, 
    getIssues, 
    getIssueTypes, 
    getAssets, 
    getRFIs, 
    getCostData, 
    transformDataForVisualization 
} = require('./services/acc.js'); // <-- Using real ACC service

const { PORT } = require('./config.js');

let app = express();
app.use(express.static('public'));

app.get('/auth/token', async function (req, res, next) {
    try {
        res.json(await getPublicToken());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/sensors', async function (req, res, next) {
    try {
        res.json(await getSensors());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/channels', async function (req, res, next) {
    try {
        res.json(await getChannels());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/samples', async function (req, res, next) {
    try {
        res.json(await getSamples({ start: new Date(req.query.start), end: new Date(req.query.end) }, req.query.resolution));
    } catch (err) {
        next(err);
    }
});

// ACC API endpoints (using mock data for now)
app.get('/acc/projects', async function (req, res, next) {
    try {
        res.json(await getProjects());
    } catch (err) {
        next(err);
    }
});

app.get('/acc/projects/:projectId', async function (req, res, next) {
    try {
        res.json(await getProject(req.params.projectId));
    } catch (err) {
        next(err);
    }
});

app.get('/acc/issues/:containerId', async function (req, res, next) {
    try {
        const limit = req.query.limit || 100;
        res.json(await getIssues(req.params.containerId, limit));
    } catch (err) {
        next(err);
    }
});

app.get('/acc/issue-types', async function (req, res, next) {
    try {
        res.json(await getIssueTypes());
    } catch (err) {
        next(err);
    }
});

app.get('/acc/assets/:projectId', async function (req, res, next) {
    try {
        const limit = req.query.limit || 100;
        res.json(await getAssets(req.params.projectId, limit));
    } catch (err) {
        next(err);
    }
});

app.get('/acc/rfis/:containerId', async function (req, res, next) {
    try {
        const limit = req.query.limit || 100;
        res.json(await getRFIs(req.params.containerId, limit));
    } catch (err) {
        next(err);
    }
});

app.get('/acc/cost/:containerId', async function (req, res, next) {
    try {
        const limit = req.query.limit || 100;
        res.json(await getCostData(req.params.containerId, limit));
    } catch (err) {
        next(err);
    }
});

// Combined endpoint for visualization data from ACC
app.get('/acc/visualization/:containerId/:projectId', async function (req, res, next) {
    try {
        const { containerId, projectId } = req.params;
        const [issues, assets] = await Promise.all([
            getIssues(containerId),
            getAssets(projectId)
        ]);
        res.json(transformDataForVisualization(issues, assets));
    } catch (err) {
        next(err);
    }
});

// Helper endpoint to find container IDs for a project
app.get('/acc/containers/:projectId', async function (req, res, next) {
    try {
        const projectId = req.params.projectId;
        const containers = [];
        
        // Test common container types
        const containerTypes = [
            { name: 'Project Container (same as project)', id: projectId },
            { name: 'Issues Container', id: projectId }, // Often same as project
        ];
        
        for (const containerType of containerTypes) {
            try {
                // Test if we can get issues from this container
                const issues = await getIssues(containerType.id, 1); // Only get 1 item to test
                containers.push({
                    ...containerType,
                    status: 'accessible',
                    itemCount: issues.length,
                    testEndpoint: `/acc/issues/${containerType.id}`
                });
            } catch (error) {
                containers.push({
                    ...containerType,
                    status: 'error',
                    error: error.message,
                    testEndpoint: `/acc/issues/${containerType.id}`
                });
            }
        }
        
        res.json({
            projectId,
            containers,
            recommendation: containers.find(c => c.status === 'accessible')?.id || projectId
        });
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(err.message);
});

app.listen(PORT, function () { 
    console.log(`Server listening on port ${PORT}...`); 
    console.log('🔧 Using MOCK ACC data - switch to real ACC service once scopes are approved');
    console.log('📖 See QUICK_FIX.md for instructions to enable real ACC API access');
});
