/**
 * Network Monitoring Dashboard
 * Provides real-time visualization of network status and issues
 */

// Initialize Socket.IO connection
const socket = io('/network-monitor');
let monitoringSettings = {};

// Load monitoring settings
async function loadMonitoringSettings() {
    try {
        const response = await fetch('/api/settings/network-device');
        if (!response.ok) {
            throw new Error('Failed to load network device settings');
        }
        monitoringSettings = await response.json();
        console.log('Loaded monitoring settings:', monitoringSettings);
    } catch (error) {
        console.error('Error loading monitoring settings:', error);
    }
}

// Load settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadMonitoringSettings();
});

// Handle connection events
socket.on('connect', () => {
    console.log('Connected to network monitoring service');
    updateStatusIndicator(true);
});

socket.on('disconnect', () => {
    console.log('Disconnected from network monitoring service');
    updateStatusIndicator(false);
});

// Handle monitoring data events
socket.on('monitoring-data', (data) => {
    updateResourceCharts(data.resources);
    updateNetworkStatus(data.status);
    updateDeviceList(data.devices);
});

// DOM elements
const statusIndicator = document.getElementById('monitoring-status');
const lastUpdateTime = document.getElementById('last-update-time');
const cpuUsageChart = document.getElementById('cpu-usage-chart');
const memoryUsageChart = document.getElementById('memory-usage-chart');
const diskUsageChart = document.getElementById('disk-usage-chart');
const activeConnectionsElement = document.getElementById('active-connections');
const criticalIssuesElement = document.getElementById('critical-issues');
const warningIssuesElement = document.getElementById('warning-issues');
const interfacesTableBody = document.getElementById('interfaces-table-body');
const wirelessClientsTableBody = document.getElementById('wireless-clients-table-body');

// Chart instances
let cpuChart, memoryChart, diskChart;

