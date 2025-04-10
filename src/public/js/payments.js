/**
 * ISP Management Payments JavaScript
 * This file handles all payment functionality including listing, filtering,
 * and processing payments for the ISP Management System.
 */

// Store for payment data
const paymentData = {
    payments: [],
    invoices: [],
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 1,
    filterOptions: {
        method: 'all',
        dateRange: 'all',
        status: 'all',
        search: ''
    }
};

// DOM Elements
const elements = {
    paymentTableBody: document.getElementById('paymentTableBody'),
    paymentSearch: document.getElementById('paymentSearch'),
    methodFilter: document.getElementById('methodFilter'),
    dateRangeFilter: document.getElementById('dateRangeFilter'),
    statusFilter: document.getElementById('statusFilter'),
    refreshPaymentsBtn: document.getElementById('refreshPaymentsBtn'),
    exportPaymentsBtn: document.getElementById('exportPaymentsBtn'),
    paymentPagination: document.getElementById('paymentPagination'),
    currentShowing: document.getElementById('currentShowing'),
    totalPayments: document.getElementById('totalPayments'),
    addPaymentForm: document.getElementById('addPaymentForm'),
    paymentInvoice: document.getElementById('paymentInvoice'),
    paymentAmount: document.getElementById('paymentAmount'),
    paymentMethod: document.getElementById('paymentMethod'),
    paymentDate: document.getElementById('paymentDate'),
    receiptNumber: document.getElementById('receiptNumber'),
    paymentStatus: document.getElementById('paymentStatus'),
    paymentNotes: document.getElementById('paymentNotes'),
    savePaymentBtn: document.getElementById('savePaymentBtn'),
    paymentDetails: document.getElementById('paymentDetails'),
    printReceiptBtn: document.getElementById('printReceiptBtn')
};

/**
 * Initialize the payments page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set default payment date to today
    if (elements.paymentDate) {
        const today = new Date().toISOString().split('T')[0];
        elements.paymentDate.value = today;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    fetchPayments();
    fetchUnpaidInvoices();
});

/**
 * Setup event listeners for payment interactions
 */
function setupEventListeners() {
    // Payment search
    elements.paymentSearch?.addEventListener('input', (e) => {
        paymentData.filterOptions.search = e.target.value;
        filterPayments();
    });
    
    // Method filter
    elements.methodFilter?.addEventListener('change', (e) => {
        paymentData.filterOptions.method = e.target.value;
        filterPayments();
    });
    
    // Date range filter
    elements.dateRangeFilter?.addEventListener('change', (e) => {
        paymentData.filterOptions.dateRange = e.target.value;
        filterPayments();
    });
    
    // Status filter
    elements.statusFilter?.addEventListener('change', (e) => {
        paymentData.filterOptions.status = e.target.value;
        filterPayments();
    });
    
    // Refresh payments button
    elements.refreshPaymentsBtn?.addEventListener('click', () => {
        fetchPayments();
    });
    
    // Export payments button
    elements.exportPaymentsBtn?.addEventListener('click', () => {
        exportPaymentsToCSV();
    });
    
    // Save payment button
    elements.savePaymentBtn?.addEventListener('click', () => {
        savePayment();
    });
    
    // Print receipt button
    elements.printReceiptBtn?.addEventListener('click', () => {
        printReceipt();
    });
    
    // Invoice selection change - update amount
    elements.paymentInvoice?.addEventListener('change', (e) => {
        updatePaymentAmount(e.target.value);
    });
}

/**
 * Fetch all payments from the API
 */
async function fetchPayments() {
    try {
        const response = await fetch('/api/billing/payments');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        paymentData.payments = data;
        
        // Update UI
        updatePaymentTable();
        updatePagination();
        
    } catch (error) {
        console.error('Error fetching payments:', error);
        showAlert('error', 'Failed to load payments. ' + error.message);
    }
}

/**
 * Fetch unpaid invoices for payment creation
 */
