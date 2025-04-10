/**
 * ISP Management Layout JavaScript
 * This file handles the common layout functionality including sidebar navigation
 * and menu highlighting for the ISP Management System.
 */

// Initialize the layout when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initLayout();
});

/**
 * Initialize the layout functionality
 */
function initLayout() {
    // Setup active menu highlighting
    highlightActiveMenu();
    
    // Setup mobile menu toggle if exists
    setupMobileMenu();
    
    // Setup logout functionality if exists
    setupLogout();
}

/**
 * Highlight the active menu item based on current page
 */
function highlightActiveMenu() {
    // Get current page path
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current page menu item
    if (pageName === '' || pageName === 'index.html' || pageName === '/') {
        // Dashboard is the default page
        document.querySelector('.sidebar .nav-link[href="dashboard.html"]')?.classList.add('active');
    } else {
        // Try to find the matching menu item
        const activeLink = document.querySelector(`.sidebar .nav-link[href="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            // If no exact match, try to match by page name without extension
            const pageBaseName = pageName.split('.')[0];
            document.querySelectorAll('.sidebar .nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes(pageBaseName)) {
                    link.classList.add('active');
                }
            });
        }
    }
}

/**
 * Setup mobile menu toggle functionality
 */
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show-mobile');
        });
    }
}

/**
 * Setup logout functionality
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear any auth tokens from localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Redirect to login page
            window.location.href = '/login.html';
        });
    }
}

/**
 * Create a consistent sidebar menu across all pages
 * @param {string} containerId - The ID of the container element for the sidebar
 */
function createSidebar(containerId = 'sidebarContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const sidebarHTML = `
    <div class="sidebar p-0">
        <div class="d-flex flex-column p-3">
            <h5 class="mb-4 text-center">ISP Management</h5>
            <ul class="nav nav-pills flex-column mb-auto">
                <li class="nav-item">
                    <a href="dashboard.html" class="nav-link">
                        <i class="bi bi-speedometer2 me-2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a href="customers.html" class="nav-link">
                        <i class="bi bi-people me-2"></i> Customers
                    </a>
                </li>
                <li class="nav-item">
                    <a href="billing.html" class="nav-link">
                        <i class="bi bi-cash-coin me-2"></i> Billing
                    </a>
                </li>
                <li class="nav-item">
                    <a href="payments.html" class="nav-link">
                        <i class="bi bi-credit-card me-2"></i> Payments
                    </a>
                </li>
                <li class="nav-item">
                    <a href="tickets.html" class="nav-link">
                        <i class="bi bi-ticket-detailed me-2"></i> Tickets
                    </a>
                </li>
                <li class="nav-item">
                    <a href="network.html" class="nav-link">
                        <i class="bi bi-diagram-3 me-2"></i> Network
                    </a>
                </li>
                <li class="nav-item">
                    <a href="network-monitor.html" class="nav-link">
                        <i class="bi bi-activity me-2"></i> Monitoring
                    </a>
                </li>
                <li class="nav-item">
                    <a href="bandwidth.html" class="nav-link">
                        <i class="bi bi-speedometer me-2"></i> Bandwidth
                    </a>
                </li>
                <li class="nav-item">
                    <a href="reports.html" class="nav-link">
                        <i class="bi bi-bar-chart me-2"></i> Reports
                    </a>
                </li>
                <li class="nav-item">
                    <a href="ai-service.html" class="nav-link">
                        <i class="bi bi-robot me-2"></i> AI Service
                    </a>
                </li>
                <li class="nav-item">
                    <a href="settings.html" class="nav-link">
                        <i class="bi bi-gear me-2"></i> Settings
                    </a>
                </li>
            </ul>
            <hr>
            <div class="dropdown">
                <a href="#" class="d-flex align-items-center text-white text-decoration-none dropdown-toggle" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-person-circle me-2"></i>
                    <span id="currentUserName">User</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutBtn">Sign out</a></li>
                </ul>
            </div>
            <p>
            <p>
            <p> Develope @RBA SOLUTION</p>
        </div>
        
    </div>
    `;
    
    container.innerHTML = sidebarHTML;
    
    // Initialize the layout after creating sidebar
    initLayout();
}