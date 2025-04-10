/**
 * ISP Management Navigation JavaScript
 * This file handles the navigation functionality for the ISP Management System.
 */

// Initialize the navigation when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Highlight active menu item
    highlightActiveMenu();
});

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