async function fetchUnpaidInvoices() {
    if (!elements.paymentInvoice) return;
    
    try {
        const response = await fetch('/api/billing/invoices?status=unpaid');
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        paymentData.invoices = data;
        
        // Populate invoice dropdown
        elements.paymentInvoice.innerHTML = '<option value="">Select Invoice</option>';
        
        data.forEach(invoice => {
            const option = document.createElement('option');
            option.value = invoice.id;
            option.textContent = `INV-${invoice.invoiceNumber} - ${invoice.Customer.name} - $${invoice.totalAmount}`;
            option.dataset.amount = invoice.totalAmount;
            elements.paymentInvoice.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error fetching unpaid invoices:', error);
        showAlert('error', 'Failed to load invoices. ' + error.message);
    }
}

/**
 * Update payment amount based on selected invoice
 */
function updatePaymentAmount(invoiceId) {
    if (!elements.paymentAmount || !invoiceId) return;
    
    const selectedOption = Array.from(elements.paymentInvoice.options)
        .find(option => option.value === invoiceId);
    
    if (selectedOption && selectedOption.dataset.amount) {
        elements.paymentAmount.value = selectedOption.dataset.amount;
    } else {
        elements.paymentAmount.value = '';
    }
}

/**
 * Filter payments based on current filter options
 */
function filterPayments() {
    const { method, dateRange, status, search } = paymentData.filterOptions;
    
    const filtered = paymentData.payments.filter(payment => {
        // Method filter
        if (method !== 'all' && payment.paymentMethod !== method) {
            return false;
        }
        
        // Status filter
        if (status !== 'all' && payment.status !== status) {
            return false;
        }
        
        // Date range filter
        if (dateRange !== 'all') {
            const paymentDate = new Date(payment.paymentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            const thisWeekStart = new Date(today);
            thisWeekStart.setDate(today.getDate() - today.getDay());
            
            const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            
            const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            
            switch (dateRange) {
                case 'today':
                    if (paymentDate < today) return false;
                    break;
                case 'this_week':
                    if (paymentDate < thisWeekStart) return false;
                    break;
                case 'this_month':
                    if (paymentDate < thisMonthStart) return false;
                    break;
                case 'last_month':
                    if (paymentDate < lastMonthStart || paymentDate > lastMonthEnd) return false;
                    break;
                // Custom range would require additional UI for date selection
            }
        }
        
        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            const customerName = payment.Invoice?.Customer?.name?.toLowerCase() || '';
            const invoiceNumber = payment.Invoice?.invoiceNumber?.toLowerCase() || '';
            const receiptNumber = payment.receiptNumber?.toLowerCase() || '';
            
            return customerName.includes(searchLower) || 
                   invoiceNumber.includes(searchLower) || 
                   receiptNumber.includes(searchLower) || 
                   payment.id.toString().includes(searchLower);
        }
        
        return true;
    });
    
    // Update pagination with filtered results
    paymentData.filteredPayments = filtered;
    paymentData.currentPage = 1;
    paymentData.totalPages = Math.ceil(filtered.length / paymentData.itemsPerPage);
    
    // Update UI
    updatePaymentTable();
    updatePagination();
}

/**
 * Update the payment table with current data
 */
function updatePaymentTable() {
    if (!elements.paymentTableBody) return;
    
    const payments = paymentData.filteredPayments || paymentData.payments;
    const start = (paymentData.currentPage - 1) * paymentData.itemsPerPage;
    const end = start + paymentData.itemsPerPage;
    const paginatedPayments = payments.slice(start, end);
    
    elements.paymentTableBody.innerHTML = '';
    
    if (paginatedPayments.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" class="text-center">No payments found</td>`;
        elements.paymentTableBody.appendChild(row);
    } else {
        paginatedPayments.forEach(payment => {
            const row = document.createElement('tr');
            
            // Format date
            const paymentDate = new Date(payment.paymentDate);
            const formattedDate = paymentDate.toLocaleDateString() + ' ' + 
                                 paymentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Format status badge
            let statusBadge = '';
            switch (payment.status) {
                case 'completed':
                    statusBadge = '<span class="badge bg-success">Completed</span>';
                    break;
                case 'pending':
                    statusBadge = '<span class="badge bg-warning">Pending</span>';
                    break;
                case 'failed':
                    statusBadge = '<span class="badge bg-danger">Failed</span>';
                    break;
                default:
                    statusBadge = `<span class="badge bg-secondary">${payment.status}</span>`;
            }
            
            // Format payment method
            let methodDisplay = payment.paymentMethod;
            switch (payment.paymentMethod) {
                case 'cash':
                    methodDisplay = 'Cash';
                    break;
                case 'bank_transfer':
                    methodDisplay = 'Bank Transfer';
                    break;
                case 'credit_card':
                    methodDisplay = 'Credit Card';
                    break;
                case 'e_wallet':
                    methodDisplay = 'E-Wallet';
                    break;
            }
            
            row.innerHTML = `
                <td>${payment.id}</td>
                <td>${payment.Invoice ? 'INV-' + payment.Invoice.invoiceNumber : 'N/A'}</td>
                <td>${payment.Invoice?.Customer ? payment.Invoice.Customer.name : 'N/A'}</td>
                <td>$${payment.amount.toFixed(2)}</td>
                <td>${methodDisplay}</td>
                <td>${formattedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-payment" data-id="${payment.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary print-receipt" data-id="${payment.id}">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            `;
            
            elements.paymentTableBody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        document.querySelectorAll('.view-payment').forEach(btn => {
            btn.addEventListener('click', () => viewPaymentDetails(btn.dataset.id));
        });
        
        document.querySelectorAll('.print-receipt').forEach(btn => {
            btn.addEventListener('click', () => printReceiptForPayment(btn.dataset.id));
        });
    }
    
    // Update counters
    if (elements.currentShowing) {
        elements.currentShowing.textContent = payments.length > 0 ? 
            `${start + 1}-${Math.min(end, payments.length)}` : '0';
    }
    
    if (elements.totalPayments) {
        elements.totalPayments.textContent = payments.length;
    }
}

/**
 * Update pagination controls
 */
function updatePagination() {
    if (!elements.paymentPagination) return;
    
    const paginationElement = elements.paymentPagination.querySelector('ul.pagination');
    if (!paginationElement) return;
    
    const totalPages = paymentData.totalPages;
    const currentPage = paymentData.currentPage;
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;
    
    // Page numbers
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i