// Initialize charts
function initCharts() {
  // CPU Usage Chart
  cpuChart = new Chart(cpuUsageChart, {
    type: 'gauge',
    data: {
      datasets: [{
        value: 0,
        minValue: 0,
        maxValue: 100,
        backgroundColor: ['#0d6efd', '#0dcaf0', '#ffc107', '#dc3545'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'CPU Usage (%)'
      }
    }
  });
  
  // Memory Usage Chart
  memoryChart = new Chart(memoryUsageChart, {
    type: 'gauge',
    data: {
      datasets: [{
        value: 0,
        minValue: 0,
        maxValue: 100,
        backgroundColor: ['#0d6efd', '#0dcaf0', '#ffc107', '#dc3545'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Memory Usage (%)'
      }
    }
  });
  
  // Disk Usage Chart
  diskChart = new Chart(diskUsageChart, {
    type: 'gauge',
    data: {
      datasets: [{
        value: 0,
        minValue: 0,
        maxValue: 100,
        backgroundColor: ['#0d6efd', '#0dcaf0', '#ffc107', '#dc3545'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      title: {
        display: true,
        text: 'Disk Usage (%)'
      }
    }
  });
}

// Update monitoring status indicator
function updateStatusIndicator(isMonitoring) {
  if (isMonitoring) {
    statusIndicator.innerHTML = '<span class="badge bg-success">Active</span>';
  } else {
    statusIndicator.innerHTML = '<span class="badge bg-secondary">Inactive</span>';
  }
}

// Update resource usage charts
function updateResourceCharts(resources) {
  if (!resources) return;
  
  // Update CPU chart
  cpuChart.data.datasets[0].value = resources.cpuLoad;
  cpuChart.update();
  
  // Update Memory chart
  memoryChart.data.datasets[0].value = parseFloat(resources.memoryUsage);
  memoryChart.update();
  
  // Update Disk chart
  diskChart.data.datasets[0].value = parseFloat(resources.diskUsage);
  diskChart.update();
}

// Update interfaces table
function updateInterfacesTable(interfaces) {
  if (!interfaces || !Array.isArray(interfaces)) return;
  
  // Clear table
  interfacesTableBody.innerHTML = '';
  
  // Add interfaces to table
  interfaces.forEach(iface => {
    const row = document.createElement('tr');
    
    // Status class
    const statusClass = iface.status === 'up' ? 'bg-success' : 'bg-danger';
    
    row.innerHTML = `
      <td>${iface.name}</td>
      <td>${iface.type}</td>
      <td><span class="badge ${statusClass}">${iface.status}</span></td>
      <td>${formatBytes(iface.rxBytes)}</td>
      <td>${formatBytes(iface.txBytes)}</td>
      <td>${iface.rxErrors}</td>
      <td>${iface.txErrors}</td>
    `;
    
    interfacesTableBody.appendChild(row);
  });
}

// Update wireless clients table
function updateWirelessClientsTable(wireless) {
  if (!wireless || !wireless.clients || !Array.isArray(wireless.clients)) return;
  
  // Clear table
  wirelessClientsTableBody.innerHTML = '';
  
  // Add clients to table
  wireless.clients.forEach(client => {
    const row = document.createElement('tr');
    
    // Signal strength class
    const signalStrength = parseInt(client.signalStrength || '-100');
    let signalClass = 'bg-danger';
    
    if (signalStrength > -70) {
      signalClass = 'bg-success';
    } else if (signalStrength > -80) {
      signalClass = 'bg-warning';
    }
    
    row.innerHTML = `
      <td>${client.interface}</td>
      <td>${client.macAddress}</td>
      <td><span class="badge ${signalClass}">${client.signalStrength} dBm</span></td>
      <td>${client.txRate || 'N/A'}</td>
      <td>${client.rxRate || 'N/A'}</td>
      <td>${client.uptime || 'N/A'}</td>
    `;
    
    wirelessClientsTableBody.appendChild(row);
  });
}

// Update active connections count
function updateActiveConnections(connections) {
  if (!connections || !Array.isArray(connections)) return;
  
  activeConnectionsElement.textContent = connections.length;
}

// Update issues lists
function updateIssuesLists(issues) {
  if (!issues) return;
  
  // Clear lists
  criticalIssuesElement.innerHTML = '';
  warningIssuesElement.innerHTML = '';
  
  // Add critical issues
  if (issues.critical && Array.isArray(issues.critical)) {
    if (issues.critical.length === 0) {
      criticalIssuesElement.innerHTML = '<li class="list-group-item">No critical issues</li>';
    } else {
      issues.critical.forEach(issue => {
        const item = document.createElement('li');
        item.className = 'list-group-item list-group-item-danger';
        item.innerHTML = `<strong>${issue.component}:</strong> ${issue.message}`;
        criticalIssuesElement.appendChild(item);
      });
    }
  }
  
  // Add warning issues
  if (issues.warning && Array.isArray(issues.warning)) {
    if (issues.warning.length === 0) {
      warningIssuesElement.innerHTML = '<li class="list-group-item">No warning issues</li>';
    } else {
      issues.warning.forEach(issue => {
        const item = document.createElement('li');
        item.className = 'list-group-item list-group-item-warning';
        item.innerHTML = `<strong>${issue.component}:</strong> ${issue.message}`;
        warningIssuesElement.appendChild(item);
      });
    }
  }
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Format timestamp to local time string
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Socket.IO event handlers
socket.on('connect', () => {
  console.log('Connected to server');
  
  // Get initial monitoring status
  fetch('/api/network-monitor/status')
    .then(response => response.json())
    .then(data => {
      updateStatusIndicator(data.isMonitoring);
      
      // If monitoring is active, get current data
      if (data.isMonitoring) {
        fetch('/api/network-monitor/data')
          .then(response => response.json())
          .then(monitoringData => {
            if (monitoringData.status === 'success') {
              updateDashboard(monitoringData.data);
            }
          })
          .catch(error => console.error('Error fetching monitoring data:', error));
      }
    })
    .catch(error => console.error('Error fetching monitoring status:', error));
});

// Listen for real-time monitoring updates
socket.on('network_monitoring_update', (data) => {
  updateDashboard(data);
});

// Listen for critical issues
socket.on('network_critical_issue', (data) => {
  // Show notification
  showNotification('Critical Network Issue', data.issues[0].message, 'danger');
});

// Listen for monitoring errors
socket.on('network_monitoring_error', (data) => {
  console.error('Monitoring error:', data.error);
  showNotification('Monitoring Error', data.error, 'warning');
});

// Update the entire dashboard with new data
function updateDashboard(data) {
  if (!data) return;
  
  // Update last update time
  lastUpdateTime.textContent = formatTimestamp(data.timestamp);
  
  // Update resource charts
  updateResourceCharts(data.resources);
  
  // Update interfaces table
  updateInterfacesTable(data.interfaces);
  
  // Update wireless clients table
  updateWirelessClientsTable(data.wireless);
  
  // Update active connections
  updateActiveConnections(data.connections);
  
  // Update issues lists
  updateIssuesLists(data.issues);
}

// Show notification
function showNotification(title, message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <strong>${title}</strong>: ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove toast after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// Start monitoring button
const startMonitoringBtn = document.getElementById('start-monitoring-btn');
if (startMonitoringBtn) {
  startMonitoringBtn.addEventListener('click', () => {
    fetch('/api/network-monitor/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ interval: 60 }) // 60 seconds interval
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'started' || data.status === 'already_running') {
          updateStatusIndicator(true);
          showNotification('Monitoring', 'Network monitoring started successfully', 'success');
        }
      })
      .catch(error => {
        console.error('Error starting monitoring:', error);
        showNotification('Error', 'Failed to start monitoring', 'danger');
      });
  });
}

// Stop monitoring button
const stopMonitoringBtn = document.getElementById('stop-monitoring-btn');
if (stopMonitoringBtn) {
  stopMonitoringBtn.addEventListener('click', () => {
    fetch('/api/network-monitor/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'stopped' || data.status === 'not_running') {
          updateStatusIndicator(false);
          showNotification('Monitoring', 'Network monitoring stopped successfully', 'info');
        }
      })
      .catch(error => {
        console.error('Error stopping monitoring:', error);
        showNotification('Error', 'Failed to stop monitoring', 'danger');
      });
  });
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize charts
  initCharts();
  
  // Check monitoring status on page load
  fetch('/api/network-monitor/status')
    .then(response => response.json())
    .then(data => {
      // Update status indicator
      updateStatusIndicator(data.isMonitoring);
      
      // If monitoring is active, get current data
      if (data.isMonitoring) {
        fetch('/api/network-monitor/data')
          .then(response => response.json())
          .then(monitoringData => {
            if (monitoringData.status === 'success') {
              updateDashboard(monitoringData.data);
            }
          })
          .catch(error => console.error('Error fetching monitoring data:', error));
      }
    })
    .catch(error => console.error('Error fetching monitoring status:', error));
  
  // Setup socket listeners for real-time updates
  setupSocketListeners();
});

// Setup socket event listeners
function setupSocketListeners() {
  // Listen for real-time monitoring updates
  socket.on('network_monitoring_update', (data) => {
    updateDashboard(data);
  });
  
  // Listen for critical issues
  socket.on('network_critical_issue', (data) => {
    // Show notification
    showNotification('Critical Network Issue', data.issues[0].message, 'danger');
  });
  
  // Listen for monitoring errors
  socket.on('network_monitoring_error', (data) => {
    console.error('Monitoring error:', data.error);
    showNotification('Monitoring Error', data.error, 'warning');
  });
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}