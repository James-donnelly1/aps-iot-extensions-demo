/// import * as Autodesk from "@types/forge-viewer";

import { findNearestTimestampIndex } from './HistoricalDataView.js';

export class SensorListPanel extends Autodesk.Viewing.UI.PropertyPanel {
    constructor(viewer, id, title, options) {
        super(viewer.container, id, title, options);
        this.container.style.left = (options.x || 0) + 'px';
        this.container.style.top = (options.y || 0) + 'px';
        this.container.style.width = (options.width || 500) + 'px';
        this.container.style.height = (options.height || 400) + 'px';
        this.container.style.resize = 'none';
        this.container.classList.add('forma-panel');
    }

    initialize() {
        this.title = this.createTitleBar(this.titleLabel || this.container.id);
        this.initializeMoveHandlers(this.title);
        this.container.appendChild(this.title);
        
        // Create Forma-style header
        const header = document.createElement('div');
        header.className = 'forma-panel-header';
        header.innerHTML = `
            <div class="forma-panel-icon">🔍</div>
            <div>
                <h3 class="forma-panel-title">Sensor Data</h3>
                <p class="forma-panel-subtitle">Live Monitoring Dashboard</p>
            </div>
            <div style="margin-left: auto;">
                <span class="forma-badge success">Real-time</span>
            </div>
        `;
        
        this.content = document.createElement('div');
        this.content.className = 'forma-panel-content';
        this.content.style.height = 'calc(100% - 80px)';
        this.content.style.overflow = 'hidden';
        this.content.style.padding = '0';
        
        // Create table container
        const tableContainer = document.createElement('div');
        tableContainer.className = 'datagrid-container';
        tableContainer.style.cssText = `
            position: relative;
            height: 100%;
            background: var(--bg-secondary);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-light);
            overflow: hidden;
        `;
        
        this.content.appendChild(tableContainer);
        this.container.appendChild(header);
        this.container.appendChild(this.content);
        
        // Initialize Tabulator with Forma styling
        this.table = new Tabulator('.datagrid-container', {
            height: '100%',
            layout: 'fitColumns',
            groupBy: 'group',
            headerSort: false,
            rowHover: true,
            tooltips: true,
            columns: [
                // Columns will be set dynamically
            ],
            groupHeader: function(value, count, data) {
                return `<div style="
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-3);
                    font-weight: 600;
                    color: var(--text-primary);
                    font-size: var(--font-size-sm);
                    padding: var(--spacing-2) 0;
                ">
                    <div style="
                        width: 1.5rem;
                        height: 1.5rem;
                        border-radius: var(--radius-sm);
                        background: var(--autodesk-blue-500);
                        color: var(--autodesk-white);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: var(--font-size-xs);
                        font-weight: 700;
                    ">${count}</div>
                    ${value}
                </div>`;
            }
        });
        
        this.table.on('rowClick', (ev, row) => {
            if (this.onSensorClicked) {
                const data = row.getData();
                this.onSensorClicked(data.id);
                
                // Visual feedback for row selection
                this.table.getRows().forEach(r => {
                    r.getElement().style.background = '';
                    r.getElement().style.borderLeft = '';
                });
                row.getElement().style.background = 'rgba(6, 150, 215, 0.05)';
                row.getElement().style.borderLeft = '3px solid var(--autodesk-blue-500)';
            }
        });
        
        this.table.on('rowMouseEnter', (ev, row) => {
            if (!row.getElement().style.borderLeft) {
                row.getElement().style.background = 'var(--bg-tertiary)';
            }
        });
        
        this.table.on('rowMouseLeave', (ev, row) => {
            if (!row.getElement().style.borderLeft) {
                row.getElement().style.background = '';
            }
        });
    }

    update(dataView, timestamp, updateColumns) {
        var _a, _b;
        if (updateColumns) {
            const columns = [
                {
                    title: 'Sensor',
                    field: 'sensor',
                    minWidth: 120,
                    headerStyle: {
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: 'var(--font-size-xs)',
                        letterSpacing: '0.025em'
                    },
                    cellStyle: {
                        fontWeight: '500',
                        color: 'var(--text-primary)'
                    }
                },
                {
                    title: 'Group',
                    field: 'group',
                    minWidth: 100,
                    headerStyle: {
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: 'var(--font-size-xs)',
                        letterSpacing: '0.025em'
                    },
                    cellStyle: {
                        color: 'var(--text-muted)',
                        fontSize: 'var(--font-size-xs)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                    }
                }
            ];
            
            for (const [channelId, channel] of dataView.getChannels().entries()) {
                columns.push({
                    title: channel.name,
                    field: channelId,
                    minWidth: 100,
                    headerStyle: {
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        fontSize: 'var(--font-size-xs)',
                        letterSpacing: '0.025em'
                    },
                    cellStyle: {
                        fontFamily: '"SF Mono", Monaco, Consolas, monospace',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-primary)',
                        textAlign: 'center'
                    },
                    formatter: function(cell) {
                        const value = cell.getValue();
                        if (value && value.includes('°C')) {
                            return `<span style="
                                color: var(--red-600);
                                font-weight: 500;
                            ">${value}</span>`;
                        } else if (value && value.includes('%')) {
                            return `<span style="
                                color: var(--autodesk-blue-500);
                                font-weight: 500;
                            ">${value}</span>`;
                        } else if (value && value.includes('ppm')) {
                            return `<span style="
                                color: var(--green-500);
                                font-weight: 500;
                            ">${value}</span>`;
                        }
                        return `<span style="
                            color: var(--text-secondary);
                            font-weight: 400;
                        ">${value}</span>`;
                    }
                });
            }
            (_a = this.table) === null || _a === void 0 ? void 0 : _a.setColumns(columns);
        }
        
        const rows = [];
        for (const [sensorId, sensor] of dataView.getSensors().entries()) {
            const row = {
                id: sensorId,
                sensor: sensor.name,
                group: sensor.groupName
            };
            for (const [channelId, channel] of dataView.getChannels().entries()) {
                const samples = dataView.getSamples(sensorId, channelId);
                if (samples) {
                    const closestIndex = findNearestTimestampIndex(samples.timestamps, timestamp);
                    const value = samples.values[closestIndex];
                    row[channelId] = `${value.toFixed(2)} ${channel.unit}`;
                } else {
                    row[channelId] = '—';
                }
            }
            rows.push(row);
        }
        (_b = this.table) === null || _b === void 0 ? void 0 : _b.replaceData(rows);
    }
}