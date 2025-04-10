/**
 * API Client
 * Handles API requests with authentication
 */

// Get authentication token from localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
async function apiRequest(url, options = {}) {
    const token = getAuthToken();
    
    if (!token) {
        // Redirect to login if no token is found
        window.location.href = '/login.html';
        return Promise.reject(new Error('Authentication required'));
    }
    
    // Set default headers
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    // Make the request with authentication header
    return fetch(url, {
        ...options,
        headers
    });
}

// Export the API client functions
window.apiClient = {
    get: (url) => apiRequest(url),
    post: (url, data) => apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    put: (url, data) => apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (url) => apiRequest(url, {
        method: 'DELETE'
    })
};