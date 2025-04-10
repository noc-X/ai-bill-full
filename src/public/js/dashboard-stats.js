/**
 * Dashboard Statistics Handler
 * Handles fetching and displaying statistics for the ISP Management Dashboard
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initDashboardStats();
    initPaymentStats();
    initCharts();
});

// Dashboard elements
const elements = {
    healthScore: document.getElementById('healthScore'),
    activeConnections: document.getElementById('activeConnections'),
    totalDevices: document.getElementById('totalDevices'),
    bandwidthUsage: document.getElementById('bandwidthUsage'),
    deviceTableBody: document.getElementById('deviceTableBody'),
    // Payment statistics elements
    totalRevenue: document.getElementById('totalRevenue'),
    pendingPayments: document.getElementById('pendingPayments'),
    completedPayments: document.getElementById('completedPayments'),
    monthlyRevenue: document.getElementById('monthlyRevenue'),
    // Charts
    bandwidthChart: document.getElementById('bandwidthChart'),
    revenueChart: document.getElementById('revenueChart'),
    consumersChart: document.getElementById('consumersChart'),
    paymentStatusChart: document.getElementById('paymentStatusChart')
};

/**
 * Initialize dashboard statistics
 */
async function initDashboardStats() {
    try {
        // Fetch initial statistics
        await fetchDashboardStats();
        
        // Set up periodic refresh
        setInterval(fetchDashboardStats, 30000); // Refresh every 30 seconds
    } catch (error) {
        console.error('Failed to initialize dashboard stats:', error);
    }
}

/**
 * Fetch dashboard statistics from the server
 */
async function fetchDashboardStats() {
    try {
        const response = await window.apiClient.get('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        
        const stats = await response.json();
        updateDashboardStats(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

/**
 * Update dashboard statistics display
 * @param {Object} stats - Dashboard statistics
 */
function updateDashboardStats(stats) {
    // Update network health score
    if (elements.healthScore) {
        elements.healthScore.textContent = `${stats.networkHealth}%`;
    }
    
    // Update active connections
    if (elements.activeConnections) {
        elements.activeConnections.textContent = stats.activeConnections;
    }
    
    // Update total devices
    if (elements.totalDevices) {
        elements.totalDevices.textContent = stats.totalDevices;
    }
    
    // Update bandwidth usage
    if (elements.bandwidthUsage) {
        elements.bandwidthUsage.textContent = formatBandwidth(stats.bandwidthUsage);
    }
    
    // Update device table
    updateDeviceTable(stats.devices);
}

/**
 * Initialize payment statistics
 */
async function initPaymentStats() {
    try {
        await fetchPaymentStats();
        setInterval(fetchPaymentStats, 30000); // Refresh every 30 seconds
    } catch (error) {
        console.error('Failed to initialize payment stats:', error);
    }
}

/**
 * Fetch payment statistics from the server
 */
async function fetchPaymentStats() {
    try {
        const response = await window.apiClient.get('/api/payments/stats');
        if (!response.ok) throw new Error('Failed to fetch payment stats');
        
        const stats = await response.json();
        updatePaymentStats(stats);
    } catch (error) {
        console.error('Error fetching payment stats:', error);
    }
}

/**
 * Update payment statistics display
 * @param {Object} stats - Payment statistics
 */
function updatePaymentStats(stats) {
    // Update total revenue
    if (elements.totalRevenue) {
        elements.totalRevenue.textContent = formatCurrency(stats.totalRevenue);
    }
    
    // Update pending payments
    if (elements.pendingPayments) {
        elements.pendingPayments.textContent = stats.pendingPayments;
    }
    
    // Update completed payments
    if (elements.completedPayments) {
        elements.completedPayments.textContent = stats.completedPayments;
    }
    
    // Update monthly revenue
    if (elements.monthlyRevenue) {
        elements.monthlyRevenue.textContent = formatCurrency(stats.monthlyRevenue);
    }
}

/**
 * Format currency value for display
 * @param {number} amount - Amount in currency
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Initialize charts
 */
function initCharts() {
    initBandwidthChart();
    initRevenueChart();
    initConsumersChart();
    initPaymentStatusChart();

    // Add click handlers for period buttons
    document.querySelectorAll('.btn-group button').forEach(button => {
        button.addEventListener('click', (e) => {
            const chartType = e.target.closest('.card').querySelector('canvas').id;
            const period = e.target.dataset.period;
            
            // Update active state
            e.target.closest('.btn-group').querySelectorAll('button').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // Refresh chart data
            if (chartType === 'bandwidthChart') {
                fetchBandwidthData(period);
            } else if (chartType === 'revenueChart') {
                fetchRevenueData(period);
            }
        });
    });
}

/**
 * Initialize bandwidth chart
 */
function initBandwidthChart() {
    if (!elements.bandwidthChart) return;
    
    const ctx = elements.bandwidthChart.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Download',
                    data: [],
                    borderColor: '#0d6efd',
                    tension: 0.4,
                    fill: false
                },
                {
                    label: 'Upload',
                    data: [],
                    borderColor: '#198754',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatBandwidth(value)
                    }
                }
            }
        }
    });

    // Initial data fetch
    fetchBandwidthData('day');
}

