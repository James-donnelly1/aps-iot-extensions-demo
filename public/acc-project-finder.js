// ACC Project Finder - Helper tool to discover your actual ACC project IDs
class ACCProjectFinder {
    constructor() {
        this.createInterface();
    }

    createInterface() {
        // Create a floating finder panel
        const panel = document.createElement('div');
        panel.id = 'acc-finder-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            background: #2d3142;
            color: white;
            border: 2px solid #0696d7;
            border-radius: 10px;
            padding: 20px;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            font-family: Arial, sans-serif;
            display: none;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #0696d7;">🔍 ACC Project Finder</h3>
                <button onclick="window.accProjectFinder.hide()" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #0696d7;">Method 1: Paste ACC URL</h4>
                <p style="font-size: 12px; color: #ccc;">Copy your ACC project URL and paste it below:</p>
                <input type="text" id="acc-url-input" placeholder="https://acc.autodesk.com/projects/YOUR_PROJECT_ID/..." 
                       style="width: 100%; padding: 8px; background: #3a4556; border: 1px solid #555; color: white; border-radius: 4px;">
                <button onclick="window.accProjectFinder.extractFromURL()" 
                        style="margin-top: 10px; background: #0696d7; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                    Extract Project ID
                </button>
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="color: #0696d7;">Method 2: Manual Entry</h4>
                <p style="font-size: 12px; color: #ccc;">If you know your project ID:</p>
                <input type="text" id="project-id-input" placeholder="Enter Project ID (UUID format)" 
                       style="width: 100%; padding: 8px; background: #3a4556; border: 1px solid #555; color: white; border-radius: 4px; margin-bottom: 10px;">
                <input type="text" id="container-id-input" placeholder="Enter Container ID (usually same as Project ID)" 
                       style="width: 100%; padding: 8px; background: #3a4556; border: 1px solid #555; color: white; border-radius: 4px;">
                <button onclick="window.accProjectFinder.setManualIDs()" 
                        style="margin-top: 10px; background: #0696d7; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                    Use These IDs
                </button>
            </div>

            <div style="margin-bottom: 20px;">
                <h4 style="color: #0696d7;">Method 3: Test API Access</h4>
                <p style="font-size: 12px; color: #ccc;">Test if your current configuration works:</p>
                <button onclick="window.accProjectFinder.testCurrentConfig()" 
                        style="background: #ff6b35; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                    Test Current Project ID
                </button>
            </div>

            <div id="finder-results" style="background: #3a4556; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 200px; overflow-y: auto;">
                Ready to find your ACC project...
            </div>

            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #555;">
                <h4 style="color: #0696d7;">Next Steps:</h4>
                <ol style="font-size: 12px; color: #ccc;">
                    <li>Find your project ID using one of the methods above</li>
                    <li>Update acc-config.js with the correct IDs</li>
                    <li>Switch to real ACC service in index.html</li>
                    <li>Ensure your APS app has required scopes</li>
                </ol>
            </div>
        `;

        document.body.appendChild(panel);
        this.panel = panel;
    }

    show() {
        this.panel.style.display = 'block';
    }

    hide() {
        this.panel.style.display = 'none';
    }

    log(message) {
        const resultsDiv = document.getElementById('finder-results');
        resultsDiv.textContent += message + '\n';
        resultsDiv.scrollTop = resultsDiv.scrollHeight;
    }

    extractFromURL() {
        const urlInput = document.getElementById('acc-url-input');
        const url = urlInput.value.trim();
        
        this.log('🔍 Analyzing URL: ' + url);
        
        if (!url) {
            this.log('❌ Please enter a URL');
            return;
        }

        // Extract project ID from various ACC URL patterns
        const patterns = [
            /acc\.autodesk\.com\/projects\/([a-f0-9-]{36})/i,
            /\/projects\/([a-f0-9-]{36})/i,
            /project_id=([a-f0-9-]{36})/i,
            /projectId=([a-f0-9-]{36})/i
        ];

        let projectId = null;
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                projectId = match[1];
                break;
            }
        }

        if (projectId) {
            this.log('✅ Found Project ID: ' + projectId);
            this.log('📋 Container ID: ' + projectId + ' (usually same)');
            
            // Auto-fill the manual inputs
            document.getElementById('project-id-input').value = projectId;
            document.getElementById('container-id-input').value = projectId;
            
            this.showConfigInstructions(projectId, projectId);
        } else {
            this.log('❌ Could not extract project ID from URL');
            this.log('ℹ️  Make sure the URL is from ACC and contains the project ID');
            this.log('ℹ️  Example: https://acc.autodesk.com/projects/12345678-1234-1234-1234-123456789012/...');
        }
    }

    setManualIDs() {
        const projectId = document.getElementById('project-id-input').value.trim();
        const containerId = document.getElementById('container-id-input').value.trim();
        
        if (!projectId) {
            this.log('❌ Please enter a Project ID');
            return;
        }

        // Validate UUID format
        const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
        if (!uuidPattern.test(projectId)) {
            this.log('❌ Project ID must be in UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
            return;
        }

        const finalContainerId = containerId || projectId;
        
        this.log('✅ Project ID: ' + projectId);
        this.log('✅ Container ID: ' + finalContainerId);
        
        this.showConfigInstructions(projectId, finalContainerId);
    }

    async testCurrentConfig() {
        this.log('🧪 Testing current configuration...');
        
        if (!window.ACC_CONFIG) {
            this.log('❌ ACC_CONFIG not found');
            return;
        }

        const projectId = window.ACC_CONFIG.PROJECT_ID;
        const containerId = window.ACC_CONFIG.CONTAINER_ID;
        
        this.log('📋 Current Project ID: ' + projectId);
        this.log('📋 Current Container ID: ' + containerId);
        
        // Test with current mock service
        if (window.accDataService) {
            try {
                this.log('🔍 Testing data access...');
                const issues = await window.accDataService.getIssues();
                const assets = await window.accDataService.getAssets();
                
                this.log('✅ Issues found: ' + issues.length);
                this.log('✅ Assets found: ' + assets.length);
                
                if (issues.length > 0 && issues[0].id === 'issue-001') {
                    this.log('⚠️  Currently using MOCK data');
                    this.log('📝 To use real data, update your APS scopes and switch to real service');
                } else {
                    this.log('✅ Using real ACC data!');
                }
            } catch (error) {
                this.log('❌ Error testing data: ' + error.message);
            }
        }
    }

    showConfigInstructions(projectId, containerId) {
        this.log('\n📝 Configuration Instructions:');
        this.log('==================================');
        this.log('1. Update public/acc-config.js:');
        this.log('   PROJECT_ID: \'' + projectId + '\'');
        this.log('   CONTAINER_ID: \'' + containerId + '\'');
        this.log('');
        this.log('2. Make sure your APS app has these scopes:');
        this.log('   - data:read');
        this.log('   - account:read');
        this.log('');
        this.log('3. Switch to real ACC service in index.html:');
        this.log('   Uncomment: <script src="/acc-service.js"></script>');
        this.log('   Comment out: <script src="/acc-service-mock.js"></script>');
        this.log('');
        this.log('4. Restart your server');
        this.log('==================================');
    }
}

// Create global instance
window.accProjectFinder = new ACCProjectFinder();

// Add a button to show the finder
function addFinderButton() {
    const button = document.createElement('button');
    button.textContent = '🔍 Find ACC Project';
    button.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        background: #0696d7;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
    `;
    button.onclick = () => window.accProjectFinder.show();
    document.body.appendChild(button);
}

// Add button when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addFinderButton);
} else {
    addFinderButton();
} 