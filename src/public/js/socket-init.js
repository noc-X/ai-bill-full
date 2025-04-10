// Socket.io initialization script
// This script should be included before any script that uses socket.io

// Initialize socket connection if socket.io is available
if (typeof io !== 'undefined') {
    // Create namespace connections based on current page
    const currentPath = window.location.pathname;
    
    // Default to main namespace
    let socketNamespace = '/';
    
    // Set appropriate namespace based on page
    if (currentPath.includes('network-monitor')) {
        socketNamespace = '/network-monitor';
    } else if (currentPath.includes('chat') || currentPath.includes('whatsapp') || currentPath.includes('ai-service')) {
        socketNamespace = '/whatsapp';
    }
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('token');
    
    // Initialize the socket with the appropriate namespace and auth token
    window.socket = io(socketNamespace, {
        auth: {
            token: token
        }
    });
    
    // Log connection status
    window.socket.on('connect', () => {
        console.log(`Connected to socket.io namespace: ${socketNamespace}`);
    });
    
    window.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });
} else {
    console.warn('Socket.io not available. Make sure to include socket.io client script.');
}