/**
 * Initialize consumers chart
 */
function initConsumersChart() {
    if (!elements.consumersChart) return;
    
    const ctx = elements.consumersChart.getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Bandwidth Usage',
                data: [],
                backgroundColor: '#0d6efd'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatBandwidth(value)
                    }
                }
            }
        }
    });

    // Initial data fetch
    fetchConsumersData();
}

/**
 * Fetch bandwidth data from server
 * @param {string} period - Time period (day/week/month)
 */
async function fetchBandwidthData(period) {
    try {
        const response = await window.apiClient.get(`/api/network/bandwidth-usage?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch bandwidth data');
        
        const data = await response.json();
        updateBandwidthChart(data);
    } catch (error) {
        console.error('Error fetching bandwidth data:', error);
    }
}

/**
 * Fetch revenue data from server
 * @param {string} period - Time period (day/week/month)
 */
async function fetchRevenueData(period) {
    try {
        const response = await window.apiClient.get(`/api/payments/revenue?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch revenue data');
        
        const data = await response.json();
        updateRevenueChart(data);
    } catch (error) {
        console.error('Error fetching revenue data:', error);
    }
}

/**
 * Fetch top consumers data from server
 */
async function fetchConsumersData() {
    try {
        const response = await window.apiClient.get('/api/network/top-consumers');
        if (!response.ok) throw new Error('Failed to fetch consumers data');
        
        const data = await response.json();
        updateConsumersChart(data);
    } catch (error) {
        console.error('Error fetching consumers data:', error);
    }
}

/**
 * Update bandwidth chart with new data
 * @param {Object} data - Bandwidth usage data
 */
function updateBandwidthChart(data) {
    const chart = Chart.getChart(elements.bandwidthChart);
    if (!chart) return;

    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.download;
    chart.data.datasets[1].data = data.upload;
    chart.update();
}

/**
 * Update revenue chart with new data
 * @param {Object} data - Revenue data
 */
function updateRevenueChart(data) {
    const chart = Chart.getChart(elements.revenueChart);
    if (!chart) return;

    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.revenue;
    chart.update();
}

/**
 * Update consumers chart with new data
 * @param {Object} data - Consumers data
 */
function updateConsumersChart(data) {
    const chart = Chart.getChart(elements.consumersChart);
    if (!chart) return;

    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.usage;
    chart.update();
}

/**
 * Update payment status chart with new data
 * @param {Object} data - Payment status data
 */
function updatePaymentStatusChart(data) {
    const chart = Chart.getChart(elements.paymentStatusChart);
    if (!chart) return;

    chart.data.datasets[0].data = [
        data.completed || 0,
        data.pending || 0,
        data.failed || 0
    ];
    chart.update();
}

/**
 * Initialize revenue chart
 */
function initRevenueChart() {
    if (!elements.revenueChart) return;
    
    const ctx = elements.revenueChart.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#28a745',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

/**
 * Initialize payment status chart
 */
function initPaymentStatusChart() {
    if (!elements.paymentStatusChart) return;
    
    const ctx = elements.paymentStatusChart.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending', 'Failed'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#28a745', '#ffc107', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Format bandwidth value for display
 * @param {number} bytes - Bandwidth in bytes
 * @returns {string} Formatted bandwidth string
 */
function formatBandwidth(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Update the device table with current device data
 * @param {Array} devices - Array of device objects
 */
function updateDeviceTable(devices) {
    if (!elements.deviceTableBody) return;
    
    elements.deviceTableBody.innerHTML = devices.map(device => `
        <tr>
            <td>${device.name}</td>
            <td>${device.ipAddress}</td>
            <td>
                <span class="status-indicator status-${device.status.toLowerCase()}"></span>
                ${device.status}
            </td>
            <td>${new Date(device.lastSeen).toLocaleString()}</td>
            <td>${formatBandwidth(device.bandwidthUsage)}</td>
        </tr>
    `).join('');
}