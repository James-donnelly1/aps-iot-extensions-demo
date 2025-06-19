const express = require('express');
const { getPublicToken } = require('./services/aps.js');
const { getSensors, getChannels, getSamples } = require('./services/iot.mocked.js');
const CONFIG = require('./config.js');

let app = express();
app.use(express.static(CONFIG.server.staticPath));

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

// Serve client configuration
app.get('/api/config', function (req, res, next) {
    try {
        // Send only client-safe configuration (no secrets)
        const clientConfig = {
            aps: {
                model: CONFIG.aps.model,
                secondaryModel: CONFIG.aps.secondaryModel
            },
            dataVisualization: CONFIG.dataVisualization,
            calibration: CONFIG.calibration,
            sprites: CONFIG.sprites,
            extensions: CONFIG.extensions,
            ui: CONFIG.ui
        };
        res.json(clientConfig);
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(err.message);
});

app.listen(CONFIG.server.port, function () { console.log(`Server listening on port ${CONFIG.server.port}...`); });
