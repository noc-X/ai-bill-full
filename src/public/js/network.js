/**
 * ISP Management Network JavaScript
 * This file handles all network functionality including monitoring, troubleshooting,
 * and device management for the ISP Management System.
 */

// Store for network data
const networkData = {
    connections: [],
    devices: [],
    healthMetrics: {},
    selectedDevice: null,
    filterOptions: {
        status: 'all',
        search: ''
    }
};

// DOM Elements
const elements = {
    connectionsTableBody: document.getElementById('connectionsTableBody'),
    devicesTableBody: document.getElementById('devicesTableBody'),
    deviceSearch: document.getElementById('deviceSearch'),
    statusFilter: document.getElementById('statusFilter'),
    addDeviceBtn: document.getElementById('addDeviceBtn'),
    deviceModal: document.getElementById('deviceModal'),
    deviceForm: document.getElementById('deviceForm'),
    deviceDetails: document.getElementById('deviceDetails'),
    networkMap: document.getElementById('networkMap'),
    healthScore: document.getElementById('networkHealthScore'),
    uptime: document.getElementById('networkUptime'),
    latency: document.getElementById('networkLatency'),
    packetLoss: document.getElementById('networkPacketLoss')
};

// Charts
let trafficChart;
let latencyChart;

/**
 * Initialize the network tab
 */
async function initNetwork() {
    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    initCharts();
    
    // Load initial data
    await Promise.all([
        fetchConnections(),
        fetchDevices(),
        fetchHealthMetrics()
    ]);
    
    // Initialize network map
    initNetworkMap();

    // Reset form when modal is hidden
    $('#addDeviceModal').on('hidden.bs.modal', function () {
        document.getElementById('deviceForm').reset();
        document.getElementById('apiConfigSection').style.display = 'none';
        document.getElementById('sshOptions').style.display = 'none';
        document.getElementById('telnetOptions').style.display = 'none';
        document.getElementById('snmpOptions').style.display = 'none';
        document.getElementById('snmpV3Options').style.display = 'none';
    });

    // Handle SNMP version change
    document.getElementById('snmpVersion')?.addEventListener('change', function() {
        const snmpV1V2Options = document.getElementById('snmpV1V2Options');
        const snmpV3Options = document.getElementById('snmpV3Options');
        
        if (this.value === '3') {
            snmpV1V2Options.style.display = 'none';
            snmpV3Options.style.display = 'block';
        } else {
            snmpV1V2Options.style.display = 'block';
            snmpV3Options.style.display = 'none';
        }
    });

    // Initialize device form
    initDeviceForm();

    // Add parent device selection to form
    const deviceForm = document.getElementById('deviceForm');
    const locationField = deviceForm.querySelector('#deviceLocation').parentElement;
    const parentDeviceField = document.createElement('div');
    parentDeviceField.className = 'mb-3';
    parentDeviceField.innerHTML = `
        <label for="deviceParent" class="form-label">Parent Device</label>
        <select class="form-select" id="deviceParent" name="parentId">
            <option value="">No Parent Device</option>
        </select>
    `;
    locationField.after(parentDeviceField);
}

/**
 * Setup event listeners for network interactions
 */
function setupEventListeners() {
    // Device search
    elements.deviceSearch?.addEventListener('input', (e) => {
        networkData.filterOptions.search = e.target.value;
        filterDevices();
    });
    
    // Status filter
    elements.statusFilter?.addEventListener('change', (e) => {
        networkData.filterOptions.status = e.target.value;
        filterDevices();
    });
    
    // Add device button
    elements.addDeviceBtn?.addEventListener('click', () => {
        showDeviceModal();
    });

    // Handle connection type change
    document.getElementById('connectionType')?.addEventListener('change', function() {
        const apiConfig = document.getElementById('apiConfigSection');
        const sshOptions = document.getElementById('sshOptions');
        const telnetOptions = document.getElementById('telnetOptions');
        const snmpOptions = document.getElementById('snmpOptions');
        const credentialsSection = document.getElementById('credentialsSection');

        apiConfig.style.display = 'none';
        sshOptions.style.display = 'none';
        telnetOptions.style.display = 'none';
        snmpOptions.style.display = 'none';
        credentialsSection.style.display = 'block';

        switch(this.value) {
            case 'api':
                apiConfig.style.display = 'block';
                credentialsSection.style.display = 'none';
                break;
            case 'ssh':
                sshOptions.style.display = 'block';
                break;
            case 'telnet':
                telnetOptions.style.display = 'block';
                break;
            case 'snmp':
                snmpOptions.style.display = 'block';
                break;
        }
    });
    
    // Device form submission
    elements.deviceForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveDevice();
    });
}

