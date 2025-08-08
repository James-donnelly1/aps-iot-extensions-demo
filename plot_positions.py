#!/usr/bin/env python3
"""
Simple script to plot position data from APS sensor data files.
Supports two formats:
1. Original format: est[x,y,z,value] entries
2. Sensor format: [SENSOR_ID][x,y,z,value,additional_info] entries (e.g., D338[...], 9738[...])
Creates 2D plots with anchor points.
"""

import re
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

def parse_data_file(filename):
    """Parse the data file and extract timestamps and position data from est[] or sensor[] values (with variable sensor IDs)."""
    positions = []
    timestamps = []
    
    # Regular expressions for different formats
    est_pattern = r'est\[([-\d.]+),([-\d.]+),([-\d.]+),([-\d.]+)\]'  # Original format
    sensor_pattern = r'(\w+)\[([-\d.]+|nan),([-\d.]+|nan),([-\d.]+|nan),.*?\]'  # Sensor data format (variable sensor ID)
    
    # Regular expressions for timestamps
    timestamp_pattern1 = r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})\]'  # Original format
    timestamp_pattern2 = r'\[(\d{6}\.\d{3}) INF\]'  # New format
    
    try:
        with open(filename, 'r') as file:
            current_timestamp = None
            
            for line_num, line in enumerate(file, 1):
                line = line.strip()
                if not line:
                    continue
                
                # Extract timestamp (try both formats)
                timestamp_match = re.search(timestamp_pattern1, line)
                if timestamp_match:
                    timestamp_str = timestamp_match.group(1)
                    try:
                        current_timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S.%f')
                    except ValueError:
                        print(f"Warning: Could not parse timestamp on line {line_num}: {timestamp_str}")
                        current_timestamp = None
                else:
                    # Try new timestamp format
                    timestamp_match = re.search(timestamp_pattern2, line)
                    if timestamp_match:
                        timestamp_str = timestamp_match.group(1)
                        try:
                            # Convert milliseconds to datetime (relative time)
                            milliseconds = float(timestamp_str)
                            current_timestamp = datetime.fromtimestamp(milliseconds / 1000)
                        except ValueError:
                            print(f"Warning: Could not parse timestamp on line {line_num}: {timestamp_str}")
                            current_timestamp = None
                
                # Extract position data (try both formats)
                position_found = False
                
                # Try original est[] format
                est_match = re.search(est_pattern, line)
                if est_match:
                    try:
                        x, y, z, value = map(float, est_match.groups())
                        positions.append((x, y, z, value))
                        timestamps.append(current_timestamp)
                        position_found = True
                    except ValueError:
                        pass
                
                # Try sensor data format (variable sensor ID)
                if not position_found:
                    sensor_match = re.search(sensor_pattern, line)
                    if sensor_match:
                        try:
                            sensor_id, x_str, y_str, z_str = sensor_match.groups()
                            # Skip lines with nan values
                            if x_str == 'nan' or y_str == 'nan' or z_str == 'nan':
                                continue
                            
                            x, y, z = map(float, [x_str, y_str, z_str])
                            
                            # Extract the 4th value (signal strength or similar)
                            full_match = re.search(rf'{sensor_id}\[[-\d.]+,[-\d.]+,[-\d.]+,([-\d.]+),.*?\]', line)
                            if full_match:
                                value = float(full_match.group(1))
                            else:
                                value = 0  # Default value if not found
                            
                            positions.append((x, y, z, value))
                            timestamps.append(current_timestamp)
                            position_found = True
                        except (ValueError, AttributeError):
                            pass
    
    except FileNotFoundError:
        print(f"Error: File '{filename}' not found.")
        return [], []
    
    # Filter out None entries
    valid_data = [(ts, pos) for ts, pos in zip(timestamps, positions) if ts is not None and pos is not None]
    
    if valid_data:
        timestamps, positions = zip(*valid_data)
        return list(timestamps), list(positions)
    else:
        return [], []

