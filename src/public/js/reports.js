/**
 * ISP Management Reports JavaScript
 * This file handles all reporting functionality including data fetching, chart rendering,
 * and report generation for the ISP Management System.
 */

// Store for reports data
const reportsData = {
    revenueData: [],
    customerStats: {},
    serviceQuality: {},
    selectedReport: 'revenue',
    timeframe: 'monthly'
};

// DOM Elements
const elements = {
    reportSelector: document.getElementById('reportSelector'),
    timeframeSelector: document.getElementById('timeframeSelector'),
    generateReportBtn: document.getElementById('generateReportBtn'),
    exportReportBtn: document.getElementById('exportReportBtn'),
    reportContainer: document.getElementById('reportContainer'),
    revenueChart: document.getElementById('revenueChart'),
    customerChart: document.getElementById('customerChart'),
    qualityChart: document.getElementById('qualityChart')
};

// Charts
let revenueChart;
let customerChart;
let qualityChart;

/**
 * Initialize the reports tab
 */
async function initReports() {
    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    initCharts();
    
    // Load initial report (revenue by default)
    await generateReport('revenue', 'monthly');
}

/**
 * Setup event listeners for report interactions
 */
function setupEventListeners() {
    // Report type selector
    elements.reportSelector?.addEventListener('change', (e) => {
        reportsData.selectedReport = e.target.value;
        generateReport(reportsData.selectedReport, reportsData.timeframe);
    });
    
    // Timeframe selector
    elements.timeframeSelector?.addEventListener('change', (e) => {
        reportsData.timeframe = e.target.value;
        generateReport(reportsData.selectedReport, reportsData.timeframe);
    });
    
    // Generate report button
    elements.generateReportBtn?.addEventListener('click', () => {
        generateReport(reportsData.selectedReport, reportsData.timeframe);
    });
    
    // Export report button
    elements.exportReportBtn?.addEventListener('click', () => {
        exportReport(reportsData.selectedReport, reportsData.timeframe);
    });
}

/**
 * Initialize charts for the reports tab
 */