/**
 * Initialize charts for the network tab
 */
function initCharts() {
    // Traffic chart
    const trafficCtx = document.getElementById('trafficChart')?.getContext('2d');
    if (trafficCtx) {
        trafficChart = new Chart(trafficCtx, {
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
    }
}

/**
 * Initialize the network map visualization
 */
function initNetworkMap() {
    const container = document.getElementById('networkMap');
    const data = {
        nodes: new vis.DataSet(),
        edges: new vis.DataSet()
    };

    const options = {
        nodes: {
            shape: 'image',
            size: 30,
            font: {
                size: 12,
                color: '#343a40'
            },
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 2,
            color: { color: '#999', highlight: '#666' },
            smooth: {
                type: 'continuous'
            }
        },
        physics: {
            enabled: true,
            hierarchicalRepulsion: {
                centralGravity: 0.0,
                springLength: 100,
                springConstant: 0.01,
                nodeDistance: 120
            },
            solver: 'hierarchicalRepulsion'
        },
        layout: {
            hierarchical: {
                enabled: true,
                direction: 'UD',
                sortMethod: 'directed'
            }
        }
    };

    const network = new vis.Network(container, data, options);

    // Update network map with devices
    function updateNetworkMap(devices) {
        data.nodes.clear();
        data.edges.clear();

        devices.forEach(device => {
            const nodeColor = device.status === 'online' ? '#28a745' : 
                            device.status === 'warning' ? '#ffc107' : '#dc3545';
            
            const deviceIcons = {
                mikrotik: './images/router-icon.svg',
                switch: './images/switch-icon.svg',
                olt: './images/olt-icon.svg',
                ap: './images/ap-icon.svg'
            };

            data.nodes.add({
                id: device.id,
                label: device.name,
                image: deviceIcons[device.type],
                color: { border: nodeColor },
                title: `${device.name}\nIP: ${device.ipAddress}\nStatus: ${device.status}\nCPU: ${device.cpuLoad}%\nMemory: ${device.memoryUsage}%`
            });

            if (device.parentId) {
                data.edges.add({
                    from: device.parentId,
                    to: device.id
                });
            }
        });
    }

    // Update network map when devices are updated
    document.addEventListener('devicesUpdated', (event) => {
        updateNetworkMap(event.detail.devices);
    });

    return network;
    if (!elements.networkMap) return;
    
    // For a real implementation, you would use a library like vis.js or cytoscape.js
    // This is a placeholder implementation
    elements.networkMap.innerHTML = `
        <div class="d-flex justify-content-center align-items-center h-100">
            <p class="text-muted">Loading network map...</p>
        </div>
    `;
    
    // Fetch network topology data and render the map
    fetchNetworkTopology().then(topology => {
        renderNetworkMap(topology);
    }).catch(error => {
        console.error('Error loading network map:', error);
        elements.networkMap.innerHTML = `
            <div class="d-flex justify-content-center align-items-center h-100">
                <p class="text-danger">Failed to load network map. ${error.message}</p>
            </div>
        `;
    });
}

/**
 * Fetch network topology data from the API
 */
async function fetchNetworkTopology() {
    try {
        const response = await fetch('/api/network/topology');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching network topology:', error);
        throw error;
    }
}

/**
 * Render the network map with the provided topology data
 */
function renderNetworkMap(topology) {
    if (!elements.networkMap) return;
    
    // Clear the network map
    elements.networkMap.innerHTML = '';
    
    // For a real implementation, you would use a library like vis.js or cytoscape.js
    // This is a placeholder implementation with HTML/CSS
    const mapContainer = document.createElement('div');
    mapContainer.className = 'd-flex flex-column justify-content-center align-items-center h-100';
    
    const mapTitle = document.createElement('h5');
    mapTitle.textContent = 'Network Topology';
    mapTitle.className = 'mb-3';
    
    const mapLegend = document.createElement('div');
    mapLegend.className = 'd-flex mb-3';
    mapLegend.innerHTML = `
        <div class="me-3"><i class="bi bi-router-fill text-primary"></i> Router</div>
        <div class="me-3"><i class="bi bi-hdd-network-fill text-success"></i> Switch</div>
        <div><i class="bi bi-wifi text-warning"></i> Access Point</div>
    `;
    
    const mapContent = document.createElement('div');
    mapContent.className = 'network-map-content border rounded p-3 w-100 h-75 position-relative';
    
    // Add nodes to the map
    topology.nodes.forEach(node => {
        const nodeElement = document.createElement('div');
        nodeElement.className = 'position-absolute network-node';
        nodeElement.style.left = `${Math.random() * 80 + 10}%`;
        nodeElement.style.top = `${Math.random() * 80 + 10}%`;
        
        let icon = 'bi-question-circle';
        let color = 'text-secondary';
        
        switch (node.type) {
            case 'router':
                icon = 'bi-router-fill';
                color = 'text-primary';
                break;
            case 'switch':
                icon = 'bi-hdd-network-fill';
                color = 'text-success';
                break;
            case 'ap':
                icon = 'bi-wifi';
                color = 'text-warning';
                break;
        }
        
        nodeElement.innerHTML = `
            <i class="bi ${icon} ${color} fs-4"></i>
            <div class="small">${node.label}</div>
        `;
        
        nodeElement.addEventListener('click', () => {
            alert(`Selected device: ${node.label}`);
        });
        
        mapContent.appendChild(nodeElement);
    });
    
    mapContainer.appendChild(mapTitle);
    mapContainer.appendChild(mapLegend);
    mapContainer.appendChild(mapContent);
    
    elements.networkMap.appendChild(mapContainer);
    
    // Add some basic CSS for the network map
    const style = document.createElement('style');
    style.textContent = `
        .network-node {
            cursor: pointer;
            text-align: center;
            transition: transform 0.2s;
        }
        .network-node:hover {
            transform: scale(1.2);
        }
    `;
    document.head.appendChild(style);
}

/**
 * Fetch active connections from the API
 */
async function fetchConnections() {
    try {
        const response = await fetch('/api/network/connections');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        networkData.connections = await response.json();
        renderConnectionsTable();
    } catch (error) {
        console.error('Error fetching connections:', error);
        networkData.connections = [];
        renderConnectionsTable();
    }
}

/**
 * Render the connections table with the current data
 */
function renderConnectionsTable() {
    if (!elements.connectionsTableBody) return;
    
    // Clear the table body
    elements.connectionsTableBody.innerHTML = '';
    
    // Add each connection to the table
    networkData.connections.forEach(connection => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${connection.customer}</td>
            <td>${connection.ip}</td>
            <td>${connection.mac}</td>
            <td>${connection.connectionTime}</td>
            <td>${connection.download}</td>
            <td>${connection.upload}</td>
            <td>
                <div class="progress" style="height: 15px;">
                    <div class="progress-bar bg-success" role="progressbar" style="width: ${connection.signal}" aria-valuenow="${parseInt(connection.signal)}" aria-valuemin="0" aria-valuemax="100">${connection.signal}</div>
                </div>
            </td>
        `;
        
        elements.connectionsTableBody.appendChild(row);
    });
}

/**
 * Fetch network devices from the API
 */
async function fetchDevices() {
    try {
        const response = await fetch('/api/network/devices');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        networkData.devices = await response.json();
        renderDevicesTable();
    } catch (error) {
        console.error('Error fetching devices:', error);
        networkData.devices = [];
        renderDevicesTable();
    }
}

/**
 * Render the devices table with the current data
 */
function renderDevicesTable() {
    if (!elements.devicesTableBody) return;
    
    // Clear the table body
    elements.devicesTableBody.innerHTML = '';
    
    // Filter devices based on current filter options
    const filteredDevices = filterDevices();
    
    // Add each device to the table
    filteredDevices.forEach(device => {
        const row = document.createElement('tr');
        
        // Determine status class and icon
        let statusClass = '';
        let statusIcon = '';
        
        switch (device.status) {
            case 'online':
                statusClass = 'status-online';
                statusIcon = 'bi-check-circle-fill text-success';
                break;
            case 'offline':
                statusClass = 'status-offline';
                statusIcon = 'bi-x-circle-fill text-danger';
                break;
            case 'warning':
                statusClass = 'status-warning';
                statusIcon = 'bi-exclamation-triangle-fill text-warning';
                break;
        }
        
        // Create device info tooltip content
        const deviceInfo = [
            `CPU Load: ${device.cpuLoad ? device.cpuLoad.toFixed(1) + '%' : 'N/A'}`,
            `Memory Usage: ${device.memoryUsage ? device.memoryUsage.toFixed(1) + '%' : 'N/A'}`,
            `Temperature: ${device.temperature ? device.temperature.toFixed(1) + '°C' : 'N/A'}`,
            `Connection: ${device.connectionMethod || 'N/A'}`,
            `Location: ${device.location || 'N/A'}`
        ].join('\n');
        
        row.innerHTML = `
            <td>${device.name}</td>
            <td>${device.ipAddress}</td>
            <td><i class="bi ${typeIcon} me-1" title="${device.type.charAt(0).toUpperCase() + device.type.slice(1)}"></i> ${device.type.charAt(0).toUpperCase() + device.type.slice(1)}</td>
            <td><span class="status-indicator ${statusClass}"></span> <i class="bi ${statusIcon} me-1" title="${deviceInfo}"></i> ${device.status.charAt(0).toUpperCase() + device.status.slice(1)}</td>
            <td>${lastSeenText}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editDevice('${device.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-outline-info" onclick="viewDeviceDetails('${device.id}')"><i class="bi bi-eye"></i></button>
                    <button class="btn btn-outline-secondary" onclick="pingDevice('${device.ipAddress}')"><i class="bi bi-arrow-repeat"></i></button>
                    <button class="btn btn-outline-danger" onclick="deleteDevice('${device.id}')"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        `;
        
        elements.devicesTableBody.appendChild(row);
    });
}

/**
 * Filter devices based on current filter options
 */
function filterDevices() {
    if (!networkData.devices.length) return [];
    
    return networkData.devices.filter(device => {
        // Filter by status
        if (networkData.filterOptions.status !== 'all' && 
            device.status !== networkData.filterOptions.status) {
            return false;
        }
        
        // Filter by search term
        if (networkData.filterOptions.search) {
            const searchTerm = networkData.filterOptions.search.toLowerCase();
            return (
                device.name.toLowerCase().includes(searchTerm) ||
                device.ip.includes(searchTerm) ||
                device.type.toLowerCase().includes(searchTerm)
            );
        }
        
        return true;
    });
}

/**
 * Fetch network health metrics from the API
 */
async function fetchHealthMetrics() {
    try {
        const response = await fetch('/api/network/health');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        networkData.healthMetrics = await response.json();
        updateHealthMetricsDisplay();
    } catch (error) {
        console.error('Error fetching health metrics:', error);
        networkData.healthMetrics = {};
        updateHealthMetricsDisplay();
    }
}

/**
 * Update the health metrics display with current data
 */
function updateHealthMetricsDisplay() {
    if (!networkData.healthMetrics) return;
    
    // Update health score
    if (elements.healthScore) {
        elements.healthScore.style.width = `${networkData.healthMetrics.healthScore}%`;
        elements.healthScore.textContent = `${networkData.healthMetrics.healthScore}%`;
        
        // Update color based on score
        elements.healthScore.className = 'progress-bar';
        if (networkData.healthMetrics.healthScore >= 80) {
            elements.healthScore.classList.add('bg-success');
        } else if (networkData.healthMetrics.healthScore >= 60) {
            elements.healthScore.classList.add('bg-warning');
        } else {
            elements.healthScore.classList.add('bg-danger');
        }
    }
    
    // Update other metrics
    if (elements.uptime) {
        elements.uptime.textContent = networkData.healthMetrics.uptime;
    }
    
    if (elements.latency) {
        elements.latency.textContent = networkData.healthMetrics.latency;
    }
    
    if (elements.packetLoss) {
        elements.packetLoss.textContent = networkData.healthMetrics.packetLoss;
    }
}

/**
 * Show device modal for adding/editing a device
 */
function showDeviceModal(deviceId = null) {
    // Reset form
    elements.deviceForm.reset();
    
    // Set modal title
    const modalTitle = document.querySelector('#deviceModal .modal-title');
    
    if (deviceId) {
        // Edit existing device
        modalTitle.textContent = 'Edit Device';
        const device = networkData.devices.find(d => d.id === deviceId);
        if (device) {
            networkData.selectedDevice = device;
            // Populate form fields
            document.getElementById('deviceName').value = device.name;
            document.getElementById('deviceIP').value = device.ip;
            document.getElementById('deviceType').value = device.type;
            document.getElementById('deviceLocation').value = device.location || '';
            document.getElementById('deviceUsername').value = device.username || '';
            document.getElementById('devicePassword').value = device.password || '';
            document.getElementById('deviceParent').value = device.parentId || '';
        }
    } else {
        // Add new device
        modalTitle.textContent = 'Add New Device';
        networkData.selectedDevice = null;
        
        // Populate parent device dropdown
        const parentSelect = document.getElementById('deviceParent');
        parentSelect.innerHTML = '<option value="">No Parent Device</option>';
        networkData.devices.forEach(device => {
            parentSelect.innerHTML += `<option value="${device.id}">${device.name} (${device.type})</option>`;
        });
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deviceModal'));
    modal.show();
}

/**
 * Save device (create or update)
 */
async function saveDevice() {
    const form = document.getElementById('deviceForm');
    const formData = {
        name: form.querySelector('#deviceName').value,
        type: form.querySelector('#deviceType').value,
        ipAddress: form.querySelector('#ipAddress').value,
        macAddress: form.querySelector('#macAddress').value,
        connectionMethod: form.querySelector('#connectionMethod').value,
        location: form.querySelector('#location').value,
        parentId: form.querySelector('#parentDevice').value || null,
        notes: form.querySelector('#notes').value
    };

    try {
        const response = await fetch('/api/network/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to save device');
        }

        const device = await response.json();
        networkData.devices.push(device);
        renderDevicesTable();
        
        // Dispatch event to update network map
        document.dispatchEvent(new CustomEvent('devicesUpdated', {
            detail: { devices: networkData.devices }
        }));

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDeviceModal'));
        modal.hide();
        form.reset();

        // Show success message
        showToast('Success', 'Device added successfully', 'success');
    } catch (error) {
        console.error('Error saving device:', error);
        showToast('Error', 'Failed to save device', 'error');
    }
}
    try {
        const deviceData = {
            name: document.getElementById('deviceName').value,
            ip: document.getElementById('deviceIP').value,
            type: document.getElementById('deviceType').value,
            location: document.getElementById('deviceLocation').value,
            username: document.getElementById('deviceUsername').value,
            password: document.getElementById('devicePassword').value,
            parentId: document.getElementById('deviceParent').value || null
        };
        
        let url = '/api/network/devices';
        let method = 'POST';
        
        if (networkData.selectedDevice) {
            // Update existing device
            url = `/api/network/devices/${networkData.selectedDevice.id}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deviceModal'));
        modal.hide();
        
        // Refresh devices list
        await fetchDevices();
        
        // Show success message
        showToast('success', `Device ${networkData.selectedDevice ? 'updated' : 'added'} successfully`);
    } catch (error) {
        console.error('Error saving device:', error);
        showToast('error', `Failed to save device: ${error.message}`);
    }
}

/**
 * View device details
 */
function viewDeviceDetails(deviceId) {
    const device = networkData.devices.find(d => d.id === deviceId);
    if (!device || !elements.deviceDetails) return;
    
    // Populate device details
    elements.deviceDetails.innerHTML = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${device.name}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${device.ip}</h6>
                ${device.parent ? `<p class="text-info">Parent Device: ${device.parent.name} (${device.parent.type})</p>` : ''}
                ${device.children && device.children.length ? `
                <div class="mt-2">
                    <strong>Child Devices:</strong>
                    <ul class="list-unstyled">
                        ${device.children.map(child => `<li>- ${child.name} (${child.type})</li>`).join('')}
                    </ul>
                </div>` : ''}
                <p class="card-text">
                    <strong>Type:</strong> ${device.type.charAt(0).toUpperCase() + device.type.slice(1)}<br>
                    <strong>Status:</strong> ${device.status.charAt(0).toUpperCase() + device.status.slice(1)}<br>
                    <strong>Last Seen:</strong> ${device.lastSeen}<br>
                    ${device.location ? `<strong>Location:</strong> ${device.location}<br>` : ''}
                </p>
            </div>
        </div>
        
        <div class="card mb-3">
            <div class="card-header">Performance</div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">CPU Load</label>
                    <div class="progress" style="height: 15px;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: ${device.cpuLoad || '0%'}" aria-valuenow="${parseInt(device.cpuLoad || '0')}" aria-valuemin="0" aria-valuemax="100">${device.cpuLoad || '0%'}</div>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Memory Usage</label>
                    <div class="progress" style="height: 15px;">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${device.memoryUsage || '0%'}" aria-valuenow="${parseInt(device.memoryUsage || '0')}" aria-valuemin="0" aria-valuemax="100">${device.memoryUsage || '0%'}</div>
                    </div>
                </div>
                <div>
                    <label class="form-label">Uptime</label>
                    <p>${device.uptime || 'N/A'}</p>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">Actions</div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <button class="btn btn-primary" onclick="pingDevice('${device.ip}')"><i class="bi bi-arrow-repeat me-2"></i>Ping Device</button>
                    <button class="btn btn-warning" onclick="rebootDevice('${device.id}')"><i class="bi bi-power me-2"></i>Reboot Device</button>
                    <button class="btn btn-danger" onclick="removeDevice('${device.id}')"><i class="bi bi-trash me-2"></i>Remove Device</button>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deviceDetailsModal'));
    modal.show();
}

/**
 * Ping a device by IP address
 */
async function pingDevice(ip) {
    try {
        showToast('info', `Pinging ${ip}...`);
        
        const response = await fetch('/api/network/ping', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ host: ip, count: 5 })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('success', `Ping successful: ${result.data.received}/${result.data.sent} packets, avg ${result.data.avgResponseTime}ms`);
        } else {
            showToast('error', `Ping failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Error pinging device:', error);
        showToast('error', `Failed to ping device: ${error.message}`);
    }
}

/**
 * Reboot a device
 */
async function rebootDevice(deviceId) {
    if (!confirm('Are you sure you want to reboot this device?')) return;
    
    try {
        const device = networkData.devices.find(d => d.id === deviceId);
        if (!device) return;
        
        showToast('info', `Rebooting ${device.name}...`);
        
        const response = await fetch(`/api/network/devices/${deviceId}/reboot`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('success', `Reboot command sent to ${device.name}`);
        } else {
            showToast('error', `Failed to reboot device: ${result.error}`);
        }
    } catch (error) {
        console.error('Error rebooting device:', error);
        showToast('error', `Failed to reboot device: ${error.message}`);
    }
}

/**
 * Remove a device
 */
async function removeDevice(deviceId) {
    if (!confirm('Are you sure you want to remove this device?')) return;
    
    try {
        const device = networkData.devices.find(d => d.id === deviceId);
        if (!device) return;
        
        const response = await fetch(`/api/network/devices/${deviceId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('deviceDetailsModal'));
        if (modal) modal.hide();
        
        // Refresh devices list
        await fetchDevices();
        
        showToast('success', `Device ${device.name} removed successfully`);
    } catch (error) {
        console.error('Error removing device:', error);
        showToast('error', `Failed to remove device: ${error.message}`);
    }
}

/**
 * Show a toast notification
 */
function showToast(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    // Set toast color based on type
    let bgColor = 'bg-primary';
    let icon = 'bi-info-circle-fill';
    
    switch (type) {
        case 'success':
            bgColor = 'bg-success';
            icon = 'bi-check-circle-fill';
            break;
        case 'error':
            bgColor = 'bg-danger';
            icon = 'bi-exclamation-circle-fill';
            break;
        case 'warning':
            bgColor = 'bg-warning';
            icon = 'bi-exclamation-triangle-fill';
            break;
    }
    
    // Set toast content
    toastElement.innerHTML = `
        <div class="toast-header ${bgColor} text-white">
            <i class="bi ${icon} me-2"></i>
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toastElement);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
}

async function editDevice(deviceId) {
    try {
        const response = await fetch(`/api/network/devices/${deviceId}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const device = await response.json();
        
        // Populate form with device data
        document.getElementById('deviceName').value = device.name;
        document.getElementById('deviceIP').value = device.ipAddress;
        document.getElementById('deviceType').value = device.type;
        document.getElementById('deviceLocation').value = device.location;
        document.getElementById('connectionType').value = device.connectionMethod;
        
        // Show appropriate connection fields
        const event = new Event('change');
        document.getElementById('connectionType').dispatchEvent(event);
        
        // Set credentials based on connection type
        if (device.connectionMethod === 'api') {
            document.getElementById('apiKey').value = device.apiKey || '';
            document.getElementById('apiEndpoint').value = device.apiEndpoint || '';
        } else {
            document.getElementById('deviceUsername').value = device.username || '';
            document.getElementById('devicePassword').value = device.password || '';
            document.getElementById('deviceParent').value = device.parentId || '';
        }
        
        // Store device ID for update
        document.getElementById('deviceForm').dataset.deviceId = deviceId;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addDeviceModal'));
        modal.show();
    } catch (error) {
        console.error('Error fetching device:', error);
        alert('Failed to load device data');
    }
}

async function deleteDevice(deviceId) {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
        const response = await fetch(`/api/network/devices/${deviceId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        // Remove device from table and refresh
        networkData.devices = networkData.devices.filter(d => d.id !== deviceId);
        renderDevicesTable();
        
        alert('Device deleted successfully');
    } catch (error) {
        console.error('Error deleting device:', error);
        alert('Failed to delete device');
    }
}

async function saveDevice() {
    const form = document.getElementById('deviceForm');
    const formData = {
        name: form.querySelector('#deviceName').value,
        type: form.querySelector('#deviceType').value,
        ipAddress: form.querySelector('#ipAddress').value,
        macAddress: form.querySelector('#macAddress').value,
        connectionMethod: form.querySelector('#connectionMethod').value,
        location: form.querySelector('#location').value,
        parentId: form.querySelector('#parentDevice').value || null,
        notes: form.querySelector('#notes').value
    };

    try {
        const response = await fetch('/api/network/devices', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to save device');
        }

        const device = await response.json();
        networkData.devices.push(device);
        renderDevicesTable();
        
        // Dispatch event to update network map
        document.dispatchEvent(new CustomEvent('devicesUpdated', {
            detail: { devices: networkData.devices }
        }));

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDeviceModal'));
        modal.hide();
        form.reset();

        // Show success message
        showToast('Success', 'Device added successfully', 'success');
    } catch (error) {
        console.error('Error saving device:', error);
        showToast('Error', 'Failed to save device', 'error');
    }
}
    const form = document.getElementById('deviceForm');
    const deviceId = form.dataset.deviceId;
    
    const deviceData = {
        name: document.getElementById('deviceName').value,
        ipAddress: document.getElementById('deviceIP').value,
        type: document.getElementById('deviceType').value,
        location: document.getElementById('deviceLocation').value,
        connectionMethod: document.getElementById('connectionType').value
    };
    
    // Add connection-specific data
    if (deviceData.connectionMethod === 'api') {
        deviceData.apiKey = document.getElementById('apiKey').value;
        deviceData.apiEndpoint = document.getElementById('apiEndpoint').value;
    } else {
        deviceData.username = document.getElementById('deviceUsername').value;
        deviceData.password = document.getElementById('devicePassword').value;
    }
    
    try {
        const url = deviceId ? `/api/network/devices/${deviceId}` : '/api/network/devices';
        const method = deviceId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(deviceData)
        });
        
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        
        const savedDevice = await response.json();
        
        // Update devices list
        if (deviceId) {
            networkData.devices = networkData.devices.map(d => 
                d.id === deviceId ? savedDevice : d
            );
        } else {
            networkData.devices.push(savedDevice);
        }
        
        // Refresh table and close modal
        renderDevicesTable();
        bootstrap.Modal.getInstance(document.getElementById('addDeviceModal')).hide();
        
        alert(`Device ${deviceId ? 'updated' : 'added'} successfully`);
    } catch (error) {
        console.error('Error saving device:', error);
        alert('Failed to save device');
    }
}

/**
 * View device details
 */
function viewDeviceDetails(deviceId) {
    const device = networkData.devices.find(d => d.id === deviceId);
    if (!device || !elements.deviceDetails) return;
    
    // Populate device details
    elements.deviceDetails.innerHTML = `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${device.name}</h5>
                <h6 class="card-subtitle mb-2 text-muted">${device.ip}</h6>
                ${device.parent ? `<p class="text-info">Parent Device: ${device.parent.name} (${device.parent.type})</p>` : ''}
                ${device.children && device.children.length ? `
                <div class="mt-2">
                    <strong>Child Devices:</strong>
                    <ul class="list-unstyled">
                        ${device.children.map(child => `<li>- ${child.name} (${child.type})</li>`).join('')}
                    </ul>
                </div>` : ''}
                <p class="card-text">
                    <strong>Type:</strong> ${device.type.charAt(0).toUpperCase() + device.type.slice(1)}<br>
                    <strong>Status:</strong> ${device.status.charAt(0).toUpperCase() + device.status.slice(1)}<br>
                    <strong>Last Seen:</strong> ${device.lastSeen}<br>
                    ${device.location ? `<strong>Location:</strong> ${device.location}<br>` : ''}
                </p>
            </div>
        </div>
        
        <div class="card mb-3">
            <div class="card-header">Performance</div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">CPU Load</label>
                    <div class="progress" style="height: 15px;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: ${device.cpuLoad || '0%'}" aria-valuenow="${parseInt(device.cpuLoad || '0')}" aria-valuemin="0" aria-valuemax="100">${device.cpuLoad || '0%'}</div>
                    </div>
                </div>
                <div class="mb-3">
                    <label class="form-label">Memory Usage</label>
                    <div class="progress" style="height: 15px;">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${device.memoryUsage || '0%'}" aria-valuenow="${parseInt(device.memoryUsage || '0')}" aria-valuemin="0" aria-valuemax="100">${device.memoryUsage || '0%'}</div>
                    </div>
                </div>
                <div>
                    <label class="form-label">Uptime</label>
                    <p>${device.uptime || 'N/A'}</p>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">Actions</div>
            <div class="card-body">
                <div class="d-grid gap-2">
                    <button class="btn btn-primary" onclick="pingDevice('${device.ip}')"><i class="bi bi-arrow-repeat me-2"></i>Ping Device</button>
                    <button class="btn btn-warning" onclick="rebootDevice('${device.id}')"><i class="bi bi-power me-2"></i>Reboot Device</button>
                    <button class="btn btn-danger" onclick="removeDevice('${device.id}')"><i class="bi bi-trash me-2"></i>Remove Device</button>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deviceDetailsModal'));
    modal.show();
}

/**
 * Ping a device by IP address
 */
async function pingDevice(ip) {
    try {
        showToast('info', `Pinging ${ip}...`);
        
        const response = await fetch('/api/network/ping', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ host: ip, count: 5 })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('success', `Ping successful: ${result.data.received}/${result.data.sent} packets, avg ${result.data.avgResponseTime}ms`);
        } else {
            showToast('error', `Ping failed: ${result.error}`);
        }
    } catch (error) {
        console.error('Error pinging device:', error);
        showToast('error', `Failed to ping device: ${error.message}`);
    }
}

/**
 * Reboot a device
 */
async function rebootDevice(deviceId) {
    if (!confirm('Are you sure you want to reboot this device?')) return;
    
    try {
        const device = networkData.devices.find(d => d.id === deviceId);
        if (!device) return;
        
        showToast('info', `Rebooting ${device.name}...`);
        
        const response = await fetch(`/api/network/devices/${deviceId}/reboot`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast('success', `Reboot command sent to ${device.name}`);
        } else {
            showToast('error', `Failed to reboot device: ${result.error}`);
        }
    } catch (error) {
        console.error('Error rebooting device:', error);
        showToast('error', `Failed to reboot device: ${error.message}`);
    }
}

/**
 * Remove a device
 */
async function removeDevice(deviceId) {
    if (!confirm('Are you sure you want to remove this device?')) return;
    
    try {
        const device = networkData.devices.find(d => d.id === deviceId);
        if (!device) return;
        
        const response = await fetch(`/api/network/devices/${deviceId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        // Close modal if open
        const modal = bootstrap.Modal.getInstance(document.getElementById('deviceDetailsModal'));
        if (modal) modal.hide();
        
        // Refresh devices list
        await fetchDevices();
        
        showToast('success', `Device ${device.name} removed successfully`);
    } catch (error) {
        console.error('Error removing device:', error);
        showToast('error', `Failed to remove device: ${error.message}`);
    }
}

/**
 * Show a toast notification
 */
function showToast(type, message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.className = 'toast';
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    // Set toast color based on type
    let bgColor = 'bg-primary';
    let icon = 'bi-info-circle-fill';
    
    switch (type) {
        case 'success':
            bgColor = 'bg-success';
            icon = 'bi-check-circle-fill';
            break;
        case 'error':
            bgColor = 'bg-danger';
            icon = 'bi-exclamation-circle-fill';
            break;
        case 'warning':
            bgColor = 'bg-warning';
            icon = 'bi-exclamation-triangle-fill';
            break;
    }
    
    // Set toast content
    toastElement.innerHTML = `
        <div class="toast-header ${bgColor} text-white">
            <i class="bi ${icon} me-2"></i>
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toastElement);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();
}