def plot_positions_2d(positions, timestamps):
    """Create 2D plots of the position data."""
    if not positions:
        print("No position data to plot.")
        return
    
    # Extract coordinates
    x_coords = [pos[0] for pos in positions]
    y_coords = [pos[1] for pos in positions]
    z_coords = [pos[2] for pos in positions]
    values = [pos[3] for pos in positions]
    
    # Create subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(12, 10))
    fig.suptitle('Position Data Analysis', fontsize=16)
    
    # X-Y plot
    scatter1 = ax1.scatter(x_coords, y_coords, c=values, cmap='viridis', alpha=0.7)
    ax1.set_xlabel('X Position')
    ax1.set_ylabel('Y Position')
    ax1.set_title('X-Y Position Plot')
    ax1.grid(True, alpha=0.3)
    plt.colorbar(scatter1, ax=ax1, label='Value')
    
    # X-Z plot  
    scatter2 = ax2.scatter(x_coords, z_coords, c=values, cmap='viridis', alpha=0.7)
    ax2.set_xlabel('X Position')
    ax2.set_ylabel('Z Position')
    ax2.set_title('X-Z Position Plot')
    ax2.grid(True, alpha=0.3)
    plt.colorbar(scatter2, ax=ax2, label='Value')
    
    # Y-Z plot
    scatter3 = ax3.scatter(y_coords, z_coords, c=values, cmap='viridis', alpha=0.7)
    ax3.set_xlabel('Y Position')
    ax3.set_ylabel('Z Position')
    ax3.set_title('Y-Z Position Plot')
    ax3.grid(True, alpha=0.3)
    plt.colorbar(scatter3, ax=ax3, label='Value')
    
    # Time series of positions
    if timestamps:
        time_minutes = [(ts - timestamps[0]).total_seconds() / 60 for ts in timestamps]
        ax4.plot(time_minutes, x_coords, label='X', alpha=0.7)
        ax4.plot(time_minutes, y_coords, label='Y', alpha=0.7)
        ax4.plot(time_minutes, z_coords, label='Z', alpha=0.7)
        ax4.set_xlabel('Time (minutes)')
        ax4.set_ylabel('Position')
        ax4.set_title('Position vs Time')
        ax4.legend()
        ax4.grid(True, alpha=0.3)
    else:
        ax4.text(0.5, 0.5, 'No timestamp data', ha='center', va='center', transform=ax4.transAxes)
        ax4.set_title('Position vs Time (No Data)')
    
    plt.tight_layout()
    plt.show()

def plot_positions_3d(positions, timestamps):
    """Create a 3D plot of the position data."""
    if not positions:
        print("No position data to plot.")
        return
    
    # Extract coordinates
    x_coords = [pos[0] for pos in positions]
    y_coords = [pos[1] for pos in positions]
    z_coords = [pos[2] for pos in positions]
    values = [pos[3] for pos in positions]
    
    # Create 3D plot
    fig = plt.figure(figsize=(12, 8))
    ax = fig.add_subplot(111, projection='3d')
    
    # Plot trajectory as connected points
    ax.plot(x_coords, y_coords, z_coords, 'b-', alpha=0.6, linewidth=1, label='Trajectory')
    
    # Plot points colored by value
    scatter = ax.scatter(x_coords, y_coords, z_coords, c=values, cmap='viridis', s=50, alpha=0.8)
    
    # Mark start and end points
    if len(positions) > 0:
        ax.scatter([x_coords[0]], [y_coords[0]], [z_coords[0]], c='green', s=100, marker='o', label='Start')
        ax.scatter([x_coords[-1]], [y_coords[-1]], [z_coords[-1]], c='red', s=100, marker='s', label='End')
    
    ax.set_xlabel('X Position')
    ax.set_ylabel('Y Position')
    ax.set_zlabel('Z Position')
    ax.set_title('3D Position Trajectory')
    ax.legend()
    
    # Add colorbar
    plt.colorbar(scatter, ax=ax, label='Value', shrink=0.8)
    
    plt.show()

