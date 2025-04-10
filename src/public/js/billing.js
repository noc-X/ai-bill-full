/**
 * ISP Management Billing JavaScript
 * This file handles all billing functionality including invoices, payments,
 * and financial operations for the ISP Management System.
 */

// Store for billing data
const billingData = {
    invoices: [],
    payments: [],
    selectedInvoice: null,
    filterOptions: {
        status: 'all',
        dateRange: 'all',
        search: ''
    }
};

// DOM Elements
const elements = {
    invoiceTableBody: document.getElementById('invoiceTableBody'),
    paymentTableBody: document.getElementById('paymentTableBody'),
    invoiceSearch: document.getElementById('invoiceSearch'),
    statusFilter: document.getElementById('statusFilter'),
    dateRangeFilter: document.getElementById('dateRangeFilter'),
    generateInvoiceBtn: document.getElementById('generateInvoiceBtn'),
    invoiceModal: document.getElementById('invoiceModal'),
    invoiceForm: document.getElementById('invoiceForm'),
    paymentModal: document.getElementById('paymentModal'),
    paymentForm: document.getElementById('paymentForm'),
    invoiceDetails: document.getElementById('invoiceDetails')
};

/**
 * Initialize the billing tab
 */
async function initBilling() {
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await Promise.all([
        fetchInvoices(),
        fetchPayments()
    ]);
    
    // Check if there's an invoice parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('invoice');
    const action = urlParams.get('action');
    
    if (invoiceId) {
        // Show invoice details
        await viewInvoiceDetails(invoiceId);
        
        // If action is pay, show payment modal
        if (action === 'pay') {
            showPaymentModal(invoiceId);
        }
    }
}

/**
 * Setup event listeners for billing interactions
 */
function setupEventListeners() {
    // Invoice search
    elements.invoiceSearch?.addEventListener('input', (e) => {
        billingData.filterOptions.search = e.target.value;
        filterInvoices();
    });
    
    // Status filter
    elements.statusFilter?.addEventListener('change', (e) => {
        billingData.filterOptions.status = e.target.value;
        filterInvoices();
    });
    
    // Date range filter
    elements.dateRangeFilter?.addEventListener('change', (e) => {
        billingData.filterOptions.dateRange = e.target.value;
        filterInvoices();
    });
    
    // Generate invoice button
    elements.generateInvoiceBtn?.addEventListener('click', () => {
        showInvoiceModal();
    });
    
    // Invoice form submission
    elements.invoiceForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        generateInvoice();
    });
    
    // Payment form submission
    elements.paymentForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        recordPayment();
    });
}

/**
 * Fetch invoices from the API
 */
async function fetchInvoices() {
    try {
        const response = await axios.get('/api/billing/invoices');
        billingData.invoices = response.data;
        renderInvoicesTable();
    } catch (error) {
        console.error('Error fetching invoices:', error);
        showErrorNotification('Failed to fetch invoices');
    }
}

/**
 * Fetch payments from the API
 */
async function fetchPayments() {
    try {
        const response = await axios.get('/api/billing/payments');
        billingData.payments = response.data;
        renderPaymentsTable();
    } catch (error) {
        console.error('Error fetching payments:', error);
        showErrorNotification('Failed to fetch payments');
    }
}

/**
 * Render the invoices table with the current data
 */
function renderInvoicesTable() {
    if (!elements.invoiceTableBody) return;
    
    // Clear the table body
    elements.invoiceTableBody.innerHTML = '';
    
    // Filter invoices based on current filter options
    const filteredInvoices = filterInvoices();
    
    // Add each invoice to the table
    filteredInvoices.forEach(invoice => {
        const row = document.createElement('tr');
        
        // Determine status class
        let statusClass = 'badge bg-secondary';
        if (invoice.status === 'paid') {
            statusClass = 'badge bg-success';
        } else if (invoice.status === 'unpaid') {
            statusClass = 'badge bg-danger';
        } else if (invoice.status === 'overdue') {
            statusClass = 'badge bg-warning text-dark';
        }
        
        // Format the date
        const invoiceDate = new Date(invoice.createdAt);
        const formattedDate = invoiceDate.toLocaleDateString();
        
        // Format the due date
        const dueDate = new Date(invoice.dueDate);
        const formattedDueDate = dueDate.toLocaleDateString();
        
        // Create the row content
        row.innerHTML = `
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.customer?.name || 'Unknown'}</td>
            <td>${formattedDate}</td>
            <td>${formattedDueDate}</td>
            <td>$${invoice.amount.toFixed(2)}</td>
            <td><span class="${statusClass}">${invoice.status}</span></td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewInvoiceDetails('${invoice.id}')">View</button>
                    ${invoice.status !== 'paid' ? `<button class="btn btn-outline-success" onclick="showPaymentModal('${invoice.id}')">Record Payment</button>` : ''}
                    <button class="btn btn-outline-secondary" onclick="sendInvoiceReminder('${invoice.id}')">Send Reminder</button>
                </div>
            </td>
        `;
        
        elements.invoiceTableBody.appendChild(row);
    });
}

/**
 * Render the payments table with the current data
 */
function renderPaymentsTable() {
    if (!elements.paymentTableBody) return;
    
    // Clear the table body
    elements.paymentTableBody.innerHTML = '';
    
    // Add each payment to the table
    billingData.payments.forEach(payment => {
        const row = document.createElement('tr');
        
        // Format the date
        const paymentDate = new Date(payment.paymentDate);
        const formattedDate = paymentDate.toLocaleDateString();
        
        // Create the row content
        row.innerHTML = `
            <td>${payment.receiptNumber}</td>
            <td>${payment.invoice?.customer?.name || 'Unknown'}</td>
            <td>${payment.invoice?.invoiceNumber || 'Unknown'}</td>
            <td>${formattedDate}</td>
            <td>$${payment.amount.toFixed(2)}</td>
            <td>${payment.paymentMethod}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewPaymentDetails('${payment.id}')">View</button>
                    <button class="btn btn-outline-secondary" onclick="printReceipt('${payment.id}')">Print Receipt</button>
                </div>
            </td>
        `;
        
        elements.paymentTableBody.appendChild(row);
    });
}

