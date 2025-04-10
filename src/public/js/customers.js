/**
 * ISP Management Customers JavaScript
 * This file handles all customer management functionality including data fetching,
 * customer listing, and customer operations for the ISP Management System.
 */

// Store for customers data
const customersData = {
    customers: [],
    packages: [],
    selectedCustomer: null,
    selectedPackage: null,
    filterOptions: {
        status: 'all',
        search: '',
        package: 'all'
    }
};

// DOM Elements
const elements = {
    customerTableBody: document.getElementById('customerTableBody'),
    customerSearch: document.getElementById('customerSearch'),
    statusFilter: document.getElementById('statusFilter'),
    packageFilter: document.getElementById('packageFilter'),
    addCustomerBtn: document.getElementById('addCustomerBtn'),
    customerModal: document.getElementById('customerModal'),
    customerForm: document.getElementById('customerForm'),
    customerDetails: document.getElementById('customerDetails'),
    packageModal: document.getElementById('addPackageModal'),
    packageForm: document.getElementById('packageForm'),
    savePackageBtn: document.getElementById('savePackageBtn'),
    importCustomersBtn: document.getElementById('importCustomersBtn'),
    importModal: document.getElementById('importCustomersModal'),
    importForm: document.getElementById('importForm'),
    startImportBtn: document.getElementById('startImportBtn'),
    importProgress: document.getElementById('importProgress'),
    importStatus: document.getElementById('importStatus')
};

/**
 * Initialize the customers tab
 */
async function initCustomers() {
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await fetchPackages();
    await fetchCustomers();
}

/**
 * Setup event listeners for customer interactions
 */
function setupEventListeners() {
    // Customer search
    elements.customerSearch?.addEventListener('input', (e) => {
        customersData.filterOptions.search = e.target.value;
        filterCustomers();
    });
    
    // Status filter
    elements.statusFilter?.addEventListener('change', (e) => {
        customersData.filterOptions.status = e.target.value;
        filterCustomers();
    });
    
    // Package filter
    elements.packageFilter?.addEventListener('change', (e) => {
        customersData.filterOptions.package = e.target.value;
        filterCustomers();
    });
    
    // Add customer button
    elements.addCustomerBtn?.addEventListener('click', () => {
        showCustomerModal();
    });
    
    // Customer form submission
    elements.customerForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveCustomer();
    });
    
    // Add package button (using data-bs-toggle and data-bs-target in HTML)
    document.querySelector('button[data-bs-target="#addPackageModal"]')?.addEventListener('click', () => {
        showPackageModal();
    });
    
    // Save package button
    elements.savePackageBtn?.addEventListener('click', () => {
        savePackage();
    });
    
    // Import customers button
    elements.importCustomersBtn?.addEventListener('click', () => {
        showImportModal();
    });
    
    // Start import button
    elements.startImportBtn?.addEventListener('click', () => {
        importCustomers();
    });
}

/**
 * Fetch customers from the API
 */
async function fetchCustomers() {
    try {
        const response = await axios.get('/api/customers');
        customersData.customers = response.data;
        renderCustomersTable();
    } catch (error) {
        console.error('Error fetching customers:', error);
        showErrorNotification('Failed to fetch customers');
    }
}

/**
 * Render the customers table with the current data
 */
function renderCustomersTable() {
    if (!elements.customerTableBody) return;
    
    // Clear the table body
    elements.customerTableBody.innerHTML = '';
    
    // Filter customers based on current filter options
    const filteredCustomers = filterCustomers();
    
    // Add each customer to the table
    filteredCustomers.forEach(customer => {
        const row = document.createElement('tr');
        
        // Determine status class
        let statusClass = 'badge bg-secondary';
        if (customer.status === 'active') {
            statusClass = 'badge bg-success';
        } else if (customer.status === 'inactive') {
            statusClass = 'badge bg-danger';
        } else if (customer.status === 'suspended') {
            statusClass = 'badge bg-warning text-dark';
        }
        
        // Create the row content
        row.innerHTML = `
            <td>${customer.id}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td><span class="${statusClass}">${customer.status}</span></td>
            <td>${customer.package?.name || 'No Package'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewCustomerDetails('${customer.id}')">View</button>
                    <button class="btn btn-outline-secondary" onclick="editCustomer('${customer.id}')">Edit</button>
                    <button class="btn btn-outline-danger" onclick="deleteCustomer('${customer.id}')">Delete</button>
                </div>
            </td>
        `;
        
        elements.customerTableBody.appendChild(row);
    });
}

