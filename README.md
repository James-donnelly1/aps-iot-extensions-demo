# APS IoT Extensions Demo

This sample demonstrates how to use [Autodesk Platform Services](https://aps.autodesk.com) to visualize IoT sensor data in a 3D model using the Forge Viewer.

## 🚀 Features

- **3D Model Visualization**: Load and display Autodesk models in the browser
- **IoT Data Integration**: Visualize sensor data with sprites and trails
- **Real-time Animation**: Animated sprite movements with configurable trails
- **Calibration System**: Configurable scale factors for accurate positioning
- **Centralized Configuration**: Single configuration file for all settings

## ⚙️ Single Configuration System

This project uses a **single configuration system** with one source of truth in `config.js`. The server serves configuration to the client dynamically, eliminating duplication:

### 📁 Configuration Architecture

**Single Source of Truth**: Only `config.js` (root level) contains configuration:
- **Server**: Uses `config.js` directly
- **Client**: Fetches config from `/api/config` endpoint
- **No Duplication**: Eliminates sync issues between files

#### 🏢 APS (Autodesk Platform Services) Settings
```javascript
aps: {
    clientId: APS_CLIENT_ID,
    clientSecret: APS_CLIENT_SECRET,
    model: {
        urn: 'your-model-urn',
        view: 'optional-view-guid',
        defaultFloorIndex: 0
    }
}
```

#### 🎯 Calibration Settings
```javascript
calibration: {
    viewerDistance: 1.52,
    buildingDistance: 252,
    scaleFactor: 1.52 / 252,
    isCalibrated: true
}
```

#### 🎨 Sprite Configuration
```javascript
sprites: {
    configurations: [
        {
            id: 'sprite1',
            positionFile: '/position-data.txt',
            startOffset: { x: 0, y: 0, z: 0 },
            color: { r: 1.0, g: 0.0, b: 0.0 },
            trailColor: { r: 1.0, g: 0.5, b: 0.5 }
        }
    ],
    trailEnabled: true
}
```

#### 🌡️ IoT Sensor Definitions
```javascript
iot: {
    sensors: { /* sensor configurations */ },
    channels: { /* channel definitions */ },
    dataGeneration: { /* mock data settings */ }
}
```

#### 🎛️ UI & Extension Settings
```javascript
ui: {
    notifications: { /* toast settings */ },
    loadingMessages: { /* loading text */ }
},
extensions: {
    enabled: ['SensorSpritesExtension', 'PositionsExtension'],
    available: ['SensorListExtension', 'SensorDetailExtension']
}
```

### 🔧 How to Customize

1. **Model Settings**: Update `CONFIG.aps.model.urn` with your model URN
2. **Calibration**: Adjust `CONFIG.calibration` scale factors for your model
3. **Sprites**: Modify `CONFIG.sprites.configurations` to add/remove sprites
4. **Colors**: Change sprite and trail colors in the sprite configurations
5. **Sensors**: Update `CONFIG.iot.sensors` and `CONFIG.iot.channels`
6. **Extensions**: Enable/disable extensions in `CONFIG.extensions`

## 🛠️ Setup

### Prerequisites
- [Node.js](https://nodejs.org) (version 18 or higher)
- [APS App](https://aps.autodesk.com/myapps) with Client ID and Secret

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd aps-INTC-data-visualization
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp env.template .env
```

4. Edit `.env` file with your APS credentials:
```
APS_CLIENT_ID=your_client_id_here
APS_CLIENT_SECRET=your_client_secret_here
PORT=3000
```

5. Customize configuration in `config.js`:
   - Update model URN
   - Adjust calibration settings
   - Configure sprites and colors
   - Modify sensor definitions

6. Start the server:
```bash
npm start
```

7. Open http://localhost:3000 in your browser

## 📋 Configuration Reference

### Environment Variables (.env)
- `APS_CLIENT_ID`: Your Autodesk Platform Services Client ID
- `APS_CLIENT_SECRET`: Your Autodesk Platform Services Client Secret  
- `PORT`: Server port (default: 3000)

### Main Configuration (config.js)
All other settings are centralized in `config.js`:

| Section | Description |
|---------|-------------|
| `server` | Server configuration (port, static path) |
| `aps` | APS credentials and model settings |
| `dataVisualization` | Performance and visual settings |
| `calibration` | Single calibration scale settings |
| `sprites` | Sprite definitions and colors |
| `iot` | Sensor and channel definitions |
| `extensions` | Extension enable/disable settings |
| `ui` | User interface configurations |

## 🎨 Customization Examples

### Adding a New Sprite
```javascript
// In config.js, add to sprites.configurations:
{
    id: 'sprite3',
    positionFile: '/position-data-3.txt',
    startOffset: { x: 30, y: 0, z: 0 },
    color: { r: 0.0, g: 0.0, b: 1.0 },
    trailColor: { r: 0.5, g: 0.5, b: 1.0 }
}
```

### Adjusting Calibration
```javascript
// In config.js, update calibration settings:
calibration: {
    viewerDistance: 2.0,        // Distance measured in viewer (inches)
    buildingDistance: 400,      // Equivalent distance in building (inches)
    scaleFactor: 2.0 / 400,     // Automatically calculated scale factor
    isCalibrated: true
}
```

### Changing Model
```javascript
// In config.js, update aps.model:
model: {
    urn: 'your-new-model-urn',
    view: 'optional-view-guid',
    defaultFloorIndex: 0
}
```

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript with Autodesk Viewer
- **Backend**: Node.js with Express
- **Configuration**: Centralized in `config.js`
- **Extensions**: Modular extension system
- **Data**: Mock IoT data generation

## 📁 File Structure

```
├── config.js                 # ✨ SINGLE CONFIGURATION SOURCE
├── public/
│   ├── config.js             # Dynamic config loader
│   ├── extensions/           # Viewer extensions
│   │   ├── SensorSpritesExtension.js
│   │   └── ...
│   └── ...
├── services/
│   ├── aps.js               # APS authentication
│   └── iot.mocked.js        # Mock IoT data
├── server.js                # Express server (serves /api/config)
└── .env                     # Environment variables
```

## 🔍 Troubleshooting

### Common Issues

1. **Authentication Errors**: Check your APS Client ID and Secret in `.env`
2. **Model Loading Issues**: Verify the model URN in `config.js`
3. **Sprite Colors**: Ensure RGB values are between 0.0 and 1.0
4. **Calibration**: Adjust calibration settings for your specific model scale

### Debug Tools

- Open browser dev tools and check console for errors
- Use the calibration dialog to test different scale factors
- Verify model URN using Autodesk's model derivative API

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Update configuration documentation if needed
4. Test your changes
5. Submit a pull request

## 📚 Resources

- [Autodesk Platform Services Documentation](https://aps.autodesk.com/en/docs/)
- [Forge Viewer API Reference](https://aps.autodesk.com/en/docs/viewer/v7/reference/)
- [Data Visualization Extension](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/advanced_options/data-visualization/)

---

## 🔧 **Why Only One Config File?**

**Previous Problem**: Originally had 2 config files that could get out of sync:
- `config.js` (server-side) 
- `public/config.js` (client-side duplicate)

**Solution**: Pure dynamic configuration loading:
1. **Single Source**: Only `config.js` contains configuration
2. **Server Endpoint**: `/api/config` serves config to client
3. **Security**: Server filters out secrets (credentials, etc.)
4. **No Hardcoded Values**: Client config has ZERO hardcoded fallbacks
5. **No Duplication**: Impossible for configs to get out of sync

🎯 **Key Benefit**: With the single configuration system, you edit only `config.js` and both server and client automatically use the same settings!
