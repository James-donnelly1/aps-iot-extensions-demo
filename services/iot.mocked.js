const CONFIG = require('../config.js');

// Use configuration from centralized config
const SENSORS = CONFIG.iot.sensors;
const CHANNELS = CONFIG.iot.channels;

async function getSensors() {
    return SENSORS;
}

async function getChannels() {
    return CHANNELS;
}

async function getSamples(timerange, resolution = CONFIG.iot.dataGeneration.defaultResolution) {
    const tempRange = CONFIG.iot.dataGeneration.temperatureRange;
    const co2Range = CONFIG.iot.dataGeneration.co2Range;
    
    return {
        count: resolution,
        timestamps: generateTimestamps(timerange.start, timerange.end, resolution),
        data: {
            'sensor-1': {
                'temp': generateRandomValues(tempRange.min, tempRange.max, resolution, tempRange.delta),
                'co2': generateRandomValues(co2Range.min, co2Range.max, resolution, co2Range.delta)
            }
        }
    };
}

function generateTimestamps(start, end, count) {
    const delta = Math.floor((end.getTime() - start.getTime()) / (count - 1));
    const timestamps = [];
    for (let i = 0; i < count; i++) {
        timestamps.push(new Date(start.getTime() + i * delta));
    }
    return timestamps;
}

function generateRandomValues(min, max, count, maxDelta) {
    const values = [];
    let lastValue = min + Math.random() * (max - min);
    for (let i = 0; i < count; i++) {
        values.push(lastValue);
        lastValue += (Math.random() - 0.5) * 2.0 * maxDelta;
        if (lastValue > max) {
            lastValue = max;
        }
        if (lastValue < min) {
            lastValue = min;
        }
    }
    return values;
}

module.exports = {
    getSensors,
    getChannels,
    getSamples
};
