/**
 * Network Monitoring Service
 * Enhanced real-time monitoring for network devices and automated issue detection
 */

// Try to require mikrotik-node, but handle the case when it's not available
let MikroNode;
try {
  MikroNode = require('mikrotik-node').MikroNode;
} catch (error) {
  console.warn('mikrotik-node module not found, using dummy implementation');
  // Dummy MikroNode implementation
  MikroNode = function(host, port, user, password) {
    this.connect = async () => console.log('Dummy connection established');
    this.openChannel = () => ({
      write: async () => console.log('Dummy write operation'),
      read: async () => []
    });
    this.close = () => console.log('Dummy connection closed');
    return this;
  };
}

const { EventEmitter } = require('events');
const { checkNetworkStatus, troubleshootConnection } = require('./network.service');
const Ticket = require('../models/ticket.model');
const Customer = require('../models/customer.model');

// Initialize Mikrotik connection from environment variables
const initMikrotikConnection = () => {
  const connection = new MikroNode(
    process.env.MIKROTIK_HOST,
    process.env.MIKROTIK_PORT,
    process.env.MIKROTIK_USER,
    process.env.MIKROTIK_PASSWORD
  );
  
  return connection;
}; 

// Create a network monitor class that extends EventEmitter
class NetworkMonitor extends EventEmitter {
  constructor() {
    super();
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.deviceStatus = {};
    this.thresholds = {
      cpuLoad: 80, // CPU load percentage threshold
      memoryUsage: 80, // Memory usage percentage threshold
      diskUsage: 80, // Disk usage percentage threshold
      packetLoss: 5, // Packet loss percentage threshold
      latency: 100, // Latency threshold in ms
      bandwidthUtilization: 80 // Bandwidth utilization percentage threshold
    };
  }

  // Load thresholds from settings
  async loadThresholds() {
    try {
      const Settings = require('../models/settings.model');
      const deviceSettings = await Settings.findOne({ where: { key: 'network_device_settings' } });
      
      if (deviceSettings && deviceSettings.value) {
        const settings = deviceSettings.value;
        
        // Update thresholds from settings
        if (settings.cpuThreshold) this.thresholds.cpuLoad = parseInt(settings.cpuThreshold);
        if (settings.memoryThreshold) this.thresholds.memoryUsage = parseInt(settings.memoryThreshold);
        if (settings.temperatureThreshold) this.thresholds.temperature = parseInt(settings.temperatureThreshold);
        
        console.log('Loaded monitoring thresholds from settings:', this.thresholds);
      }
    } catch (error) {
      console.error('Error loading thresholds from settings:', error);
    }
  }
  
