// Chat Monitoring and Statistics
let totalMessages = 0;
let activeChats = 0;
let avgResponseTime = 0;
let verifiedCustomers = 0;
let pendingVerifications = 0;

// Use the existing socket from socket-init.js
// const socket = io('/whatsapp');

// Initialize response types chart
const responseTypesChart = new Chart(
    document.getElementById('responseTypesChart'),
    {
        type: 'doughnut',
        data: {
            labels: ['Network Issues', 'Payment Issues', 'General Inquiries'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#ff6384', '#36a2eb', '#ffce56']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    }
);

// Update monitoring statistics
function updateMonitoringStats(data) {
    // Update counters
    totalMessages = data.totalMessages || totalMessages;
    activeChats = data.activeChats || activeChats;
    avgResponseTime = data.avgResponseTime || avgResponseTime;
    verifiedCustomers = data.verifiedCustomers || verifiedCustomers;
    pendingVerifications = data.pendingVerifications || pendingVerifications;

    // Update UI elements
    document.getElementById('totalMessages').textContent = totalMessages;
    document.getElementById('activeChats').textContent = activeChats;
    document.getElementById('avgResponseTime').textContent = `${avgResponseTime}s`;

    // Update verification progress
    const totalCustomers = verifiedCustomers + pendingVerifications;
    const verifiedPercentage = totalCustomers > 0 
        ? (verifiedCustomers / totalCustomers) * 100 
        : 0;

    document.getElementById('verifiedProgress').style.width = `${verifiedPercentage}%`;
    document.getElementById('verifiedProgress').setAttribute('aria-valuenow', verifiedPercentage);
    document.getElementById('verifiedCount').textContent = `${verifiedCustomers} Verified`;
    document.getElementById('pendingCount').textContent = `${pendingVerifications} Pending`;
}

// Update response types chart
function updateResponseTypesChart(data) {
    responseTypesChart.data.datasets[0].data = [
        data.networkIssues || 0,
        data.paymentIssues || 0,
        data.generalInquiries || 0
    ];
    responseTypesChart.update();
}

// Add chat message to history
function addChatMessage(message) {
    const chatHistory = document.getElementById('chatHistory');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message.text;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString();

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Socket event listeners
socket.on('chat:stats', (data) => {
    updateMonitoringStats(data);
});

socket.on('chat:response_types', (data) => {
    updateResponseTypesChart(data);
});

socket.on('chat:message', (message) => {
    addChatMessage(message);
});