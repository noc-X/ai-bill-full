/**
 * ISP Management Bandwidth JavaScript
 * This file handles all bandwidth management functionality including customer bandwidth limits,
 * QoS profiles, and bandwidth monitoring for the ISP Management System.
 */

// Store for bandwidth data
const bandwidthData = {
    customers: [],
    qosProfiles: [
        { id: 'default', name: 'Default' },
        { id: 'streaming', name: 'Streaming Optimized' },
        { id: 'gaming', name: 'Gaming Optimized' },
        { id: 'business', name: 'Business Priority' }
    ],
    selectedCustomer: null,
    filterOptions: {
        status: 'all',
        search: ''
    }
};

// DOM Elements
const elements = {
    customerTableBody: document.getElementById('bandwidthCustomerTableBody'),
    customerSearch: document.getElementById('bandwidthCustomerSearch'),
    statusFilter: document.getElementById('bandwidthStatusFilter'),
    syncAllBtn: document.getElementById('syncAllBandwidthBtn'),
    bandwidthModal: document.getElementById('bandwidthModal'),
    bandwidthForm: document.getElementById('bandwidthForm'),
    qosModal: document.getElementById('qosModal'),
    qosForm: document.getElementById('qosForm'),
    boostModal: document.getElementById('boostModal'),
    boostForm: document.getElementById('boostForm')
};

/**
 * Initialize the bandwidth management tab
 */
async function initBandwidth() {
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await fetchCustomersWithBandwidth();
}

/**
 * Setup event listeners for bandwidth management interactions
 */
function setupEventListeners() {
    // Customer search
    elements.customerSearch?.addEventListener('input', (e) => {
        bandwidthData.filterOptions.search = e.target.value;
        filterCustomers();
    });
    
    // Status filter
    elements.statusFilter?.addEventListener('change', (e) => {
        bandwidthData.filterOptions.status = e.target.value;
        filterCustomers();
    });
    
    // Sync all button
    elements.syncAllBtn?.addEventListener('click', async () => {
        await syncAllBandwidthLimits();
    });
    
    // Bandwidth form submission
    elements.bandwidthForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateBandwidthLimit();
    });
    
    // QoS form submission
    elements.qosForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateQoSProfile();
    });
    
    // Boost form submission
    elements.boostForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await applyBandwidthBoost();
    });
}

/**
 * Fetch customers with their bandwidth information
 */
async function fetchCustomersWithBandwidth() {
    try {
        showLoader('Fetching customers...');
        
        // Fetch customers from API
        const response = await fetch('/api/customers');
        const data = await response.json();
        
        bandwidthData.customers = data;
        renderCustomerTable();
        
        hideLoader();
    } catch (error) {
        console.error('Error fetching customers:', error);
        showToast('error', 'Failed to fetch customers');
        hideLoader();
    }
}

/**
 * Filter customers based on search and status filters
 */
function filterCustomers() {
    renderCustomerTable();
}

/**
 * Render the customer table with bandwidth information
 */
function renderCustomerTable() {
    if (!elements.customerTableBody) return;
    
    const { search, status } = bandwidthData.filterOptions;
    
    // Filter customers based on search and status
    const filteredCustomers = bandwidthData.customers.filter(customer => {
        const matchesSearch = search === '' || 
            customer.name.toLowerCase().includes(search.toLowerCase()) ||
            customer.pppoeUsername.toLowerCase().includes(search.toLowerCase());
            
        const matchesStatus = status === 'all' || customer.status === status;
        
        return matchesSearch && matchesStatus;
    });
    
    // Clear table
    elements.customerTableBody.innerHTML = '';
    
    // Add customers to table
    filteredCustomers.forEach(customer => {
        const row = document.createElement('tr');
        
        const packageInfo = customer.Package ? 
            `${customer.Package.downloadSpeed}/${customer.Package.uploadSpeed} ${customer.Package.speedUnit}` : 
            'No package';
            
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.pppoeUsername}</td>
            <td>${packageInfo}</td>
            <td>
                <span class="badge ${customer.status === 'active' ? 'bg-success' : 'bg-danger'}">
                    ${customer.status}
                </span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-primary" onclick="showBandwidthModal('${customer.pppoeUsername}')">
                        <i class="bi bi-speedometer2"></i> Limit
                    </button>
                    <button class="btn btn-sm btn-info" onclick="showQoSModal('${customer.pppoeUsername}')">
                        <i class="bi bi-sliders"></i> QoS
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="showBoostModal('${customer.pppoeUsername}')">
                        <i class="bi bi-lightning-charge"></i> Boost
                    </button>
                </div>
            </td>
        `;
        
        elements.customerTableBody.appendChild(row);
    });
}

/**
 * Show bandwidth limit modal for a customer
 * @param {string} username - The PPPoE username of the customer
 */
function showBandwidthModal(username) {
    const customer = bandwidthData.customers.find(c => c.pppoeUsername === username);
    if (!customer) return;
    
    bandwidthData.selectedCustomer = customer;
    
    // Set form values
    const downloadInput = document.getElementById('downloadLimit');
    const uploadInput = document.getElementById('uploadLimit');
    
    if (downloadInput && uploadInput && customer.Package) {
        downloadInput.value = customer.Package.downloadSpeed;
        uploadInput.value = customer.Package.uploadSpeed;
    }
    
    // Update modal title
    const modalTitle = document.querySelector('#bandwidthModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Bandwidth Limit - ${customer.name} (${username})`;
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('bandwidthModal'));
    modal.show();
}