def print_statistics(positions, timestamps):
    """Print basic statistics about the position data."""
    if not positions:
        print("No position data available for statistics.")
        return
    
    x_coords = [pos[0] for pos in positions]
    y_coords = [pos[1] for pos in positions]
    z_coords = [pos[2] for pos in positions]
    values = [pos[3] for pos in positions]
    
    print(f"\nPosition Data Statistics:")
    print(f"Number of data points: {len(positions)}")
    print(f"X range: {min(x_coords):.3f} to {max(x_coords):.3f}")
    print(f"Y range: {min(y_coords):.3f} to {max(y_coords):.3f}")
    print(f"Z range: {min(z_coords):.3f} to {max(z_coords):.3f}")
    print(f"Value range: {min(values):.1f} to {max(values):.1f}")
    
    if timestamps:
        duration = (timestamps[-1] - timestamps[0]).total_seconds()
        print(f"Time span: {duration:.1f} seconds ({duration/60:.1f} minutes)")
        print(f"Data rate: {len(positions)/duration:.2f} points/second")

def plot_xy_positions(positions, timestamps):
    """Create a simple 2D plot showing X and Y coordinates."""
    if not positions:
        print("No position data to plot.")
        return
    
    # Extract coordinates (no transformation needed - axes will be inverted)
    x_coords = [pos[0] for pos in positions]
    y_coords = [pos[1] for pos in positions]
    values = [pos[3] for pos in positions]
    
    # Define anchor points (original coordinates)
    anchor_points = [
        (0, 0, 'Anchor 1 = DW0980'),
        (0, 12.32, 'Anchor 2 = DWDB3B'),
        (18.28, 0, 'Anchor 3 = DWCC11'),
        (18.44, 12.32, 'Anchor 4 = DWDB2B')
    ]
    
    # Create 2D plot
    fig, ax = plt.subplots(figsize=(12, 10))
    
    # Plot anchor points first (so they appear behind trajectory)
    anchor_x = [point[0] for point in anchor_points]
    anchor_y = [point[1] for point in anchor_points]
    ax.scatter(anchor_x, anchor_y, c='red', s=150, marker='^', label='Anchors', 
               edgecolors='darkred', linewidth=2, alpha=0.9, zorder=5)
    
    # Add labels for anchor points
    for i, (x, y, label) in enumerate(anchor_points):
        ax.annotate(f'{label}\n({x}, {y})', (x, y), xytext=(10, 10), 
                   textcoords='offset points', fontsize=9, 
                   bbox=dict(boxstyle='round,pad=0.3', facecolor='white', alpha=0.8),
                   ha='left', va='bottom')
    
    # Plot trajectory as connected points
    ax.plot(x_coords, y_coords, 'b-', alpha=0.6, linewidth=2, label='Trajectory')
    
    # Plot points colored by value
    scatter = ax.scatter(x_coords, y_coords, c=values, cmap='viridis', s=80, alpha=0.8, 
                        edgecolors='black', linewidth=0.5, zorder=3)
    
    # Set labels and title
    ax.set_xlabel('X Position', fontsize=12)
    ax.set_ylabel('Y Position', fontsize=12)
    ax.set_title('2D Position Data with Anchor Points', fontsize=14, fontweight='bold')
    
    # Add grid
    ax.grid(True, alpha=0.3)
    
    # Set equal aspect ratio
    ax.set_aspect('equal', adjustable='box')
    
    # Invert axes to put origin at top right, x positive left, y positive down
    ax.invert_xaxis()
    ax.invert_yaxis()
    
    # Add text annotation with statistics
    stats_text = f"Points: {len(positions)}\nTime: {(timestamps[-1] - timestamps[0]).total_seconds()/60:.1f} min" if timestamps else f"Points: {len(positions)}"
    ax.text(0.02, 0.02, stats_text, transform=ax.transAxes, fontsize=10, 
            verticalalignment='bottom', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.8))
    
    plt.tight_layout()
    plt.show()

def main():
    """Main function to run the position plotting script."""
    filename = 'data/Test9'  # Default filename
    
    print(f"Parsing data from: {filename}")
    timestamps, positions = parse_data_file(filename)
    
    if not positions:
        print("No valid position data found in the file.")
        return
    
    print(f"Successfully parsed {len(positions)} position records.")
    
    # Print statistics
    print_statistics(positions, timestamps)
    
    # Create 2D X-Y plot
    print("\nGenerating X-Y position plot...")
    plot_xy_positions(positions, timestamps)
    
    print("Plotting complete!")

if __name__ == "__main__":
    main() 