/**
 * ISP Management Dashboard JavaScript
 * This file handles all dashboard functionality including data fetching, chart rendering,
 * and UI updates for the ISP Management System.
 */

// Initialize socket connection for real-time updates
const socket = io();

// Store for dashboard data
const dashboardData = {
    networkHealth: {},
    devices: [],
    bandwidthData: [],
    topConsumers: []
};

// DOM Elements
const elements = {
    healthScore: document.getElementById('healthScore'),
    activeConnections: document.getElementById('activeConnections'),
    totalDevices: document.getElementById('totalDevices'),
    bandwidthUsage: document.getElementById('bandwidthUsage'),
    deviceTableBody: document.getElementById('deviceTableBody'),
    refreshDevices: document.getElementById('refreshDevices')
};

// Charts
let bandwidthChart;
let consumersChart;

/**
 * Initialize the dashboard
 */
async function initDashboard() {
    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    initCharts();
    
    // Load initial data
    await Promise.all([
        fetchNetworkHealth(),
        fetchDevices(),
        fetchBandwidthData('day'),
        fetchTopConsumers()
    ]);
    
    // Setup socket listeners for real-time updates
    setupSocketListeners();
}

/**
 * Setup event listeners for dashboard interactions
 */
function setupEventListeners() {
    // Refresh devices button
    elements.refreshDevices.addEventListener('click', fetchDevices);
    
    // Time period selectors for bandwidth chart
    document.querySelectorAll('.btn-group-sm .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all buttons
            document.querySelectorAll('.btn-group-sm .btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Get selected time period
            const period = e.target.textContent.toLowerCase();
            fetchBandwidthData(period);
        });
    });
    
    // Tab change listeners
    document.querySelectorAll('.nav-link').forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            document.querySelectorAll('.nav-link').forEach(t => {
                t.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
        });
    });
}

/**
 * Initialize charts for the dashboard
 */
function initCharts() {
    // Bandwidth usage chart
    const bandwidthCtx = document.getElementById('bandwidthChart').getContext('2d');
    bandwidthChart = new Chart(bandwidthCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Download (Mbps)',
                    data: [],
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Upload (Mbps)',
                    data: [],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Bandwidth (Mbps)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });
    
    // Top consumers chart
    const consumersCtx = document.getElementById('consumersChart').getContext('2d');
    consumersChart = new Chart(consumersCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Bandwidth Usage (GB)',
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)',
                    'rgba(83, 102, 255, 0.7)',
                    'rgba(40, 159, 64, 0.7)',
                    'rgba(210, 199, 199, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(199, 199, 199, 1)',
                    'rgba(83, 102, 255, 1)',
                    'rgba(40, 159, 64, 1)',
                    'rgba(210, 199, 199, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.x.toFixed(2)} GB`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Bandwidth Usage (GB)'
                    }
                }
            }
        }
    });
}

/**
 * Setup socket listeners for real-time updates
 */
function setupSocketListeners() {
    // Listen for network health updates
    socket.on('networkHealthUpdate', (data) => {
        updateNetworkHealth(data);
    });
    
    // Listen for device status updates
    socket.on('deviceStatusUpdate', (data) => {
        updateDeviceStatus(data);
    });
    
    // Listen for bandwidth usage updates
    socket.on('bandwidthUpdate', (data) => {
        updateBandwidthChart(data);
    });
}

/**
 * Fetch network health metrics from the API
 */
async function fetchNetworkHealth() {
    try {
        const response = await axios.get('/api/network/health');
        dashboardData.networkHealth = response.data;
        updateNetworkHealthDisplay();
    } catch (error) {
        console.error('Error fetching network health:', error);
        showErrorNotification('Failed to fetch network health data');
    }
}

/**
 * Update the network health metrics display
 */
function updateNetworkHealthDisplay() {
    const { healthScore, activeConnections, totalDevices, bandwidthUsage } = dashboardData.networkHealth;
    
    // Update the display elements
    elements.healthScore.textContent = healthScore ? `${healthScore}%` : 'N/A';
    elements.activeConnections.textContent = activeConnections || 'N/A';
    elements.totalDevices.textContent = totalDevices || 'N/A';
    elements.bandwidthUsage.textContent = bandwidthUsage ? `${bandwidthUsage} Mbps` : 'N/A';
    
    // Update health score color based on value
    if (healthScore) {
        if (healthScore >= 90) {
            elements.healthScore.classList.add('text-success');
        } else if (healthScore >= 70) {
            elements.healthScore.classList.add('text-warning');
        } else {
            elements.healthScore.classList.add('text-danger');
        }
    }
}

