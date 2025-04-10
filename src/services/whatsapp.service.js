const WhatsAppBot = require('../utils/whatsapp-bot');
const qrcode = require('qrcode-terminal');
const Customer = require('../models/customer.model');
const Invoice = require('../models/invoice.model');
const Ticket = require('../models/ticket.model');
const Settings = require('../models/settings.model');
const { processAIResponse, getCustomTemplate } = require('./ai.service');
const { checkNetworkStatus } = require('./network.service');
const { analyzeDeviceIssue, generateDeviceResponse } = require('./device-rag.service');
const { Op } = require('sequelize');

let whatsappClient;
let io;

// Setup WhatsApp client events
const setupWhatsAppClientEvents = (client) => {
  client.on('qr', (qr) => {
    // Generate QR code for WhatsApp Web authentication
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
    
    // Emit QR code to frontend for display
    io.emit('whatsapp:qr', qr);
  });

  client.on('ready', async () => {
    console.log('WhatsApp client is ready!');
    const info = await client.getState();
    io.emit('whatsapp:ready', {
      number: info && info.wid && info.wid._serialized ? info.wid._serialized.split('@')[0] : 'unknown',
      state: info ? info.state : 'unknown'
    });
  });

  client.on('message', async (message) => {
    if (message.from.endsWith('@c.us')) { // Ensure it's a private message
      await handleCustomerMessage(message);
    }
  });

  client.on('disconnected', (reason) => {
    console.log('WhatsApp client was disconnected', reason);
    io.emit('whatsapp:disconnected', reason);
    
    // Attempt to reconnect
    client.initialize();
  });
};

// Initialize WhatsApp client
const initializeWhatsApp = (socketIo) => {
  io = socketIo;
  
  // Make sure we have both the default namespace and whatsapp namespace
  if (io.of && typeof io.of === 'function') {
    // Create a proxy object that preserves all original io methods
    // but overrides emit to broadcast to both namespaces
    const originalIo = io;
    io = new Proxy(originalIo, {
      get: (target, prop) => {
        if (prop === 'emit') {
          return (event, data) => {
            originalIo.emit(event, data);
            if (originalIo.of) {
              originalIo.of('/whatsapp').emit(event, data);
            }
          };
        }
        return target[prop];
      }
    });
  }
  
  whatsappClient = new WhatsAppBot({
    sessionPath: process.env.WHATSAPP_SESSION_DATA_PATH,
    headless: true
  });

  // Setup event listeners
  setupWhatsAppClientEvents(whatsappClient);
  
  // Listen for socket events from both default namespace and whatsapp namespace
  io.on('connection', (socket) => {
    console.log('Socket connection established in whatsapp service');
    
    // Handle authentication event from index.js
    socket.on('whatsapp:auth', (userData) => {
      console.log('WhatsApp auth received for user:', userData.userId);
      socket.user = userData;
    });
    
    // Handle start WhatsApp service
    socket.on('whatsapp:start', () => {
      console.log('WhatsApp start requested by user:', socket.user ? socket.user.id : 'unknown');
      if (whatsappClient) {
        // Only initialize if not already initialized
        if (!whatsappClient.isReady) {
          whatsappClient.initialize();
        }
        socket.emit('whatsapp:starting');
      }
    });
    
    // Handle stop WhatsApp service
    socket.on('whatsapp:stop', () => {
      console.log('WhatsApp stop requested by user:', socket.user ? socket.user.id : 'unknown');
      if (whatsappClient && whatsappClient.isReady) {
        whatsappClient.logout();
        socket.emit('whatsapp:stopping');
      }
    });
    
    // Handle delete WhatsApp session
    socket.on('whatsapp:deleteSession', () => {
      console.log('WhatsApp session deletion requested by user:', socket.user ? socket.user.id : 'unknown');
      if (whatsappClient) {
        // Logout first if client is ready
        if (whatsappClient.isReady) {
          whatsappClient.logout();
        }
        
        // Delete the session data
        const fs = require('fs');
        const path = require('path');
        const sessionPath = process.env.WHATSAPP_SESSION_DATA_PATH || './whatsapp-session';
        
        try {
          // Delete session directory recursively
          if (fs.existsSync(path.join(sessionPath, 'session'))) {
            fs.rmSync(path.join(sessionPath, 'session'), { recursive: true, force: true });
            console.log('WhatsApp session data deleted successfully');
          }
          
          // Recreate the client
          whatsappClient = new WhatsAppBot({
            sessionPath: process.env.WHATSAPP_SESSION_DATA_PATH,
            headless: true
          });
          
          // Setup event listeners again
          setupWhatsAppClientEvents(whatsappClient);
          
          socket.emit('whatsapp:disconnected', 'Session deleted by admin');
        } catch (error) {
          console.error('Error deleting WhatsApp session:', error);
          socket.emit('whatsapp:error', 'Failed to delete session: ' + error.message);
        }
      }
    });
    
    // Handle settings update
    socket.on('whatsapp:updateSettings', (settings) => {
      console.log('WhatsApp settings update requested by user:', socket.user ? socket.user.id : 'unknown');
      // Handle settings update logic here
    });
  });

  // Initialize WhatsApp client
  whatsappClient.initialize();
};