/**
 * Filter invoices based on current filter options
 */
function filterInvoices() {
    if (!billingData.invoices.length) return [];
    
    return billingData.invoices.filter(invoice => {
        // Filter by status
        if (billingData.filterOptions.status !== 'all' && 
            invoice.status !== billingData.filterOptions.status) {
            return false;
        }
        
        // Filter by date range
        if (billingData.filterOptions.dateRange !== 'all') {
            const invoiceDate = new Date(invoice.createdAt);
            const today = new Date();
            
            if (billingData.filterOptions.dateRange === 'thisMonth') {
                // This month
                if (invoiceDate.getMonth() !== today.getMonth() || 
                    invoiceDate.getFullYear() !== today.getFullYear()) {
                    return false;
                }
            } else if (billingData.filterOptions.dateRange === 'lastMonth') {
                // Last month
                const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
                const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
                
                if (invoiceDate.getMonth() !== lastMonth || 
                    invoiceDate.getFullYear() !== lastMonthYear) {
                    return false;
                }
            } else if (billingData.filterOptions.dateRange === 'thisYear') {
                // This year
                if (invoiceDate.getFullYear() !== today.getFullYear()) {
                    return false;
                }
            }
        }
        
        // Filter by search term
        if (billingData.filterOptions.search) {
            const searchTerm = billingData.filterOptions.search.toLowerCase();
            return (
                (invoice.invoiceNumber && invoice.invoiceNumber.toLowerCase().includes(searchTerm)) ||
                (invoice.customer?.name && invoice.customer.name.toLowerCase().includes(searchTerm)) ||
                (invoice.customer?.email && invoice.customer.email.toLowerCase().includes(searchTerm))
            );
        }
        
        return true;
    });
}

/**
 * Show the invoice modal for generating a new invoice
 */
function showInvoiceModal() {
    // Reset form
    elements.invoiceForm.reset();
    
    // Set modal title
    const modalTitle = document.querySelector('#invoiceModal .modal-title');
    modalTitle.textContent = 'Generate New Invoice';
    
    // Show modal
    const modal = new bootstrap.Modal(elements.invoiceModal);
    modal.show();
    
    // Load customers for the dropdown
    loadCustomersDropdown();
}

/**
 * Load customers for the dropdown
 */
async function loadCustomersDropdown() {
    try {
        const response = await axios.get('/api/customers');
        const customers = response.data;
        
        const customerSelect = document.getElementById('invoiceCustomer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>';
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            customerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading customers:', error);
        showErrorNotification('Failed to load customers');
    }
}

/**
 * Generate a new invoice
 */
async function generateInvoice() {
    try {
        const invoiceData = {
            customerId: document.getElementById('invoiceCustomer').value,
            amount: parseFloat(document.getElementById('invoiceAmount').value),
            dueDate: document.getElementById('invoiceDueDate').value,
            description: document.getElementById('invoiceDescription').value
        };
        
        const response = await axios.post('/api/invoices', invoiceData);
        showSuccessNotification('Invoice generated successfully');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(elements.invoiceModal);
        modal.hide();
        
        // Refresh invoices list
        await fetchInvoices();
        
    } catch (error) {
        console.error('Error generating invoice:', error);
        showErrorNotification('Failed to generate invoice');
    }
}

/**
 * Show the payment modal for recording a payment
 */
function showPaymentModal(invoiceId) {
    // Reset form
    elements.paymentForm.reset();
    
    // Set modal title
    const modalTitle = document.querySelector('#paymentModal .modal-title');
    modalTitle.textContent = 'Record Payment';
    
    // Find the invoice
    const invoice = billingData.invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        billingData.selectedInvoice = invoice;
        
        // Populate form fields
        document.getElementById('paymentInvoice').value = invoice.invoiceNumber;
        document.getElementById('paymentCustomer').value = invoice.customer?.name || 'Unknown';
        document.getElementById('paymentAmount').value = invoice.amount.toFixed(2);
        document.getElementById('paymentDate').valueAsDate = new Date();
    }
    
    // Show modal
    const modal = new bootstrap.Modal(elements.paymentModal);
    modal.show();
}

/**
 * Record a payment
 */
async function recordPayment() {
    try {
        const paymentData = {
            invoiceId: billingData.selectedInvoice.id,
            amount: parseFloat(document.getElementById('paymentAmount').value),
            paymentMethod: document.getElementById('paymentMethod').value,
            paymentDate: document.getElementById('paymentDate').value,
            notes: document.getElementById('paymentNotes').value
        };
        
        const response = await axios.post('/api/payments', paymentData);
        showSuccessNotification('Payment recorded successfully');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(elements.paymentModal);
        modal.hide();
        
        // Refresh data
        await Promise.all([
            fetchInvoices(),
            fetchPayments()
        ]);
        
    } catch (error) {
        console.error('Error recording payment:', error);
        showErrorNotification('Failed to record payment');
    }
}

/**
 * View invoice details
 */
async function viewInvoiceDetails(invoiceId) {
    try {
        const response = await axios.get(`/api/invoices/${invoiceId}`);
        const invoice = response.data;
        
        // Determine status class
        let statusClass = 'badge bg-secondary';
        if (invoice.status === 'paid') {
            statusClass = 'badge bg-success