/**
 * Filter customers based on current filter options
 */
function filterCustomers() {
    if (!customersData.customers.length) return [];
    
    return customersData.customers.filter(customer => {
        // Filter by status
        if (customersData.filterOptions.status !== 'all' && 
            customer.status !== customersData.filterOptions.status) {
            return false;
        }
        
        // Filter by package
        if (customersData.filterOptions.package !== 'all' && 
            customer.packageId != customersData.filterOptions.package) {
            return false;
        }
        
        // Filter by search term
        if (customersData.filterOptions.search) {
            const searchTerm = customersData.filterOptions.search.toLowerCase();
            return (
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.email.toLowerCase().includes(searchTerm) ||
                customer.phone.includes(searchTerm) ||
                (customer.pppoeUsername && customer.pppoeUsername.toLowerCase().includes(searchTerm))
            );
        }
        
        return true;
    });
}

/**
 * Show the customer modal for adding/editing a customer
 */
function showCustomerModal(customerId = null) {
    // Reset form
    elements.customerForm.reset();
    
    // Set modal title
    const modalTitle = document.querySelector('#customerModal .modal-title');
    
    if (customerId) {
        // Edit existing customer
        modalTitle.textContent = 'Edit Customer';
        const customer = customersData.customers.find(c => c.id === customerId);
        if (customer) {
            customersData.selectedCustomer = customer;
            // Populate form fields
            document.getElementById('customerName').value = customer.name;
            document.getElementById('customerEmail').value = customer.email;
            document.getElementById('customerPhone').value = customer.phone;
            document.getElementById('customerAddress').value = customer.address;
            document.getElementById('customerStatus').value = customer.status;
            document.getElementById('customerPackage').value = customer.packageId || '';
            document.getElementById('pppoeUsername').value = customer.pppoeUsername || '';
            document.getElementById('pppoePassword').value = customer.pppoePassword || '';
        }
    } else {
        // Add new customer
        modalTitle.textContent = 'Add New Customer';
        customersData.selectedCustomer = null;
    }
    
    // Show modal
    const modal = new bootstrap.Modal(elements.customerModal);
    modal.show();
}

/**
 * Save customer (create or update)
 */
