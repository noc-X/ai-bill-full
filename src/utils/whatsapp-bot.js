const { Client, LocalAuth } = require('whatsapp-web.js');
const EventEmitter = require('events');

class WhatsAppBot extends EventEmitter {
  constructor(options = {}) {
    super();
    this.sessionPath = options.sessionPath || './whatsapp-session';
    this.headless = options.headless !== undefined ? options.headless : true;
    this.client = null;
    this.isReady = false;
  }

  initialize() {
    // Initialize WhatsApp Web client
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.sessionPath
      }),
      puppeteer: {
        headless: this.headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu']
      }
    });

    // Set up event listeners
    this.client.on('qr', (qr) => {
      this.emit('qr', qr);
    });

    this.client.on('ready', () => {
      this.isReady = true;
      this.emit('ready');
    });

    this.client.on('message', (message) => {
      this.emit('message', message);
    });

    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      this.emit('disconnected', reason);
    });

    // Initialize the client
    this.client.initialize();
  }

  async sendMessage(to, message) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      return await this.client.sendMessage(to, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getState() {
    if (!this.client) {
      return 'DISCONNECTED';
    }
    return await this.client.getState();
  }

  async logout() {
    if (this.client) {
      await this.client.logout();
      this.isReady = false;
    }
  }
}

module.exports = WhatsAppBot;