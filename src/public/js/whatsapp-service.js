/**
 * WhatsApp Service JavaScript
 * Handles WhatsApp QR code scanning and advanced settings functionality
 */

let socket;
let connectedNumber = null;
let connectedSince = null;

// Initialize socket connection
function initializeSocket() {
    if (socket && socket.connected) {
        showToast('WhatsApp Service', 'Already connected or connecting', 'info');
        return;
    }

    // Use the existing socket from socket-init.js instead of creating a new one
    socket = window.socket;
    
    if (!socket) {
        console.error('Socket not initialized. Make sure socket-init.js is loaded properly.');
        try {
            // Attempt to create a new socket connection
            socket = io('/', {
                auth: {
                    token: localStorage.getItem('token')
                }
            });
            console.log('Created new socket connection');
        } catch (socketError) {
            console.error('Failed to create socket:', socketError);
            showToast('Connection Error', 'Could not initialize socket connection', 'danger');
            return;
        }
    }
    
    // Make sure we're connected to the whatsapp namespace
    if (!socket.nsp || socket.nsp !== '/whatsapp') {
        console.log('Connecting to WhatsApp namespace');
        try {
            socket = io('/whatsapp', {
                auth: {
                    token: localStorage.getItem('token')
                }
            });
        } catch (namespaceError) {
            console.error('Failed to connect to WhatsApp namespace:', namespaceError);
            showToast('Connection Error', 'Could not connect to WhatsApp service', 'danger');
            return;
        }
    }
    
    // Emit start event to trigger QR code generation
    socket.emit('whatsapp:start');
    updateServiceStatus('Connecting...', 'info');
    
    // Handle WhatsApp QR code
    socket.on('whatsapp:qr', (qr) => {
        console.log('QR code received:', qr);
        // Show QR code modal
        const qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
        qrModal.show();
        
        // Generate QR code
        const qrContainer = document.getElementById('qrCode');
        if (!qrContainer) {
            console.error('QR code container not found');
            showToast('Error', 'QR code container not found in the document', 'danger');
            return;
        }
        
        qrContainer.innerHTML = '';
        
        // Check if QRCode is properly loaded
        if (typeof QRCode === 'undefined') {
            console.error('QRCode library is not loaded properly');
            showToast('Error', 'QR Code library failed to load', 'danger');
            
            // Fallback to display QR as text if library fails
            const qrText = document.createElement('p');
            qrText.textContent = 'QR Code: ' + qr;
            qrContainer.appendChild(qrText);
            return;
        }
        
        // Use try-catch to handle potential QRCode initialization errors
        try {
            new QRCode(qrContainer, {
                text: qr,
                width: 300,
                height: 300,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.H : 2 // Fallback to value 2 (High) if CorrectLevel is undefined
            });
            
            // Add a refresh button in case the QR code doesn't scan properly
            const refreshButton = document.createElement('button');
            refreshButton.className = 'btn btn-outline-primary mt-3';
            refreshButton.innerHTML = '<i class="bi bi-arrow-repeat me-2"></i>Refresh QR Code';
            refreshButton.onclick = initializeSocket;
            qrContainer.appendChild(refreshButton);
        } catch (error) {
            console.error('Error generating QR code:', error);
            showToast('Error', 'Failed to generate QR code: ' + error.message, 'danger');
            
            // Fallback to display error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'alert alert-danger';
            errorMsg.textContent = 'Failed to generate QR code: ' + error.message;
            qrContainer.appendChild(errorMsg);
            return;
        }
        
        updateServiceStatus('Waiting for QR Scan', 'warning');
        showToast('QR Code Ready', 'Please scan the QR code with WhatsApp on your phone', 'info');
    });
    
    // Handle WhatsApp ready state
    socket.on('whatsapp:ready', (data) => {
        connectedNumber = data.number;
        connectedSince = new Date().toLocaleString('id-ID');
        
        updateServiceStatus('Active', 'success');
        updateConnectionInfo();
        
        const qrModal = bootstrap.Modal.getInstance(document.getElementById('qrModal'));
        if (qrModal) qrModal.hide();
        
        showToast('WhatsApp Connected', 'Service is now active and ready to handle messages', 'success');

        // Enable stop button and disable start button
        document.getElementById('stopWhatsAppBtn').disabled = false;
        document.getElementById('startWhatsAppBtn').disabled = true;
        document.getElementById('scanQRBtn').disabled = true;
    });
    
    // Handle WhatsApp disconnected state
    socket.on('whatsapp:disconnected', (reason) => {
        connectedNumber = null;
        connectedSince = null;
        updateServiceStatus('Disconnected', 'danger');
        showToast('WhatsApp Disconnected', reason || 'Service has been disconnected', 'warning');

        // Enable start button and disable stop button
        document.getElementById('stopWhatsAppBtn').disabled = true;
        document.getElementById('startWhatsAppBtn').disabled = false;
        document.getElementById('scanQRBtn').disabled = false;
        updateConnectionInfo();
        showToast('WhatsApp Disconnected', `Reason: ${reason}`, 'danger');
    });
}

// Update service status display
function updateServiceStatus(status, badgeClass) {
    const statusBadge = document.getElementById('serviceStatus');
    statusBadge.textContent = status;
    statusBadge.className = `badge bg-${badgeClass} ms-2`;
}

// Update connection information
function updateConnectionInfo() {
    const numberElement = document.getElementById('connectedNumber');
    const timeElement = document.getElementById('activeSince');
    
    numberElement.textContent = connectedNumber || 'Not Connected';
    timeElement.textContent = connectedSince || 'N/A';
}

// Show toast notification
function showToast(title, message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong><br>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Handle start WhatsApp service
function startWhatsAppService() {
    socket.emit('whatsapp:start');
    updateServiceStatus('Connecting...', 'warning');
    showToast('Starting Service', 'Initializing WhatsApp connection...', 'info');
}

// Handle stop WhatsApp service
function stopWhatsAppService() {
    socket.emit('whatsapp:stop');
    updateServiceStatus('Stopped', 'danger');
    connectedNumber = null;
    connectedSince = null;
    updateConnectionInfo();
    showToast('Service Stopped', 'WhatsApp service has been stopped', 'warning');
}

// Handle delete WhatsApp session
function deleteWhatsAppSession() {
    socket.emit('whatsapp:deleteSession');
    updateServiceStatus('Session Deleted', 'danger');
    connectedNumber = null;
    connectedSince = null;
    updateConnectionInfo();
    showToast('Session Deleted', 'WhatsApp session has been deleted', 'warning');
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket connection
    initializeSocket();
    
    // Setup event listeners
    document.getElementById('startWhatsAppBtn').addEventListener('click', startWhatsAppService);
    document.getElementById('stopWhatsAppBtn').addEventListener('click', stopWhatsAppService);
    document.getElementById('deleteSessionBtn').addEventListener('click', deleteWhatsAppSession);
    document.getElementById('scanQRBtn').addEventListener('click', initializeSocket);
    
    // Setup advanced settings form
    const settingsForm = document.getElementById('advancedSettingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(settingsForm);
            const settings = Object.fromEntries(formData);
            socket.emit('whatsapp:updateSettings', settings);
            showToast('Settings Updated', 'Advanced settings have been saved successfully', 'success');
        });
    }
    
    // Initialize connection info
    updateConnectionInfo();
});