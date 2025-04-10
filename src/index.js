require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');

// Import database connection
const { sequelize } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const networkRoutes = require('./routes/network.routes');
const networkMonitorRoutes = require('./routes/network-monitor.routes');
const networkDashboardRoutes = require('./routes/network-dashboard.routes');
const bandwidthManagerRoutes = require('./routes/bandwidth-manager.routes');
const packageRoutes = require('./routes/package.routes');
const importRoutes = require('./routes/import.routes');
const aiRoutes = require('./routes/ai.routes');
const aiRouterRoutes = require('./routes/ai-router.routes');
const settingsRoutes = require('./routes/settings.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

// Import services
const { initializeWhatsApp } = require('./services/whatsapp.service');
const { scheduleBillingGeneration } = require('./services/billing.service');
const { setupEventListeners } = require('./controllers/network-monitor.controller');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

// Create namespaces for different features
const networkMonitorNamespace = io.of('/network-monitor');
const whatsappNamespace = io.of('/whatsapp');

// Handle namespace connection errors
io.on('connect_error', (error) => {
  console.error('Socket.io connection error:', error);
});

io.on('connect_timeout', (timeout) => {
  console.error('Socket.io connection timeout:', timeout);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(__dirname + '/public'));

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(__dirname + '/public/favicon.ico');
});

// Connect to PostgreSQL
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('PostgreSQL connection error:', err));

// Network Monitor namespace connections
networkMonitorNamespace.on('connection', (socket) => {
  console.log('Network monitor client connected');
  
  socket.on('disconnect', () => {
    console.log('Network monitor client disconnected');
  });
  
  socket.on('error', (error) => {
    console.error('Network monitor socket error:', error);
  });
});

// WhatsApp namespace connections
whatsappNamespace.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication token missing'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Invalid or expired token'));
  }
});

whatsappNamespace.on('connection', (socket) => {
  console.log('WhatsApp client connected');
  
  socket.on('disconnect', () => {
    console.log('WhatsApp client disconnected');
  });
  
  socket.on('error', (error) => {
    console.error('WhatsApp socket error:', error);
  });
  
  // WhatsApp service events are handled in whatsapp.service.js
  console.log('WhatsApp namespace ready for events');
  
  // Forward user information to the socket for authentication in service
  if (socket.user) {
    socket.emit('whatsapp:auth', { userId: socket.user.id, role: socket.user.role });
  }
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/network', networkDashboardRoutes); // Register network dashboard routes under /api/network
app.use('/api/network-monitor', networkMonitorRoutes);
app.use('/api/bandwidth', bandwidthManagerRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/import', importRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai-router', aiRouterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Import and use template routes
const templateRoutes = require('./routes/template.routes');
app.use('/api/templates', templateRoutes);

// Root route - redirect to login or dashboard based on auth status
app.get('/', (req, res) => {
  res.sendFile('login.html', { root: 'src/public' });
});

// Initialize WhatsApp service
initializeWhatsApp(io);

// Setup network monitoring event listeners
setupEventListeners(io);

// Schedule monthly billing generation (run on the 1st day of each month at 00:01)
cron.schedule('1 0 1 * *', () => {
  console.log('Running monthly billing generation');
  scheduleBillingGeneration();
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

module.exports = { app, server, io };