/**
 * Fetch network devices from the API
 */
async function fetchDevices() {
    try {
        const response = await axios.get('/api/network/devices');
        dashboardData.devices = response.data;
        updateDevicesTable();
    } catch (error) {
        console.error('Error fetching devices:', error);
        showErrorNotification('Failed to fetch network devices');
    }
}

/**
 * Update the devices table with the latest data
 */
function updateDevicesTable() {
    // Clear the table body
    elements.deviceTableBody.innerHTML = '';
    
    // Add each device to the table
    dashboardData.devices.forEach(device => {
        const row = document.createElement('tr');
        
        // Determine status class
        let statusClass = 'status-unknown';
        if (device.status === 'online') {
            statusClass = 'status-good';
        } else if (device.status === 'warning') {
            statusClass = 'status-warning';
        } else if (device.status === 'offline') {
            statusClass = 'status-critical';
        }
        
        // Format the last active time
        const lastActive = new Date(device.lastActive);
        const formattedLastActive = lastActive.toLocaleString();
        
        // Create the row content
        row.innerHTML = `
            <td>${device.name}</td>
            <td>${device.type}</td>
            <td><span class="status-indicator ${statusClass}"></span> ${device.status}</td>
            <td>${device.ipAddress}</td>
            <td>${device.macAddress}</td>
            <td>${formattedLastActive}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewDeviceDetails('${device.id}')">View</button>
                    <button class="btn btn-outline-warning" onclick="troubleshootDevice('${device.id}')">Troubleshoot</button>
                </div>
            </td>
        `;
        
        elements.deviceTableBody.appendChild(row);
    });
}

/**
 * Update a single device's status in the table
 */
function updateDeviceStatus(updatedDevice) {
    // Find the device in the data
    const deviceIndex = dashboardData.devices.findIndex(d => d.id === updatedDevice.id);
    
    if (deviceIndex !== -1) {
        // Update the device data
        dashboardData.devices[deviceIndex] = {
            ...dashboardData.devices[deviceIndex],
            ...updatedDevice
        };
        
        // Update the table
        updateDevicesTable();
    }
}

/**
 * Fetch bandwidth usage data for the specified period
 */
async function fetchBandwidthData(period) {
    try {
        const response = await axios.get(`/api/network/bandwidth-stats?period=${period}`);
        dashboardData.bandwidthData = response.data;
        updateBandwidthChart();
    } catch (error) {
        console.error('Error fetching bandwidth data:', error);
        showErrorNotification('Failed to fetch bandwidth usage data');
    }
}

/**
 * Update the bandwidth usage chart with the latest data
 */
function updateBandwidthChart() {
    const { timestamps, download, upload } = dashboardData.bandwidthData;
    
    // Update chart data
    bandwidthChart.data.labels = timestamps;
    bandwidthChart.data.datasets[0].data = download;
    bandwidthChart.data.datasets[1].data = upload;
    
    // Update the chart
    bandwidthChart.update();
}

/**
 * Fetch top bandwidth consumers
 */
async function fetchTopConsumers() {
    try {
        const response = await axios.get('/api/network/top-consumers');
        dashboardData.topConsumers = response.data;
        updateConsumersChart();
    } catch (error) {
        console.error('Error fetching top consumers:', error);
        showErrorNotification('Failed to fetch top consumers data');
    }
}

/**
 * Update the top consumers chart with the latest data
 */
function updateConsumersChart() {
    const consumers = dashboardData.topConsumers;
    
    // Extract labels and data
    const labels = consumers.map(c => c.name);
    const data = consumers.map(c => c.usage);
    
    // Update chart data
    consumersChart.data.labels = labels;
    consumersChart.data.datasets[0].data = data;
    
    // Update the chart
    consumersChart.update();
}

/**
 * View device details
 */
function viewDeviceDetails(deviceId) {
    // Implement device details view
    console.log(`View details for device ${deviceId}`);
    // This would typically open a modal with device details
}

/**
 * Troubleshoot a device
 */
function troubleshootDevice(deviceId) {
    // Implement device troubleshooting
    console.log(`Troubleshoot device ${deviceId}`);
    // This would typically start a troubleshooting process
}

/**
 * Show an error notification
 */
function showErrorNotification(message) {
    // Implement error notification
    console.error(message);
    // This could use a toast notification library
}