  // Start real-time monitoring
  async startMonitoring(intervalMs = 60000) {
    // Load thresholds from settings
    await this.loadThresholds();
    if (this.isMonitoring) {
      return { status: 'already_running', message: 'Monitoring is already running' };
    }

    this.isMonitoring = true;
    console.log(`Starting network monitoring with interval: ${intervalMs}ms`);

    // Initial monitoring run
    await this.monitorNetwork();

    // Set up interval for continuous monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.monitorNetwork();
    }, intervalMs);

    return { status: 'started', message: 'Network monitoring started successfully' };
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) {
      return { status: 'not_running', message: 'Monitoring is not running' };
    }

    clearInterval(this.monitoringInterval);
    this.isMonitoring = false;
    console.log('Network monitoring stopped');

    return { status: 'stopped', message: 'Network monitoring stopped successfully' };
  }

  // Main monitoring function
  async monitorNetwork() {
    try {
      // Get system resources
      const resources = await this.getSystemResources();
      
      // Get interface status
      const interfaces = await this.getInterfaceStatus();
      
      // Get active connections
      const connections = await this.getActiveConnections();
      
      // Get wireless status
      const wireless = await this.getWirelessStatus();
      
      // Detect issues
      const issues = this.detectIssues(resources, interfaces, connections, wireless);
      
      // Update device status
      this.deviceStatus = {
        timestamp: new Date(),
        resources,
        interfaces,
        connections,
        wireless,
        issues
      };
      
      // Emit monitoring data event
      this.emit('monitoring_data', this.deviceStatus);
      
      // Handle critical issues
      if (issues.critical.length > 0) {
        this.emit('critical_issue', {
          timestamp: new Date(),
          issues: issues.critical
        });
        
        // Create tickets for critical issues
        await this.createIssueTickets(issues.critical);
      }
      
      return this.deviceStatus;
    } catch (error) {
      console.error('Error in network monitoring:', error);
      this.emit('monitoring_error', {
        timestamp: new Date(),
        error: error.message
      });
      
      return {
        timestamp: new Date(),
        error: error.message,
        status: 'error'
      };
    }
  }

  // Get system resources
  async getSystemResources() {
    try {
      const connection = initMikrotikConnection();
      await connection.connect();
      
      const chan = connection.openChannel();
      
      // Get system resource usage
      await chan.write('/system/resource/print');
      const resourceData = await chan.read();
      
      connection.close();
      
      if (resourceData.length > 0) {
        const data = resourceData[0];
        
        // Calculate memory usage percentage
        const totalMemory = parseInt(data['total-memory'] || 0);
        const freeMemory = parseInt(data['free-memory'] || 0);
        const memoryUsage = totalMemory > 0 ? ((totalMemory - freeMemory) / totalMemory) * 100 : 0;
        
        // Calculate disk usage percentage
        const totalHdd = parseInt(data['total-hdd-space'] || 0);
        const freeHdd = parseInt(data['free-hdd-space'] || 0);
        const diskUsage = totalHdd > 0 ? ((totalHdd - freeHdd) / totalHdd) * 100 : 0;
        
        return {
          cpuLoad: parseFloat(data['cpu-load'] || 0),
          memoryUsage: memoryUsage.toFixed(2),
          diskUsage: diskUsage.toFixed(2),
          uptime: data.uptime,
          version: data.version,
          boardName: data['board-name'],
          timestamp: new Date()
        };
      }
      
      return {
        cpuLoad: 0,
        memoryUsage: 0,
        diskUsage: 0,
        uptime: '',
        version: '',
        boardName: '',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting system resources:', error);
      return {
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Get interface status
  async getInterfaceStatus() {
    try {
      const connection = initMikrotikConnection();
      await connection.connect();
      
      const chan = connection.openChannel();
      
      // Get interface statistics
      await chan.write('/interface/print', [
        '=stats='
      ]);
      const interfaceData = await chan.read();
      
      connection.close();
      
      return interfaceData.map(iface => ({
        name: iface.name,
        type: iface.type,
        status: iface.running === 'true' ? 'up' : 'down',
        macAddress: iface['mac-address'],
        rxBytes: parseInt(iface['rx-byte'] || 0),
        txBytes: parseInt(iface['tx-byte'] || 0),
        rxPackets: parseInt(iface['rx-packet'] || 0),
        txPackets: parseInt(iface['tx-packet'] || 0),
        rxErrors: parseInt(iface['rx-error'] || 0),
        txErrors: parseInt(iface['tx-error'] || 0),
        rxDrops: parseInt(iface['rx-drop'] || 0),
        txDrops: parseInt(iface['tx-drop'] || 0),
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Error getting interface status:', error);
      return {
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Get active connections
  async getActiveConnections() {
    try {
      const connection = initMikrotikConnection();
      await connection.connect();
      
      const chan = connection.openChannel();
      
      // Get active PPPoE connections
      await chan.write('/ppp/active/print');
      const activeConnections = await chan.read();
      
      connection.close();
      
      return activeConnections.map(conn => ({
        name: conn.name,
        service: conn.service,
        address: conn.address,
        uptime: conn.uptime,
        encoding: conn.encoding,
        timestamp: new Date()
      }));
    } catch (error) {
      console.error('Error getting active connections:', error);
      return {
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Get wireless status
  async getWirelessStatus() {
    try {
      const connection = initMikrotikConnection();
      await connection.connect();
      
      const chan = connection.openChannel();
      
      // Get wireless interfaces
      await chan.write('/interface/wireless/print');
      const wirelessInterfaces = await chan.read();
      
      // Get wireless registration table
      await chan.write('/interface/wireless/registration-table/print');
      const registrationTable = await chan.read();
      
      connection.close();
      
      return {
        interfaces: wirelessInterfaces.map(iface => ({
          name: iface.name,
          macAddress: iface['mac-address'],
          ssid: iface.ssid,
          band: iface.band,
          channel: iface.channel,
          frequency: iface.frequency,
          status: iface.disabled === 'false' ? 'enabled' : 'disabled',
          timestamp: new Date()
        })),
        clients: registrationTable.map(client => ({
          interface: client.interface,
          macAddress: client['mac-address'],
          signalStrength: client['signal-strength'],
          txRate: client['tx-rate'],
          rxRate: client['rx-rate'],
          uptime: client.uptime,
          timestamp: new Date()
        }))
      };
    } catch (error) {
      console.error('Error getting wireless status:', error);
      return {
        interfaces: [],
        clients: [],
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Detect issues based on monitoring data
  detectIssues(resources, interfaces, connections, wireless) {
    const criticalIssues = [];
    const warningIssues = [];
    const infoIssues = [];
    
    // Check system resources
    if (resources.cpuLoad > this.thresholds.cpuLoad) {
      criticalIssues.push({
        type: 'system',
        component: 'cpu',
        message: `High CPU load: ${resources.cpuLoad}%`,
        value: resources.cpuLoad,
        threshold: this.thresholds.cpuLoad,
        timestamp: new Date()
      });
    } else if (resources.cpuLoad > this.thresholds.cpuLoad * 0.8) {
      warningIssues.push({
        type: 'system',
        component: 'cpu',
        message: `Elevated CPU load: ${resources.cpuLoad}%`,
        value: resources.cpuLoad,
        threshold: this.thresholds.cpuLoad,
        timestamp: new Date()
      });
    }
    
    if (resources.memoryUsage > this.thresholds.memoryUsage) {
      criticalIssues.push({
        type: 'system',
        component: 'memory',
        message: `High memory usage: ${resources.memoryUsage}%`,
        value: resources.memoryUsage,
        threshold: this.thresholds.memoryUsage,
        timestamp: new Date()
      });
    } else if (resources.memoryUsage > this.thresholds.memoryUsage * 0.8) {
      warningIssues.push({
        type: 'system',
        component: 'memory',
        message: `Elevated memory usage: ${resources.memoryUsage}%`,
        value: resources.memoryUsage,
        threshold: this.thresholds.memoryUsage,
        timestamp: new Date()
      });
    }
    
    if (resources.diskUsage > this.thresholds.diskUsage) {
      criticalIssues.push({
        type: 'system',
        component: 'disk',
        message: `High disk usage: ${resources.diskUsage}%`,
        value: resources.diskUsage,
        threshold: this.thresholds.diskUsage,
        timestamp: new Date()
      });
    } else if (resources.diskUsage > this.thresholds.diskUsage * 0.8) {
      warningIssues.push({
        type: 'system',
        component: 'disk',
        message: `Elevated disk usage: ${resources.diskUsage}%`,
        value: resources.diskUsage,
        threshold: this.thresholds.diskUsage,
        timestamp: new Date()
      });
    }
    
    // Check interfaces
    if (Array.isArray(interfaces)) {
      interfaces.forEach(iface => {
        if (iface.status === 'down' && iface.type !== 'bridge') {
          criticalIssues.push({
            type: 'interface',
            component: iface.name,
            message: `Interface ${iface.name} is down`,
            value: 'down',
            threshold: 'up',
            timestamp: new Date()
          });
        }
        
        if (iface.rxErrors > 0 || iface.txErrors > 0) {
          warningIssues.push({
            type: 'interface',
            component: iface.name,
            message: `Interface ${iface.name} has errors (RX: ${iface.rxErrors}, TX: ${iface.txErrors})`,
            value: iface.rxErrors + iface.txErrors,
            threshold: 0,
            timestamp: new Date()
          });
        }
        
        if (iface.rxDrops > 10 || iface.txDrops > 10) {
          warningIssues.push({
            type: 'interface',
            component: iface.name,
            message: `Interface ${iface.name} has packet drops (RX: ${iface.rxDrops}, TX: ${iface.txDrops})`,
            value: iface.rxDrops + iface.txDrops,
            threshold: 10,
            timestamp: new Date()
          });
        }
      });
    }
    
    // Check wireless status
    if (wireless && wireless.interfaces) {
      wireless.interfaces.forEach(iface => {
        if (iface.status === 'disabled') {
          infoIssues.push({
            type: 'wireless',
            component: iface.name,
            message: `Wireless interface ${iface.name} is disabled`,
            value: 'disabled',
            threshold: 'enabled',
            timestamp: new Date()
          });
        }
      });
      
      if (wireless.clients) {
        wireless.clients.forEach(client => {
          // Check signal strength (typically in dBm, lower values are worse)
          const signalStrength = parseInt(client.signalStrength || '-100');
          if (signalStrength < -80) {
            warningIssues.push({
              type: 'wireless',
              component: client.interface,
              message: `Poor signal strength (${signalStrength} dBm) for client ${client.macAddress}`,
              value: signalStrength,
              threshold: -80,
              timestamp: new Date()
            });
          }
        });
      }
    }
    
    return {
      critical: criticalIssues,
      warning: warningIssues,
      info: infoIssues
    };
  }

  // Create tickets for critical issues
  async createIssueTickets(issues) {
    try {
      for (const issue of issues) {
        // Create a descriptive ticket subject
        const subject = `Automatic Alert: ${issue.message}`;
        
        // Create a detailed description
        const description = `
          Automatic monitoring detected a critical issue:
          Type: ${issue.type}
          Component: ${issue.component}
          Message: ${issue.message}
          Current Value: ${issue.value}
          Threshold: ${issue.threshold}
          Detected at: ${issue.timestamp}
        `;
        
        // Check if there's already an open ticket for this issue
        const existingTicket = await Ticket.findOne({
          where: {
            subject,
            status: ['open', 'in_progress']
          }
        });
        
        if (!existingTicket) {
          // Create a new ticket
          await Ticket.create({
            ticketNumber: `TKT-${Date.now()}`,
            subject,
            description,
            category: 'network_issue',
            priority: 'high',
            status: 'open',
            source: 'ai_monitoring'
          });
          
          console.log(`Created ticket for issue: ${issue.message}`);
        } else {
          console.log(`Ticket already exists for issue: ${issue.message}`);
        }
      }
    } catch (error) {
      console.error('Error creating issue tickets:', error);
    }
  }

  // Run ping test to a specific host
  async runPingTest(host, count = 5) {
    try {
      const connection = initMikrotikConnection();
      await connection.connect();
      
      const chan = connection.openChannel();
      
      // Run ping test
      await chan.write('/ping', [
        '=address=' + host,
        '=count=' + count
      ]);
      
      const pingResults = await chan.read();
      connection.close();
      
      // Calculate statistics
      const sent = pingResults.length;
      const received = pingResults.filter(p => p.status === 'echo reply').length;
      const packetLoss = sent > 0 ? ((sent - received) / sent) * 100 : 0;
      
      // Calculate average response time
      const responseTimes = pingResults
        .filter(p => p.time)
        .map(p => parseFloat(p.time));
      
      const avgResponseTime = responseTimes.length > 0 ?
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length :
        0;
      
      return {
        host,
        sent,
        received,
        packetLoss: packetLoss.toFixed(2),
        avgResponseTime: avgResponseTime.toFixed(2),
        results: pingResults,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error running ping test:', error);
      return {
        host,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Run traceroute to a specific host
  async runTraceroute(host) {
    try {
      const connection = initMikrotikConnection();
      await connection.connect();
      
      const chan = connection.openChannel();
      
      // Run traceroute
      await chan.write('/tool/traceroute', [
        '=address=' + host,
        '=count=1'
      ]);
      
      const traceResults = await chan.read();
      connection.close();
      
      return {
        host,
        hops: traceResults.map((hop, index) => ({
          hop: index + 1,
          address: hop.address,
          status: hop.status,
          time: hop.time
        })),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error running traceroute:', error);
      return {
        host,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Get current threshold settings
  getThresholds() {
    return { ...this.thresholds };
  }

  // Update threshold settings
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    return this.thresholds;
  }

  // Get current monitoring status
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastUpdate: this.deviceStatus.timestamp || null,
      thresholds: this.thresholds
    };
  }
}

module.exports = NetworkMonitor;