// Handle incoming customer messages
async function handleCustomerMessage(message) {
  try {
    const customerPhone = message.from.split('@')[0];
    const messageContent = message.body;

    console.log(`Message from ${customerPhone}: ${messageContent}`);

    // Find customer by phone number
    const customer = await Customer.findOne({
      where: {
        phone: {
          [Op.or]: [customerPhone, `+${customerPhone}`, customerPhone.replace(/^\+/, '')]
        }
      }
    });

    // Log message for monitoring only if customer is found
    // This prevents the notNull violation for customerId
    if (customer) {
      try {
        await Ticket.create({
          ticketNumber: `TKT-${Date.now()}`,
          customerId: customer.id,
          subject: 'WhatsApp Message',
          description: messageContent,
          category: 'other',
          status: 'open',
          source: 'whatsapp'
        });
      } catch (ticketError) {
        console.error('Error creating ticket:', ticketError);
        // Continue processing even if ticket creation fails
      }
    }

    if (!customer) {
      // Get verification requirements from settings
      const settings = await Settings.findOne();
      const verificationFields = [];

      if (settings.requireName) verificationFields.push('Nama lengkap');
      if (settings.requireEmail) verificationFields.push('Alamat email');
      if (settings.requireAddress) verificationFields.push('Alamat pemasangan');
      if (settings.requirePhone) verificationFields.push('Nomor telepon');

      // Customer not found, ask for verification
      let verificationMessage = 'Selamat datang di Layanan Pelanggan kami. Mohon berikan informasi berikut untuk verifikasi:\n';
      verificationFields.forEach((field, index) => {
        verificationMessage += `${index + 1}. ${field}\n`;
      });

      await whatsappClient.sendMessage(message.from, verificationMessage);
      return;
    }

    // Process message with AI service
    const aiResponse = await processAIResponse(messageContent, customer);

    // Check if this is a connection issue complaint
    if (aiResponse.intent === 'connection_issue') {
      // Check if customer has pending payments
      const pendingInvoice = await Invoice.findOne({
        where: {
          customerId: customer.id,
          status: {
            [Op.in]: ['pending', 'overdue']
          }
        }
      });

      if (pendingInvoice) {
        // Notify customer about pending payment using template
        const paymentMessage = await getCustomTemplate('payment.overdue', {
          invoiceNumber: pendingInvoice.invoiceNumber,
          amount: pendingInvoice.totalAmount.toLocaleString('id-ID'),
          dueDate: new Date(pendingInvoice.dueDate).toLocaleDateString('id-ID')
        });
        await whatsappClient.sendMessage(message.from, paymentMessage);
      } else {
        // Create a new ticket for the connection issue
        const newTicket = await Ticket.create({
          ticketNumber: `TKT-${Date.now()}`,
          customerId: customer.id,
          subject: 'Masalah Koneksi Internet',
          description: messageContent,
          category: 'connection_issue',
          source: 'whatsapp'
        });

        // Check network status and analyze device issues
        const networkStatus = await checkNetworkStatus(customer.pppoeUsername);
        const deviceAnalysis = await analyzeDeviceIssue(customer.deviceId, messageContent);

        // Generate personalized response based on device analysis
        const deviceResponse = await generateDeviceResponse(customer.deviceId, deviceAnalysis);

        if (networkStatus.isOnline) {
          const onlineMessage = `${await getCustomTemplate('network.online', {
            ticketNumber: newTicket.ticketNumber
          })}\n\nAnalisis Perangkat:\n${deviceResponse}`;
          await whatsappClient.sendMessage(message.from, onlineMessage);
        } else {
          const offlineMessage = `${await getCustomTemplate('network.offline', {
            ticketNumber: newTicket.ticketNumber,
            diagnosis: deviceResponse
          })}\n\nAnalisis Perangkat:\n${deviceResponse}`;
          await whatsappClient.sendMessage(message.from, offlineMessage);

          // Notify technicians about the issue with device analysis
          io.emit('new:ticket', { ticket: newTicket, networkStatus, deviceAnalysis });
        }
      }
    } else {
      // Handle other types of inquiries
      await whatsappClient.sendMessage(message.from, aiResponse.message);

      // Create ticket if necessary
      if (aiResponse.createTicket) {
        const newTicket = await Ticket.create({
          ticketNumber: `TKT-${Date.now()}`,
          customerId: customer.id,
          subject: aiResponse.ticketSubject || 'Permintaan Pelanggan',
          description: messageContent,
          category: aiResponse.ticketCategory || 'other',
          source: 'whatsapp'
        });

        await whatsappClient.sendMessage(message.from,
          `Tiket Anda telah dibuat dengan nomor: ${newTicket.ticketNumber}. ` +
          `Tim kami akan segera menindaklanjuti permintaan Anda.`);

        // Notify staff about the new ticket
        io.emit('new:ticket', { ticket: newTicket });
      }
    }

  } catch (error) {
    console.error('Error handling customer message:', error);
    try {
      await whatsappClient.sendMessage(message.from,
        'Mohon maaf, terjadi kesalahan dalam memproses pesan Anda. ' +
        'Silakan coba lagi nanti atau hubungi kami di nomor layanan pelanggan.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
}

// Send message to customer
const sendMessageToCustomer = async (phone, message) => {
  try {
    // Format phone number if needed
    const formattedPhone = phone.startsWith('+')
      ? phone.substring(1) + '@c.us'
      : phone + '@c.us';
    
    await whatsappClient.sendMessage(formattedPhone, message);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

module.exports = {
  initializeWhatsApp,
  sendMessageToCustomer
};