async function saveCustomer() {
    try {
        const customerData = {
            name: document.getElementById('customerName').value,
            email: document.getElementById('customerEmail').value,
            phone: document.getElementById('customerPhone').value,
            address: document.getElementById('customerAddress').value,
            status: document.getElementById('customerStatus').value,
            packageId: document.getElementById('customerPackage').value,
            pppoeUsername: document.getElementById('pppoeUsername').value,
            pppoePassword: document.getElementById('pppoePassword').value
        };
        
        let response;
        
        if (customersData.selectedCustomer) {
            // Update existing customer
            response = await axios.put(`/api/customers/${customersData.selectedCustomer.id}`, customerData);
            showSuccessNotification('Customer updated successfully');
        } else {
            // Create new customer
            response = await axios.post('/api/customers', customerData);
            showSuccessNotification('Customer created successfully');
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(elements.customerModal);
        modal.hide();
        
        // Refresh customers list
        await fetchCustomers();
        
    } catch (error) {
        console.error('Error saving customer:', error);
        showErrorNotification('Failed to save customer');
    }
}

/**
 * View customer details
 */
async function viewCustomerDetails(customerId) {
    try {
        const response = await axios.get(`/api/customers/${customerId}`);
        const customer = response.data;
        
        // Populate customer details view
        elements.customerDetails.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Customer Details</h5>
                    <button class="btn btn-sm btn-outline-primary" onclick="editCustomer('${customer.id}')">Edit</button>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <h6>Personal Information</h6>
                            <p><strong>Name:</strong> ${customer.name}</p>
                            <p><strong>Email:</strong> ${customer.email}</p>
                            <p><strong>Phone:</strong> ${customer.phone}</p>
                            <p><strong>Address:</strong> ${customer.address}</p>
                            <p><strong>Status:</strong> <span class="badge ${customer.status === 'active' ? 'bg-success' : customer.status === 'inactive' ? 'bg-danger' : 'bg-warning text-dark'}">${customer.status}</span></p>
                        </div>
                        <div class="col-md-6">
                            <h6>Service Information</h6>
                            <p><strong>Package:</strong> ${customer.package?.name || 'No Package'}</p>
                            <p><strong>Speed:</strong> ${customer.package?.downloadSpeed || 'N/A'} Mbps / ${customer.package?.uploadSpeed || 'N/A'} Mbps</p>
                            <p><strong>Monthly Fee:</strong> ${customer.package?.price ? `$${customer.package.price}` : 'N/A'}</p>
                            <p><strong>PPPoE Username:</strong> ${customer.pppoeUsername || 'N/A'}</p>
                            <p><strong>Connection Status:</strong> <span class="status-indicator ${customer.connectionStatus === 'online' ? 'status-good' : customer.connectionStatus === 'offline' ? 'status-critical' : 'status-unknown'}"></span> ${customer.connectionStatus || 'Unknown'}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <h6>Recent Invoices</h6>
                            <div class="table-responsive">
                                <table class="table table-sm table-hover">
                                    <thead>
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="customerInvoicesBody">
                                        <!-- Invoices will be loaded here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Load customer invoices
        loadCustomerInvoices(customerId);
        
    } catch (error) {
        console.error('Error fetching customer details:', error);
        showErrorNotification('Failed to fetch customer details');
    }
}

/**
 * Load customer invoices
 */
async function loadCustomerInvoices(customerId) {
    try {
        const response = await axios.get(`/api/invoices/customer/${customerId}`);
        const invoices = response.data;
        
        const invoicesBody = document.getElementById('customerInvoicesBody');
        invoicesBody.innerHTML = '';
        
        if (invoices.length === 0) {
            invoicesBody.innerHTML = '<tr><td colspan="5" class="text-center">No invoices found</td></tr>';
            return;
        }
        
        invoices.forEach(invoice => {
            // Determine status class
            let statusClass = 'badge bg-secondary';
            if (invoice.status === 'paid') {
                statusClass = 'badge bg-success';
            } else if (invoice.status === 'unpaid') {
                statusClass = 'badge bg-danger';
            } else if (invoice.status === 'overdue') {
                statusClass = 'badge bg-warning text-dark';
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${invoice.invoiceNumber}</td>
                <td>${new Date(invoice.createdAt).toLocaleDateString()}</td>
                <td>$${invoice.amount.toFixed(2)}</td>
                <td><span class="${statusClass}">${invoice.status}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="viewInvoice('${invoice.id}')">View</button>
                        <button class="btn btn-outline-success" onclick="recordPayment('${invoice.id}')">Record Payment</button>
                    </div>
                </td>
            `;
            
            invoicesBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading customer invoices:', error);
        showErrorNotification('Failed to load customer invoices');
    }
}

/**
 * Edit a customer
 */
function editCustomer(customerId) {
    showCustomerModal(customerId);
}

/**
 * Delete a customer
 */
async function deleteCustomer(customerId) {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        try {
            await axios.delete(`/api/customers/${customerId}`);
            showSuccessNotification('Customer deleted successfully');
            await fetchCustomers();
        } catch (error) {
            console.error('Error deleting customer:', error);
            showErrorNotification('Failed to delete customer');
        }
    }
}

/**
 * View invoice details
 */
function viewInvoice(invoiceId) {
    // Redirect to invoice details page or show modal
    window.location.href = `/billing?invoice=${invoiceId}`;
}

/**
 * Record payment for an invoice
 */
function recordPayment(invoiceId) {
    // Redirect to payment page or show modal
    window.location.href = `/billing?invoice=${invoiceId}&action=pay`;
}

/**
 * Fetch packages from the API
 */
async function fetchPackages() {
    try {
        const response = await axios.get('/api/packages');
        customersData.packages = response.data;
        populatePackageDropdowns();
        renderPackagesTable(); // Render packages table after fetching
    } catch (error) {
        console.error('Error fetching packages:', error);
        showErrorNotification('Failed to fetch packages');
    }
}

/**
 * Populate package dropdowns with fetched packages
 */
function populatePackageDropdowns() {
    // Populate package filter dropdown
    const packageFilter = document.getElementById('packageFilter');
    if (packageFilter) {
        // Clear existing options except the first one
        while (packageFilter.options.length > 1) {
            packageFilter.remove(1);
        }
        
        // Add package options
        customersData.packages.forEach(pkg => {
            const option = document.createElement('option');
            option.value = pkg.id;
            option.textContent = pkg.name;
            packageFilter.appendChild(option);
        });
    }
    
    // Populate customer package dropdown
    const customerPackage = document.getElementById('customerPackage');
    if (customerPackage) {
        // Clear existing options
        customerPackage.innerHTML = '';
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Select a package';
        customerPackage.appendChild(emptyOption);
        
        // Add package options
        customersData.packages.forEach(pkg => {
            const option = document.createElement('option');
            option.value = pkg.id;
            option.textContent = `${pkg.name} (${pkg.downloadSpeed}/${pkg.uploadSpeed} ${pkg.speedUnit} - $${pkg.price})`;
            customerPackage.appendChild(option);
        });
    }
}

/**
 * Save package (create or update)
 */
async function savePackage() {
    try {
        // Validate required fields
        const packageName = document.getElementById('packageName').value.trim();
        const downloadSpeed = document.getElementById('downloadSpeed').value.trim();
        const uploadSpeed = document.getElementById('uploadSpeed').value.trim();
        const packagePrice = document.getElementById('packagePrice').value.trim();
        
        if (!packageName || !downloadSpeed || !uploadSpeed || !packagePrice) {
            showErrorNotification('Please fill in all required fields');
            return;
        }
        
        // Get features from textarea and convert to array
        const featuresText = document.getElementById('packageFeatures').value;
        const featuresArray = featuresText.split('\n')
            .map(feature => feature.trim())
            .filter(feature => feature.length > 0);
            
        const packageData = {
            name: packageName,
            downloadSpeed: parseInt(downloadSpeed),
            uploadSpeed: parseInt(uploadSpeed),
            speedUnit: document.getElementById('speedUnit').value,
            price: parseFloat(packagePrice),
            description: document.getElementById('packageDescription').value.trim() || null,
            features: featuresArray,
            isActive: document.getElementById('packageActive').checked
        };
        
        console.log('Sending package data:', packageData);
        
        let response;
        let url;
        
        try {
            if (customersData.selectedPackage) {
                // Update existing package
                url = `/api/packages/${customersData.selectedPackage.id}`;
                console.log('Updating package at URL:', url);
                response = await axios.put(url, packageData);
                showSuccessNotification('Package updated successfully');
            } else {
                // Create new package
                url = '/api/packages';
                console.log('Creating package at URL:', url);
                response = await axios.post(url, packageData);
                showSuccessNotification('Package created successfully');
            }
            
            console.log('Server response:', response.data);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(elements.packageModal);
            modal.hide();
            
            // Refresh packages list
            await fetchPackages();
        } catch (axiosError) {
            console.error('Axios error:', axiosError);
            console.error('Request details:', {
                url: url,
                method: customersData.selectedPackage ? 'PUT' : 'POST',
                data: packageData
            });
            
            if (axiosError.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('Response data:', axiosError.response.data);
                console.error('Response status:', axiosError.response.status);
                console.error('Response headers:', axiosError.response.headers);
                showErrorNotification(`Failed to save package: ${axiosError.response.data.message || 'Server error'}`);
            } else if (axiosError.request) {
                // The request was made but no response was received
                console.error('No response received:', axiosError.request);
                showErrorNotification('Failed to save package: No response from server');
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error('Error message:', axiosError.message);
                showErrorNotification(`Failed to save package: ${axiosError.message}`);
            }
            throw axiosError; // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error('Error saving package:', error);
        showErrorNotification('Failed to save package');
    }
}

/**
 * Show the import modal
 */
function showImportModal() {
    // Reset form
    elements.importForm.reset();
    elements.importProgress.classList.add('d-none');
    elements.importStatus.innerHTML = '';
    
    // Show modal
    const modal = new bootstrap.Modal(elements.importModal);
    modal.show();
}

/**
 * Import customers from file
 */
async function importCustomers() {
    try {
        const fileInput = document.getElementById('importFile');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            showErrorNotification('Please select a file to import');
            return;
        }
        
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);
        
        // Show progress
        elements.importProgress.classList.remove('d-none');
        elements.importStatus.innerHTML = '<div class="alert alert-info">Importing customers, please wait...</div>';
        
        // Disable import button
        elements.startImportBtn.disabled = true;
        
        // Send request
        const response = await axios.post('/api/import/customers', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        // Update progress
        elements.importStatus.innerHTML = `
            <div class="alert alert-success">
                <h6>Import Completed</h6>
                <p>Successfully imported ${response.data.imported} customers.</p>
                ${response.data.errors.length > 0 ? 
                    `<p>Failed to import ${response.data.errors.length} customers due to errors.</p>` : ''}
            </div>
        `;
        
        // Re-enable import button
        elements.startImportBtn.disabled = false;
        
        // Refresh customers list
        await fetchCustomers();
        
    } catch (error) {
        console.error('Error importing customers:', error);
        elements.importStatus.innerHTML = `
            <div class="alert alert-danger">
                <h6>Import Failed</h6>
                <p>${error.response?.data?.message || error.message}</p>
            </div>
        `;
        elements.startImportBtn.disabled = false;
    }
}

/**
 * Render packages table
 */
function renderPackagesTable() {
    const packagesTableBody = document.getElementById('packagesTableBody');
    if (!packagesTableBody) return;
    
    // Clear the table body
    packagesTableBody.innerHTML = '';
    
    // Add each package to the table
    customersData.packages.forEach(pkg => {
        const row = document.createElement('tr');
        
        // Format features as a comma-separated list or display 'None'
        const featuresDisplay = pkg.features && pkg.features.length > 0 
            ? pkg.features.slice(0, 2).join(', ') + (pkg.features.length > 2 ? '...' : '')
            : 'None';
        
        // Create the row content
        row.innerHTML = `
            <td>${pkg.id}</td>
            <td>${pkg.name}</td>
            <td>${pkg.downloadSpeed}/${pkg.uploadSpeed} ${pkg.speedUnit}</td>
            <td>$${pkg.price}</td>
            <td>${featuresDisplay}</td>
            <td><span class="badge ${pkg.isActive ? 'bg-success' : 'bg-danger'}">${pkg.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-secondary" onclick="editPackage('${pkg.id}')">Edit</button>
                    <button class="btn btn-outline-danger" onclick="deletePackage('${pkg.id}')">Delete</button>
                </div>
            </td>
        `;
        
        packagesTableBody.appendChild(row);
    });
}

/**
 * Delete a package
 */
async function deletePackage(packageId) {
    if (confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
        try {
            await axios.delete(`/api/packages/${packageId}`);
            showSuccessNotification('Package deleted successfully');
            await fetchPackages();
        } catch (error) {
            console.error('Error deleting package:', error);
            showErrorNotification('Failed to delete package');
        }
    }
}

/**
 * Show a success notification
 */
function showSuccessNotification(message) {
    // Implement success notification
    console.log(message);
    // This could use a toast notification library
}

/**
 * Edit a package
 */
function editPackage(packageId) {
    showPackageModal(packageId);
}

/**
 * Show the package modal for adding/editing a package
 */
function showPackageModal(packageId = null) {
    // Reset form
    elements.packageForm.reset();
    
    // Set modal title
    const modalTitle = document.querySelector('#addPackageModal .modal-title');
    
    if (packageId) {
        // Edit existing package
        modalTitle.textContent = 'Edit Package';
        const pkg = customersData.packages.find(p => p.id === packageId);
        if (pkg) {
            customersData.selectedPackage = pkg;
            // Populate form fields
            document.getElementById('packageName').value = pkg.name;
            document.getElementById('downloadSpeed').value = pkg.downloadSpeed;
            document.getElementById('uploadSpeed').value = pkg.uploadSpeed;
            document.getElementById('speedUnit').value = pkg.speedUnit;
            document.getElementById('packagePrice').value = pkg.price;
            document.getElementById('packageDescription').value = pkg.description || '';
            
            // Populate features field
            const featuresTextarea = document.getElementById('packageFeatures');
            if (featuresTextarea && pkg.features && Array.isArray(pkg.features)) {
                featuresTextarea.value = pkg.features.join('\n');
            }
            
            document.getElementById('packageActive').checked = pkg.isActive;
        }
    } else {
        // Add new package
        modalTitle.textContent = 'Add New Package';
        customersData.selectedPackage = null;
    }
    
    // Show modal
    const modal = new bootstrap.Modal(elements.packageModal);
    modal.show();
}

/**
 * Show an error notification
 */