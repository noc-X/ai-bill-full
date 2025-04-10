/**
 * ISP Management Tickets JavaScript
 * This file handles all ticket functionality including ticket creation, management,
 * and resolution for the ISP Management System.
 */

// Store for tickets data
const ticketsData = {
    tickets: [],
    selectedTicket: null,
    filterOptions: {
        status: 'all',
        priority: 'all',
        search: ''
    }
};

// DOM Elements
const elements = {
    ticketTableBody: document.getElementById('ticketTableBody'),
    ticketSearch: document.getElementById('ticketSearch'),
    statusFilter: document.getElementById('statusFilter'),
    priorityFilter: document.getElementById('priorityFilter'),
    addTicketBtn: document.getElementById('addTicketBtn'),
    ticketModal: document.getElementById('ticketModal'),
    ticketForm: document.getElementById('ticketForm'),
    ticketDetails: document.getElementById('ticketDetails'),
    ticketComments: document.getElementById('ticketComments'),
    commentForm: document.getElementById('commentForm')
};

/**
 * Initialize the tickets tab
 */
async function initTickets() {
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    await fetchTickets();
    
    // Check if there's a ticket parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('ticket');
    
    if (ticketId) {
        // Show ticket details
        await viewTicketDetails(ticketId);
    }
}

/**
 * Setup event listeners for ticket interactions
 */
function setupEventListeners() {
    // Ticket search
    elements.ticketSearch?.addEventListener('input', (e) => {
        ticketsData.filterOptions.search = e.target.value;
        filterTickets();
    });
    
    // Status filter
    elements.statusFilter?.addEventListener('change', (e) => {
        ticketsData.filterOptions.status = e.target.value;
        filterTickets();
    });
    
    // Priority filter
    elements.priorityFilter?.addEventListener('change', (e) => {
        ticketsData.filterOptions.priority = e.target.value;
        filterTickets();
    });
    
    // Add ticket button
    elements.addTicketBtn?.addEventListener('click', () => {
        showTicketModal();
    });
    
    // Ticket form submission
    elements.ticketForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTicket();
    });
    
    // Comment form submission
    elements.commentForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        addComment();
    });
}

/**
 * Fetch tickets from the API
 */
async function fetchTickets() {
    try {
        const response = await axios.get('/api/tickets');
        ticketsData.tickets = response.data;
        renderTicketsTable();
    } catch (error) {
        console.error('Error fetching tickets:', error);
        showErrorNotification('Failed to fetch tickets');
    }
}

/**
 * Render the tickets table with the current data
 */
function renderTicketsTable() {
    if (!elements.ticketTableBody) return;
    
    // Clear the table body
    elements.ticketTableBody.innerHTML = '';
    
    // Filter tickets based on current filter options
    const filteredTickets = filterTickets();
    
    // Add each ticket to the table
    filteredTickets.forEach(ticket => {
        const row = document.createElement('tr');
        
        // Determine status class
        let statusClass = 'badge bg-secondary';
        if (ticket.status === 'open') {
            statusClass = 'badge bg-danger';
        } else if (ticket.status === 'in-progress') {
            statusClass = 'badge bg-warning text-dark';
        } else if (ticket.status === 'resolved') {
            statusClass = 'badge bg-success';
        } else if (ticket.status === 'closed') {
            statusClass = 'badge bg-secondary';
        }
        
        // Determine priority class
        let priorityClass = 'badge bg-secondary';
        if (ticket.priority === 'high') {
            priorityClass = 'badge bg-danger';
        } else if (ticket.priority === 'medium') {
            priorityClass = 'badge bg-warning text-dark';
        } else if (ticket.priority === 'low') {
            priorityClass = 'badge bg-info text-dark';
        }
        
        // Format the date
        const createdDate = new Date(ticket.createdAt);
        const formattedDate = createdDate.toLocaleDateString();
        
        // Create the row content
        row.innerHTML = `
            <td>${ticket.id}</td>
            <td>${ticket.subject}</td>
            <td>${ticket.customer?.name || 'Unknown'}</td>
            <td><span class="${priorityClass}">${ticket.priority}</span></td>
            <td><span class="${statusClass}">${ticket.status}</span></td>
            <td>${formattedDate}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="viewTicketDetails('${ticket.id}')">View</button>
                    <button class="btn btn-outline-secondary" onclick="editTicket('${ticket.id}')">Edit</button>
                    ${ticket.status !== 'closed' ? `<button class="btn btn-outline-success" onclick="resolveTicket('${ticket.id}')">Resolve</button>` : ''}
                </div>
            </td>
        `;
        
        elements.ticketTableBody.appendChild(row);
    });
}

/**
 * Filter tickets based on current filter options
 */
function filterTickets() {
    if (!ticketsData.tickets.length) return [];
    
    return ticketsData.tickets.filter(ticket => {
        // Filter by status
        if (ticketsData.filterOptions.status !== 'all' && 
            ticket.status !== ticketsData.filterOptions.status) {
            return false;
        }
        
        // Filter by priority
        if (ticketsData.filterOptions.priority !== 'all' && 
            ticket.priority !== ticketsData.filterOptions.priority) {
            return false;
        }
        
        // Filter by search term
        if (ticketsData.filterOptions.search) {
            const searchTerm = ticketsData.filterOptions.search.toLowerCase();
            return (
                ticket.subject.toLowerCase().includes(searchTerm) ||
                ticket.description.toLowerCase().includes(searchTerm) ||
                (ticket.customer?.name && ticket.customer.name.toLowerCase().includes(searchTerm))
            );
        }
        
        return true;
    });
}

/**
 * Show the ticket modal for adding/editing a ticket
 */
function showTicketModal(ticketId = null) {
    // Reset form
    elements.ticketForm.reset();
    
    // Set modal title
    const modalTitle = document.querySelector('#ticketModal .modal-title');
    
    if (ticketId) {
        // Edit existing ticket
        modalTitle.textContent = 'Edit Ticket';
        const ticket = ticketsData.tickets.find(t => t.id === ticketId);
        if (ticket) {
            ticketsData.selectedTicket = ticket;
            // Populate form fields
            document.getElementById('