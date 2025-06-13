/// import * as Autodesk from "@types/forge-viewer";

export class PositionsPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(viewer, id, title, options) {
        super(viewer.container, id, title, options);
        this.container.style.left = ((options?.x) || 0) + 'px';
        this.container.style.top = ((options?.y) || 0) + 'px';
        this.container.style.width = ((options?.width) || 400) + 'px';
        this.container.style.height = ((options?.height) || 350) + 'px';
        this.container.style.resize = 'both';
        this._currentIndex = 0;
        this._positions = [];
        this._intervalId = null;
    }

    initialize() {
        this.title = this.createTitleBar(this.titleLabel || this.container.id);
        this.initializeMoveHandlers(this.title);
        this.container.appendChild(this.title);
        
        this.content = document.createElement('div');
        this.content.style.height = 'calc(100% - 50px)';
        this.content.style.backgroundColor = '#2c2c2c';
        this.content.style.color = '#ffffff';
        this.content.style.padding = '15px';
        this.content.style.fontFamily = 'monospace';
        this.content.style.overflow = 'auto';
        this.content.style.borderRadius = '5px';
        
        this.container.appendChild(this.content);
        
        // Start monitoring the position file
        this.startMonitoring();
    }

    startMonitoring() {
        this.updatePositions();
        
        // Only update when file changes, not continuously
        this._intervalId = setInterval(() => {
            this.checkForUpdates();
        }, 2000); // Check every 2 seconds for file changes
    }

    stopMonitoring() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    async updatePositions() {
        try {
            const response = await fetch('/position-data.txt');
            const text = await response.text();
            const lines = text.trim().split('\n').filter(line => line.trim() !== '');
            
            // Update positions if they changed
            if (JSON.stringify(lines) !== JSON.stringify(this._positions)) {
                this._positions = lines;
                this._currentIndex = 0;
            }
            
            this.renderPositions();
            
        } catch (error) {
            console.error('Error reading position data:', error);
            this.content.innerHTML = `
                <div style="color: #ff6b6b; text-align: center; margin-top: 50px;">
                    <h3>⚠️ Error Loading Positions</h3>
                    <p>Could not read position-data.txt</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }

    async checkForUpdates() {
        try {
            const response = await fetch('/position-data.txt');
            const text = await response.text();
            const lines = text.trim().split('\n').filter(line => line.trim() !== '');
            
            // Only update if file content actually changed
            if (JSON.stringify(lines) !== JSON.stringify(this._positions)) {
                this._positions = lines;
                this._currentIndex = 0;
                this.renderPositions();
            }
            
        } catch (error) {
            console.error('Error checking position data updates:', error);
        }
    }

    renderPositions() {
        if (this._positions.length === 0) {
            this.content.innerHTML = '<div style="text-align: center; color: #888; margin-top: 50px;">No position data available</div>';
            return;
        }

        let html = `
            <div style="margin-bottom: 15px;">
                <h3 style="margin: 0 0 10px 0; color: #4CAF50;">📍 Position Data</h3>
                <p style="margin: 0; font-size: 12px; color: #aaa;">
                    ${this._positions.length} positions defined for sprite movement
                </p>
            </div>
            
            <div style="background: #1e1e1e; border-radius: 5px; padding: 10px; margin-bottom: 15px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                        <tr style="border-bottom: 1px solid #444;">
                            <th style="padding: 8px; text-align: left; color: #4CAF50;">#</th>
                            <th style="padding: 8px; text-align: center; color: #4CAF50;">X</th>
                            <th style="padding: 8px; text-align: center; color: #4CAF50;">Y</th>
                            <th style="padding: 8px; text-align: center; color: #4CAF50;">Z</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this._positions.forEach((line, index) => {
            let values;
            if (line.includes(',')) {
                values = line.split(',').map(v => v.trim());
            } else {
                values = line.split(/\s+/);
            }

            const x = parseFloat(values[0]) || 0;
            const y = parseFloat(values[1]) || 0;
            const z = parseFloat(values[2]) || 0;

            html += `
                <tr style="color: #ccc; border-bottom: 1px solid #333;">
                    <td style="padding: 8px;">${index + 1}</td>
                    <td style="padding: 8px; text-align: center;">${x.toFixed(1)}</td>
                    <td style="padding: 8px; text-align: center;">${y.toFixed(1)}</td>
                    <td style="padding: 8px; text-align: center;">${z.toFixed(1)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            
            <div style="font-size: 11px; color: #666; text-align: center;">
                Static display • Sprite moves through these positions
            </div>
        `;

        this.content.innerHTML = html;
    }

    uninitialize() {
        this.stopMonitoring();
        super.uninitialize();
    }
} 