/**
 * Show QoS profile modal for a customer
 * @param {string} username - The PPPoE username of the customer
 */
function showQoSModal(username) {
    const customer = bandwidthData.customers.find(c => c.pppoeUsername === username);
    if (!customer) return;
    
    bandwidthData.selectedCustomer = customer;
    
    // Update modal title
    const modalTitle = document.querySelector('#qosModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = `QoS Profile - ${customer.name} (${username})`;
    }
    
    // Populate QoS profiles dropdown
    const qosSelect = document.getElementById('qosProfile');
    if (qosSelect) {
        qosSelect.innerHTML = '';
        bandwidthData.qosProfiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = profile.name;
            qosSelect.appendChild(option);
        });
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('qosModal'));
    modal.show();
}

/**
 * Show bandwidth boost modal for a customer
 * @param {string} username - The PPPoE username of the customer
 */
function showBoostModal(username) {
    const customer = bandwidthData.customers.find(c => c.pppoeUsername === username);
    if (!customer) return;
    
    bandwidthData.selectedCustomer = customer;
    
    // Set form values
    const downloadBoostInput = document.getElementById('downloadBoost');
    const uploadBoostInput = document.getElementById('uploadBoost');
    const durationInput = document.getElementById('boostDuration');
    
    if (downloadBoostInput && uploadBoostInput && durationInput) {
        downloadBoostInput.value = 5; // Default 5 Mbps boost
        uploadBoostInput.value = 2; // Default 2 Mbps boost
        durationInput.value = 60; // Default 60 minutes
    }
    
    // Update modal title
    const modalTitle = document.querySelector('#boostModal .modal-title');
    if (modalTitle) {
        modalTitle.textContent = `Bandwidth Boost - ${customer.name} (${username})`;
    }
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('boostModal'));
    modal.show();
}

/**
 * Update bandwidth limit for a customer
 */
async function updateBandwidthLimit() {
    try {
        if (!bandwidthData.selectedCustomer) return;
        
        const downloadLimit = document.getElementById('downloadLimit').value;
        const uploadLimit = document.getElementById('uploadLimit').value;
        
        if (!downloadLimit || !uploadLimit) {
            showToast('error', 'Download and upload limits are required');
            return;
        }
        
        showLoader('Updating bandwidth limit...');
        
        const response = await fetch(`/api/bandwidth/limit/${bandwidthData.selectedCustomer.pppoeUsername}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                downloadLimit: parseInt(downloadLimit),
                uploadLimit: parseInt(uploadLimit)
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('success', result.message);
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('bandwidthModal')).hide();
            // Refresh customer data
            await fetchCustomersWithBandwidth();
        } else {
            showToast('error', result.message || 'Failed to update bandwidth limit');
        }
        
        hideLoader();
    } catch (error) {
        console.error('Error updating bandwidth limit:', error);
        showToast('error', 'Failed to update bandwidth limit');
        hideLoader();
    }
}

/**
 * Update QoS profile for a customer
 */
async function updateQoSProfile() {
    try {
        if (!bandwidthData.selectedCustomer) return;
        
        const qosProfile = document.getElementById('qosProfile').value;
        
        if (!qosProfile) {
            showToast('error', 'QoS profile is required');
            return;
        }
        
        showLoader('Updating QoS profile...');
        
        const response = await fetch(`/api/bandwidth/qos/${bandwidthData.selectedCustomer.pppoeUsername}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                qosProfile
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('success', result.message);
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('qosModal')).hide();
        } else {
            showToast('error', result.message || 'Failed to update QoS profile');
        }
        
        hideLoader();
    } catch (error) {
        console.error('Error updating QoS profile:', error);
        showToast('error', '