function initCharts() {
    // Revenue chart
    const revenueCtx = elements.revenueChart?.getContext('2d');
    if (revenueCtx) {
        revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        }
                    }
                }
            }
        });
    }
    
    // Customer chart
    const customerCtx = elements.customerChart?.getContext('2d');
    if (customerCtx) {
        customerChart = new Chart(customerCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'New Customers',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Churned Customers',
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
                            text: 'Number of Customers'
                        }
                    }
                }
            }
        });
    }
    
    // Service quality chart
    const qualityCtx = elements.qualityChart?.getContext('2d');
    if (qualityCtx) {
        qualityChart = new Chart(qualityCtx, {
            type: 'radar',
            data: {
                labels: ['Network Uptime', 'Avg. Latency', 'Ticket Resolution Time', 'Customer Satisfaction', 'Bandwidth Delivery'],
                datasets: [{
                    label: 'Service Quality',
                    data: [],
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1,
                    pointBackgroundColor: 'rgba(153, 102, 255, 1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }
}

/**
 * Generate a report based on the selected type and timeframe
 */
async function generateReport(reportType, timeframe) {
    try {
        // Show loading state
        showLoadingState();
        
        // Fetch report data based on type
        switch (reportType) {
            case 'revenue':
                await fetchRevenueData(timeframe);
                showRevenueReport();
                break;
            case 'customers':
                await fetchCustomerStats(timeframe);
                showCustomerReport();
                break;
            case 'quality':
                await fetchServiceQuality(timeframe);
                showQualityReport();
                break;
            default:
                console.error('Unknown report type:', reportType);
                showErrorNotification('Unknown report type');
        }
        
        // Hide loading state
        hideLoadingState();
    } catch (error) {
        console.error('Error generating report:', error);
        showErrorNotification('Failed to generate report');
        hideLoadingState();
    }
}

/**
 * Show loading state while generating report
 */
function showLoadingState() {
    if (elements.reportContainer) {
        elements.reportContainer.innerHTML = '<div class="d-flex justify-content-center my-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    }
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    // This function would remove the loading spinner
    // The content is replaced by the specific report display functions
}

/**
 * Fetch revenue data from the API
 */
async function fetchRevenueData(timeframe) {
    try {
        const response = await axios.get(`/api/reports/revenue?timeframe=${timeframe}`);
        reportsData.revenueData = response.data;
        updateRevenueChart();
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        throw error;
    }
}

/**
 * Update the revenue chart with the latest data
 */
function updateRevenueChart() {
    const { labels, data } = reportsData.revenueData;
    
    // Update chart data
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = data;
    
    // Update the chart
    revenueChart.update();
}

/**
 * Show the revenue report
 */
function showRevenueReport() {
    if (!elements.reportContainer) return;
    
    // Calculate total revenue
    const totalRevenue = reportsData.revenueData.data.reduce((sum, value) => sum + value, 0);
    
    // Create report content
    elements.reportContainer.innerHTML = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Revenue Report</h5>
                <span class="badge bg-primary">${reportsData.timeframe}</span>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Total Revenue</h6>
                                <h3 class="text-primary">$${totalRevenue.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Average Monthly</h6>
                                <h3 class="text-primary">$${(totalRevenue / reportsData.revenueData.data.length).toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Growth Rate</h6>
                                <h3 class="text-${calculateGrowthRate() >= 0 ? 'success' : 'danger'}">                                    ${calculateGrowthRate() >= 0 ? '+' : ''}${calculateGrowthRate().toFixed(2)}%
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chart-container" style="position: relative; height:400px;">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Reinitialize the chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: reportsData.revenueData.labels,
            datasets: [{
                label: 'Revenue',
                data: reportsData.revenueData.data,
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue ($)'
                    }
                }
            }
        }
    });
}

/**
 * Calculate growth rate based on revenue data
 */
function calculateGrowthRate() {
    const data = reportsData.revenueData.data;
    if (data.length < 2) return 0;
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    if (previous === 0) return 100; // Avoid division by zero
    
    return ((current - previous) / previous) * 100;
}

/**
 * Fetch customer statistics from the API
 */
async function fetchCustomerStats(timeframe) {
    try {
        const response = await axios.get(`/api/reports/customers?timeframe=${timeframe}`);
        reportsData.customerStats = response.data;
        updateCustomerChart();
    } catch (error) {
        console.error('Error fetching customer statistics:', error);
        throw error;
    }
}

/**
 * Update the customer chart with the latest data
 */
function updateCustomerChart() {
    const { labels, newCustomers, churnedCustomers } = reportsData.customerStats;
    
    // Update chart data
    customerChart.data.labels = labels;
    customerChart.data.datasets[0].data = newCustomers;
    customerChart.data.datasets[1].data = churnedCustomers;
    
    // Update the chart
    customerChart.update();
}

/**
 * Show the customer report
 */
function showCustomerReport() {
    if (!elements.reportContainer) return;
    
    // Calculate totals
    const totalNew = reportsData.customerStats.newCustomers.reduce((sum, value) => sum + value, 0);
    const totalChurned = reportsData.customerStats.churnedCustomers.reduce((sum, value) => sum + value, 0);
    const netGrowth = totalNew - totalChurned;
    
    // Create report content
    elements.reportContainer.innerHTML = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Customer Growth Report</h5>
                <span class="badge bg-primary">${reportsData.timeframe}</span>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">New Customers</h6>
                                <h3 class="text-success">${totalNew}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Churned Customers</h6>
                                <h3 class="text-danger">${totalChurned}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Net Growth</h6>
                                <h3 class="text-${netGrowth >= 0 ? 'success' : 'danger'}">
                                    ${netGrowth >= 0 ? '+' : ''}${netGrowth}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chart-container" style="position: relative; height:400px;">
                    <canvas id="customerChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Reinitialize the chart
    const customerCtx = document.getElementById('customerChart').getContext('2d');
    customerChart = new Chart(customerCtx, {
        type: 'line',
        data: {
            labels: reportsData.customerStats.labels,
            datasets: [
                {
                    label: 'New Customers',
                    data: reportsData.customerStats.newCustomers,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Churned Customers',
                    data: reportsData.customerStats.churnedCustomers,
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
                        text: 'Number of Customers'
                    }
                }
            }
        }
    });
}

/**
 * Show the service quality report
 */
function showQualityReport() {
    if (!elements.reportContainer) return;
    
    // Get quality metrics
    const { networkUptime, avgLatency, ticketResolutionTime, customerSatisfaction, bandwidthDelivery } = reportsData.serviceQuality;
    
    // Calculate overall quality score (average of all metrics)
    const overallScore = (
        networkUptime + 
        (100 - avgLatency) + // Lower latency is better, so invert the scale
        (100 - ticketResolutionTime) + // Lower resolution time is better, so invert the scale
        customerSatisfaction + 
        bandwidthDelivery
    ) / 5;
    
    // Create report content
    elements.reportContainer.innerHTML = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Service Quality Report</h5>
                <span class="badge bg-primary">${reportsData.timeframe}</span>
            </div>
            <div class="card-body">
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Overall Quality Score</h6>
                                <h3 class="text-${getScoreColor(overallScore)}">${overallScore.toFixed(1)}%</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Network Uptime</h6>
                                <h3 class="text-${getScoreColor(networkUptime)}">${networkUptime.toFixed(2)}%</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="text-muted">Customer Satisfaction</h6>
                                <h3 class="text-${getScoreColor(customerSatisfaction)}">${customerSatisfaction.toFixed(1)}%</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chart-container" style="position: relative; height:400px;">
                    <canvas id="qualityChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Reinitialize the chart
    const qualityCtx = document.getElementById('qualityChart').getContext('2d');
    qualityChart = new Chart(qualityCtx, {
        type: 'radar',
        data: {
            labels: ['Network Uptime', 'Avg. Latency', 'Ticket Resolution Time', 'Customer Satisfaction', 'Bandwidth Delivery'],
            datasets: [{
                label: 'Service Quality',
                data: [
                    networkUptime,
                    avgLatency,
                    ticketResolutionTime,
                    customerSatisfaction,
                    bandwidthDelivery
                ],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                pointBackgroundColor: 'rgba(153, 102, 255, 1)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

/**
 * Get appropriate color class based on score
 */
function getScoreColor(score) {
    if (score >= 90) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 50) return 'warning';
    return 'danger';
}

/**
 * Fetch service quality metrics from the API
 */
async function fetchServiceQuality(timeframe) {
    try {
        const response = await axios.get(`/api/reports/service-quality?timeframe=${timeframe}`);
        reportsData.serviceQuality = response.data;
        updateQualityChart();
    } catch (error) {
        console.error('Error fetching service quality metrics:', error);
        throw error;
    }
}

/**
 * Update the service quality chart with the latest data
 */
function updateQualityChart() {
    const { networkUptime, avgLatency, ticketResolutionTime, customerSatisfaction, bandwidthDelivery } = reportsData.serviceQuality;
    
    // Update chart data
    qualityChart.data.datasets[0].data = [
        networkUptime,
        avgLatency,
        ticketResolutionTime,
        customerSatisfaction,
        bandwidthDelivery
    ];
    
    // Update the chart
    qualityChart.update();
}

/**
 * Export the current report to a file
 */
async function exportReport(reportType, timeframe) {
    try {
        // Show loading state
        showLoadingState();
        
        // Prepare export data based on report type
        let exportData;
        let fileName;
        
        switch (reportType) {
            case 'revenue':
                exportData = prepareRevenueExport();
                fileName = `revenue_report_${timeframe}_${formatDateForFileName(new Date())}.csv`;
                break;
            case 'customers':
                exportData = prepareCustomerExport();
                fileName = `customer_report_${timeframe}_${formatDateForFileName(new Date())}.csv`;
                break;
            case 'quality':
                exportData = prepareQualityExport();
                fileName = `quality_report_${timeframe}_${formatDateForFileName(new Date())}.csv`;
                break;
            default:
                throw new Error('Unknown report type');
        }
        
        // Generate CSV
        const csvContent = generateCSV(exportData);
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Hide loading state
        hideLoadingState();
        
        // Show success notification
        showSuccessNotification(`Report exported successfully as ${fileName}`);
    } catch (error) {
        console.error('Error exporting report:', error);
        showErrorNotification('Failed to export report');
        hideLoadingState();
    }
}

/**
 * Prepare revenue data for export
 */
function prepareRevenueExport() {
    const { labels, data } = reportsData.revenueData;
    
    // Create header row
    const exportData = [
        ['Period', 'Revenue ($)']
    ];
    
    // Add data rows
    for (let i = 0; i < labels.length; i++) {
        exportData.push([labels[i], data[i].toFixed(2)]);
    }
    
    // Add summary row
    const totalRevenue = data.reduce((sum, value) => sum + value, 0);
    exportData.push(['Total', totalRevenue.toFixed(2)]);
    
    return exportData;
}

/**
 * Prepare customer data for export
 */
function prepareCustomerExport() {
    const { labels, newCustomers, churnedCustomers } = reportsData.customerStats;
    
    // Create header row
    const exportData = [
        ['Period', 'New Customers', 'Churned Customers', 'Net Growth']
    ];
    
    // Add data rows
    for (let i = 0; i < labels.length; i++) {
        const netGrowth = newCustomers[i] - churnedCustomers[i];
        exportData.push([labels[i], newCustomers[i], churnedCustomers[i], netGrowth]);
    }
    
    // Add summary row
    const totalNew = newCustomers.reduce((sum, value) => sum + value, 0);
    const totalChurned = churnedCustomers.reduce((sum, value) => sum + value, 0);
    const netGrowth = totalNew - totalChurned;
    exportData.push(['Total', totalNew, totalChurned, netGrowth]);
    
    return exportData;
}

/**
 * Prepare service quality data for export
 */
function prepareQualityExport() {
    const { networkUptime, avgLatency, ticketResolutionTime, customerSatisfaction, bandwidthDelivery } = reportsData.serviceQuality;
    
    // Create export data
    const exportData = [
        ['Metric', 'Score (%)']
    ];
    
    // Add metrics
    exportData.push(['Network Uptime', networkUptime.toFixed(2)]);
    exportData.push(['Average Latency', avgLatency.toFixed(2)]);
    exportData.push(['Ticket Resolution Time', ticketResolutionTime.toFixed(2)]);
    exportData.push(['Customer Satisfaction', customerSatisfaction.toFixed(2)]);
    exportData.push(['Bandwidth Delivery', bandwidthDelivery.toFixed(2)]);
    
    // Calculate overall score
    const overallScore = (
        networkUptime + 
        (100 - avgLatency) + 
        (100 - ticketResolutionTime) + 
        customerSatisfaction + 
        bandwidthDelivery
    ) / 5;
    
    // Add overall score
    exportData.push(['Overall Quality Score', overallScore.toFixed(2)]);
    
    return exportData;
}

/**
 * Generate CSV content from data array
 */
function generateCSV(data) {
    return data.map(row => row.join(',')).join('\n');
}

/**
 * Format date for file name (YYYY-MM-DD)
 */
function formatDateForFileName(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}