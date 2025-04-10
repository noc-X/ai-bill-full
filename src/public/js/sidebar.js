/**
 * Sidebar Navigation
 * Handles sidebar navigation for the dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    checkAuthentication();
});

/**
 * Initialize sidebar navigation
 */
function initSidebar() {
    const sidebarContainer = document.getElementById('sidebarContainer');
    if (!sidebarContainer) return;
    
    // Create sidebar content
    sidebarContainer.innerHTML = `
        <div class="sidebar p-3">
            <h5 class="mb-3 text-center">AI Bill Management</h5>
            <hr class="text-light">
            <ul class="nav flex-column">
                <li class="nav-item">
                    <a class="nav-link active" href="/dashboard.html">
                        <i class="bi bi-speedometer2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/customers.html">
                        <i class="bi bi-people"></i> Customers
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/billing.html">
                        <i class="bi bi-receipt"></i> Billing
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/payments.html">
                        <i class="bi bi-credit-card"></i> Payments
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/network.html">
                        <i class="bi bi-diagram-3"></i> Network
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/network-monitor.html">
                        <i class="bi bi-activity"></i> Monitoring
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/tickets.html">
                        <i class="bi bi-ticket"></i> Support Tickets
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/reports.html">
                        <i class="bi bi-bar-chart"></i> Reports
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="/settings.html">
                        <i class="bi bi-gear"></i> Settings
                    </a>
                </li>
                <li class="nav-item mt-3">
                    <a class="nav-link" href="#" id="logoutBtn">
                        <i class="bi bi-box-arrow-right"></i> Logout
                    </a>
                </li>
            </ul>
        </div>
    `;
    
    // Add logout functionality
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
    
    // Highlight current page in sidebar
    highlightCurrentPage();
}

/**
 * Highlight the current page in the sidebar
 */
function highlightCurrentPage() {
    const currentPage = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
    }
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}