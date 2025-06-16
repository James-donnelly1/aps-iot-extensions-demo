// ACC Data Panel - Interactive side panel for ACC data
class ACCPanel {
    constructor() {
        this.isOpen = false;
        this.selectedItem = null;
        this.data = {
            issues: [],
            assets: [],
            stats: { issues: 0, assets: 0, highPriority: 0 }
        };
        this.filters = {
            issueStatus: 'all',
            assetStatus: 'all',
            priority: 'all'
        };
        this.refreshInterval = null;
        
        this.init();
    }

    init() {
        this.createHTML();
        this.bindEvents();
        this.loadData();
        
        // Start auto-refresh if configured
        if (window.ACC_CONFIG && window.ACC_CONFIG.VISUALIZATION.REFRESH_INTERVAL) {
            this.startAutoRefresh();
        }
    }

    createHTML() {
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'acc-panel-toggle';
        toggleBtn.innerHTML = 'ACC DATA';
        toggleBtn.id = 'acc-panel-toggle';
        document.body.appendChild(toggleBtn);

        // Create panel
        const panel = document.createElement('div');
        panel.className = 'acc-panel';
        panel.id = 'acc-panel';
        panel.innerHTML = `
            <div class="acc-panel-header">
                <h3 class="acc-panel-title">
                    Construction Cloud Data
                    <button class="acc-panel-close" id="acc-panel-close">✕</button>
                </h3>
            </div>
            <div class="acc-panel-content">
                <div class="acc-stats" id="acc-stats">
                    <div class="acc-stat">
                        <span class="acc-stat-value" id="stat-issues">0</span>
                        <div class="acc-stat-label">Issues</div>
                    </div>
                    <div class="acc-stat">
                        <span class="acc-stat-value" id="stat-assets">0</span>
                        <div class="acc-stat-label">Assets</div>
                    </div>
                    <div class="acc-stat">
                        <span class="acc-stat-value" id="stat-high">0</span>
                        <div class="acc-stat-label">High Priority</div>
                    </div>
                </div>

                <div class="acc-filters" id="acc-filters">
                    <div class="acc-filter-group">
                        <label class="acc-filter-label">Filter by Status:</label>
                        <select class="acc-filter-select" id="filter-status">
                            <option value="all">All Items</option>
                            <option value="open">Open Issues</option>
                            <option value="high">High Priority</option>
                            <option value="active">Active Assets</option>
                        </select>
                    </div>
                </div>

                <div class="acc-section">
                    <div class="acc-section-header">
                        <h4 class="acc-section-title">Issues</h4>
                        <button class="acc-refresh-btn" id="refresh-issues">↻</button>
                    </div>
                    <div id="acc-issues-container">
                        <div class="acc-loading">
                            <div class="acc-loading-spinner"></div>
                            Loading issues...
                        </div>
                    </div>
                </div>

                <div class="acc-section">
                    <div class="acc-section-header">
                        <h4 class="acc-section-title">Assets</h4>
                        <button class="acc-refresh-btn" id="refresh-assets">↻</button>
                    </div>
                    <div id="acc-assets-container">
                        <div class="acc-loading">
                            <div class="acc-loading-spinner"></div>
                            Loading assets...
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }

    bindEvents() {
        // Toggle panel
        document.getElementById('acc-panel-toggle').addEventListener('click', () => {
            this.toggle();
        });

        // Close panel
        document.getElementById('acc-panel-close').addEventListener('click', () => {
            this.close();
        });

        // Refresh buttons
        document.getElementById('refresh-issues').addEventListener('click', () => {
            this.refreshIssues();
        });

        document.getElementById('refresh-assets').addEventListener('click', () => {
            this.refreshAssets();
        });

        // Filter
        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.renderData();
        });

        // Listen for ACC data updates
        if (window.accDataService) {
            window.accDataService.addEventListener((data) => {
                this.updateData(data);
            });
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        const panel = document.getElementById('acc-panel');
        const toggle = document.getElementById('acc-panel-toggle');
        
        panel.classList.add('open');
        toggle.classList.add('hidden');
        this.isOpen = true;
        
        // Load fresh data when opening
        this.loadData();
    }

    close() {
        const panel = document.getElementById('acc-panel');
        const toggle = document.getElementById('acc-panel-toggle');
        
        panel.classList.remove('open');
        toggle.classList.remove('hidden');
        this.isOpen = false;
    }

    async loadData() {
        try {
            if (!window.accDataService) {
                throw new Error('ACC Data Service not available');
            }

            // Load issues and assets in parallel
            const [issues, assets] = await Promise.all([
                window.accDataService.getIssues().catch(() => []),
                window.accDataService.getAssets().catch(() => [])
            ]);

            this.data.issues = issues;
            this.data.assets = assets;
            this.updateStats();
            this.renderData();

        } catch (error) {
            console.error('Error loading ACC data:', error);
            this.showError('Failed to load ACC data: ' + error.message);
        }
    }

    async refreshIssues() {
        const btn = document.getElementById('refresh-issues');
        btn.disabled = true;
        btn.textContent = '⟳';

        try {
            this.data.issues = await window.accDataService.getIssues();
            this.updateStats();
            this.renderIssues();
        } catch (error) {
            console.error('Error refreshing issues:', error);
        } finally {
            btn.disabled = false;
            btn.textContent = '↻';
        }
    }

    async refreshAssets() {
        const btn = document.getElementById('refresh-assets');
        btn.disabled = true;
        btn.textContent = '⟳';

        try {
            this.data.assets = await window.accDataService.getAssets();
            this.updateStats();
            this.renderAssets();
        } catch (error) {
            console.error('Error refreshing assets:', error);
        } finally {
            btn.disabled = false;
            btn.textContent = '↻';
        }
    }

    updateData(accData) {
        if (accData.sensors) {
            // Convert visualization data back to issues
            this.data.issues = accData.sensors.filter(s => s.accType === 'issue');
        }
        if (accData.assets) {
            this.data.assets = accData.assets;
        }
        this.updateStats();
        this.renderData();
    }

    updateStats() {
        const issues = this.data.issues || [];
        const assets = this.data.assets || [];
        
        this.data.stats = {
            issues: issues.length,
            assets: assets.length,
            highPriority: issues.filter(i => 
                i.priority?.toLowerCase() === 'high' || 
                i.attributes?.priority?.toLowerCase() === 'high'
            ).length
        };

        // Update UI
        document.getElementById('stat-issues').textContent = this.data.stats.issues;
        document.getElementById('stat-assets').textContent = this.data.stats.assets;
        document.getElementById('stat-high').textContent = this.data.stats.highPriority;
    }

    renderData() {
        this.renderIssues();
        this.renderAssets();
    }

    renderIssues() {
        const container = document.getElementById('acc-issues-container');
        const issues = this.filterData(this.data.issues, 'issue');

        if (issues.length === 0) {
            container.innerHTML = '<div class="acc-empty">No issues found</div>';
            return;
        }

        container.innerHTML = issues.map(issue => this.renderIssueItem(issue)).join('');
        
        // Bind click events
        container.querySelectorAll('.acc-item').forEach(item => {
            item.addEventListener('click', () => {
                const issueId = item.dataset.id;
                this.selectItem(issueId, 'issue');
            });
        });
    }

    renderAssets() {
        const container = document.getElementById('acc-assets-container');
        const assets = this.filterData(this.data.assets, 'asset');

        if (assets.length === 0) {
            container.innerHTML = '<div class="acc-empty">No assets found</div>';
            return;
        }

        container.innerHTML = assets.map(asset => this.renderAssetItem(asset)).join('');
        
        // Bind click events
        container.querySelectorAll('.acc-item').forEach(item => {
            item.addEventListener('click', () => {
                const assetId = item.dataset.id;
                this.selectItem(assetId, 'asset');
            });
        });
    }

    renderIssueItem(issue) {
        const title = issue.title || issue.attributes?.title || issue.description || 'Untitled Issue';
        const status = issue.status || issue.attributes?.status || 'open';
        const priority = issue.priority || issue.attributes?.priority || 'medium';
        const description = issue.description || issue.attributes?.description || '';
        const createdAt = issue.createdAt || issue.attributes?.created_at;
        const id = issue.id;

        const date = createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown';
        const statusClass = priority.toLowerCase();

        return `
            <div class="acc-item" data-id="${id}" data-type="issue">
                <div class="acc-item-header">
                    <h5 class="acc-item-title">${this.escapeHtml(title)}</h5>
                    <span class="acc-item-status ${statusClass}">${priority}</span>
                </div>
                ${description ? `<div class="acc-item-description">${this.escapeHtml(description)}</div>` : ''}
                <div class="acc-item-meta">
                    <span class="acc-item-date">${date}</span>
                    <span class="acc-item-id">#${id.substring(0, 8)}</span>
                </div>
            </div>
        `;
    }

    renderAssetItem(asset) {
        const name = asset.name || asset.attributes?.name || 'Unnamed Asset';
        const status = asset.status || asset.attributes?.status || 'active';
        const assetType = asset.assetType || asset.attributes?.category?.name || 'Equipment';
        const createdAt = asset.createdAt || asset.attributes?.created_at;
        const id = asset.id;

        const date = createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown';
        const statusClass = status.toLowerCase();

        return `
            <div class="acc-item" data-id="${id}" data-type="asset">
                <div class="acc-item-header">
                    <h5 class="acc-item-title">${this.escapeHtml(name)}</h5>
                    <span class="acc-item-status ${statusClass}">${status}</span>
                </div>
                <div class="acc-item-description">${this.escapeHtml(assetType)}</div>
                <div class="acc-item-meta">
                    <span class="acc-item-date">${date}</span>
                    <span class="acc-item-id">#${id.substring(0, 8)}</span>
                </div>
            </div>
        `;
    }

    filterData(data, type) {
        const filter = this.filters.status;
        
        if (filter === 'all') return data;
        
        return data.filter(item => {
            const status = item.status || item.attributes?.status;
            const priority = item.priority || item.attributes?.priority;
            
            switch (filter) {
                case 'open':
                    return type === 'issue' && status?.toLowerCase() === 'open';
                case 'high':
                    return type === 'issue' && priority?.toLowerCase() === 'high';
                case 'active':
                    return type === 'asset' && status?.toLowerCase() === 'active';
                default:
                    return true;
            }
        });
    }

    selectItem(id, type) {
        // Remove previous selection
        document.querySelectorAll('.acc-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // Add selection to clicked item
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.classList.add('selected');
            this.selectedItem = { id, type };
            
            // Focus on item in 3D viewer if available
            this.focusOnItem(id, type);
        }
    }

    focusOnItem(id, type) {
        // Integration with 3D viewer - focus on the selected item
        try {
            if (window.viewer && window.viewer.impl) {
                // Find the dbId for this item
                const data = type === 'issue' ? this.data.issues : this.data.assets;
                const item = data.find(i => i.id === id);
                
                if (item && item.dbId) {
                    // Isolate and focus on the element
                    window.viewer.isolate([item.dbId]);
                    window.viewer.fitToView([item.dbId]);
                    
                    // Optionally show info popup
                    this.showItemInfo(item, type);
                }
            }
        } catch (error) {
            console.error('Error focusing on item:', error);
        }
    }

    showItemInfo(item, type) {
        // Create a temporary info popup (can be enhanced)
        const title = type === 'issue' ? 
            (item.title || item.description || 'Issue') :
            (item.name || 'Asset');
            
        // Use browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Selected ${type}`, {
                body: title,
                icon: '/favicon.ico'
            });
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'acc-error';
        errorDiv.textContent = message;
        
        const content = document.querySelector('.acc-panel-content');
        if (content) {
            content.insertBefore(errorDiv, content.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        const interval = window.ACC_CONFIG.VISUALIZATION.REFRESH_INTERVAL;
        this.refreshInterval = setInterval(() => {
            if (this.isOpen) {
                this.loadData();
            }
        }, interval);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API
    refresh() {
        this.loadData();
    }

    show() {
        this.open();
    }

    hide() {
        this.close();
    }

    getSelectedItem() {
        return this.selectedItem;
    }

    getStats() {
        return this.data.stats;
    }
}

// Initialize ACC Panel when DOM is ready
let accPanel = null;

function initACCPanel() {
    if (!accPanel) {
        accPanel = new ACCPanel();
        window.accPanel = accPanel; // Make globally accessible
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initACCPanel);
} else {
    initACCPanel();
} 