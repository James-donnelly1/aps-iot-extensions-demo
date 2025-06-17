/// import * as Autodesk from "@types/forge-viewer";

export class PositionsPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(viewer, id, title, options) {
        super(viewer.container, id, title, options);
        this.container.style.left = ((options?.x) || 0) + 'px';
        this.container.style.top = ((options?.y) || 0) + 'px';
        this.container.style.width = ((options?.width) || 400) + 'px';
        this.container.style.height = ((options?.height) || 350) + 'px';
        this.container.style.resize = 'both';
        this.container.classList.add('forma-panel');
        this._currentIndex = 0;
        this._positions = [];
        this._intervalId = null;
    }

    initialize() {
        this.title = this.createTitleBar(this.titleLabel || this.container.id);
        this.initializeMoveHandlers(this.title);
        this.container.appendChild(this.title);
        
        // Create Forma-style header
        const header = document.createElement('div');
        header.className = 'forma-panel-header';
        header.innerHTML = `
            <div class="forma-panel-icon">📍</div>
            <div>
                <h3 class="forma-panel-title">Position Data</h3>
                <p class="forma-panel-subtitle">Sprite Movement Tracking</p>
            </div>
            <div style="margin-left: auto;">
                <span class="forma-badge info">Live</span>
            </div>
        `;
        
        this.content = document.createElement('div');
        this.content.className = 'forma-panel-content';
        this.content.style.height = 'calc(100% - 80px)';
        this.content.style.overflow = 'auto';
        
        this.container.appendChild(header);
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
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    padding: var(--spacing-8);
                ">
                    <div style="
                        width: 4rem;
                        height: 4rem;
                        border-radius: var(--radius-xl);
                        background: rgba(229, 57, 53, 0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: var(--spacing-4);
                        font-size: 1.5rem;
                    ">⚠️</div>
                    <h3 style="
                        margin: 0 0 var(--spacing-2) 0;
                        font-size: var(--font-size-lg);
                        font-weight: 600;
                        color: var(--red-600);
                    ">Error Loading Positions</h3>
                    <p style="
                        margin: 0 0 var(--spacing-3) 0;
                        color: var(--text-secondary);
                        font-size: var(--font-size-sm);
                        line-height: 1.5;
                    ">Could not read position-data.txt</p>
                    <code style="
                        color: var(--text-muted);
                        font-size: var(--font-size-xs);
                        background: var(--bg-tertiary);
                        padding: var(--spacing-2) var(--spacing-3);
                        border-radius: var(--radius-md);
                        border: 1px solid var(--border-light);
                        max-width: 100%;
                        word-break: break-word;
                    ">${error.message}</code>
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
            this.content.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    text-align: center;
                    padding: var(--spacing-8);
                ">
                    <div style="
                        width: 4rem;
                        height: 4rem;
                        border-radius: var(--radius-xl);
                        background: var(--bg-tertiary);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: var(--spacing-4);
                        font-size: 1.5rem;
                        color: var(--text-muted);
                    ">📍</div>
                    <p style="
                        margin: 0;
                        color: var(--text-muted);
                        font-size: var(--font-size-sm);
                    ">No position data available</p>
                </div>
            `;
            return;
        }

        // Create data summary
        const summaryHtml = `
            <div style="
                background: var(--bg-tertiary);
                border-radius: var(--radius-lg);
                padding: var(--spacing-4);
                margin-bottom: var(--spacing-5);
                border: 1px solid var(--border-light);
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: var(--spacing-2);
                ">
                    <span style="
                        font-size: var(--font-size-sm);
                        font-weight: 600;
                        color: var(--text-primary);
                    ">Total Positions</span>
                    <span style="
                        font-size: var(--font-size-xl);
                        font-weight: 700;
                        color: var(--autodesk-blue-500);
                    ">${this._positions.length}</span>
                </div>
                <p style="
                    margin: 0;
                    font-size: var(--font-size-xs);
                    color: var(--text-muted);
                    line-height: 1.4;
                ">Defines the movement path for sprite tracking visualization</p>
            </div>
        `;

        // Create data table
        let tableHtml = `
            <div style="
                background: var(--bg-secondary);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border-light);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
            ">
                <div style="
                    background: var(--bg-tertiary);
                    padding: var(--spacing-3) var(--spacing-4);
                    border-bottom: 1px solid var(--border-light);
                ">
                    <div style="
                        display: grid;
                        grid-template-columns: 3rem 1fr 1fr 1fr;
                        gap: var(--spacing-3);
                        font-size: var(--font-size-xs);
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.025em;
                        color: var(--text-secondary);
                    ">
                        <div style="text-align: center;">#</div>
                        <div style="text-align: center;">X</div>
                        <div style="text-align: center;">Y</div>
                        <div style="text-align: center;">Z</div>
                    </div>
                </div>
                
                <div style="max-height: 280px; overflow-y: auto;">
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

            tableHtml += `
                <div style="
                    display: grid;
                    grid-template-columns: 3rem 1fr 1fr 1fr;
                    gap: var(--spacing-3);
                    padding: var(--spacing-3) var(--spacing-4);
                    border-bottom: 1px solid var(--divider);
                    font-size: var(--font-size-sm);
                    transition: background-color var(--transition-fast);
                " onmouseover="this.style.background='var(--bg-tertiary)'" 
                   onmouseout="this.style.background='transparent'">
                    <div style="
                        text-align: center;
                        font-weight: 600;
                        color: var(--autodesk-blue-500);
                        font-size: var(--font-size-xs);
                    ">${index + 1}</div>
                    <div style="
                        text-align: center;
                        font-family: 'SF Mono', Monaco, monospace;
                        font-size: var(--font-size-xs);
                        color: var(--text-primary);
                    ">${x.toFixed(1)}</div>
                    <div style="
                        text-align: center;
                        font-family: 'SF Mono', Monaco, monospace;
                        font-size: var(--font-size-xs);
                        color: var(--text-primary);
                    ">${y.toFixed(1)}</div>
                    <div style="
                        text-align: center;
                        font-family: 'SF Mono', Monaco, monospace;
                        font-size: var(--font-size-xs);
                        color: var(--text-primary);
                    ">${z.toFixed(1)}</div>
                </div>
            `;
        });

        tableHtml += `
                </div>
            </div>
        `;

        // Create status footer
        const footerHtml = `
            <div style="
                margin-top: var(--spacing-4);
                padding: var(--spacing-3) var(--spacing-4);
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                border: 1px solid var(--border-light);
                text-align: center;
            ">
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: var(--spacing-2);
                ">
                    <div style="
                        width: 0.5rem;
                        height: 0.5rem;
                        border-radius: 50%;
                        background: var(--green-500);
                        animation: pulse 2s infinite;
                    "></div>
                    <span style="
                        font-size: var(--font-size-xs);
                        color: var(--text-secondary);
                        font-weight: 500;
                        text-transform: uppercase;
                        letter-spacing: 0.025em;
                    ">Real-time Monitoring</span>
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            </style>
        `;

        this.content.innerHTML = summaryHtml + tableHtml + footerHtml;
    }

    uninitialize() {
        this.stopMonitoring();
        super.uninitialize();
    }
} 