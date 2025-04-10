/**
 * Network Monitor Controller
 * Handles network monitoring operations and API endpoints
 */

const NetworkMonitor = require('../services/network-monitor');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Create a singleton instance of the network monitor
const networkMonitor = new NetworkMonitor();

// Start network monitoring
const startMonitoring = async (req, res) => {
  try {
    // Get interval from request body or from settings
    const { interval } = req.body;
    let intervalMs = interval ? parseInt(interval) * 1000 : 60000; // Default to 60 seconds
    
    // Try to get interval from settings if not provided in request
    if (!interval) {
      const Settings = require('../models/settings.model');
      const deviceSettings = await Settings.findOne({ where: { key: 'network_device_settings' } });
      if (deviceSettings && deviceSettings.value && deviceSettings.value.monitoringInterval) {
        intervalMs = parseInt(deviceSettings.value.monitoringInterval) * 1000;
      }
    }
    
    const result = await networkMonitor.startMonitoring(intervalMs);
    res.json(result);
  } catch (error) {
    console.error('Error starting network monitoring:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error starting network monitoring', 
      error: error.message 
    });
  }
};

// Stop network monitoring
const stopMonitoring = (req, res) => {
  try {
    const result = networkMonitor.stopMonitoring();
    res.json(result);
  } catch (error) {
    console.error('Error stopping network monitoring:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error stopping network monitoring', 
      error: error.message 
    });
  }
};

// Get current monitoring status
const getMonitoringStatus = (req, res) => {
  try {
    const status = networkMonitor.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting monitoring status:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error getting monitoring status', 
      error: error.message 
    });
  }
};

// Get latest monitoring data
const getMonitoringData = (req, res) => {
  try {
    const data = networkMonitor.deviceStatus;
    
    if (!data || !data.timestamp) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'No monitoring data available. Start monitoring first.' 
      });
    }
    
    res.json({
      status: 'success',
      data
    });
  } catch (error) {
    console.error('Error getting monitoring data:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error getting monitoring data', 
      error: error.message 
    });
  }
};

// Run ping test to a specific host
const runPingTest = async (req, res) => {
  try {
    const { host, count } = req.body;
    
    if (!host) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Host parameter is required' 
      });
    }
    
    const pingCount = count ? parseInt(count) : 5;
    const result = await networkMonitor.runPingTest(host, pingCount);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error running ping test:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error running ping test', 
      error: error.message 
    });
  }
};

// Run traceroute to a specific host
const runTraceroute = async (req, res) => {
  try {
    const { host } = req.body;
    
    if (!host) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Host parameter is required' 
      });
    }
    
    const result = await networkMonitor.runTraceroute(host);
    
    res.json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Error running traceroute:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error running traceroute', 
      error: error.message 
    });
  }
};

// Update monitoring thresholds
const updateThresholds = (req, res) => {
  try {
    const newThresholds = req.body;
    
    if (!newThresholds || Object.keys(newThresholds).length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No threshold values provided' 
      });
    }
    
    const updatedThresholds = networkMonitor.updateThresholds(newThresholds);
    
    res.json({
      status: 'success',
      message: 'Thresholds updated successfully',
      data: updatedThresholds
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error updating thresholds', 
      error: error.message 
    });
  }
};

// Set up event listeners for the network monitor
const setupEventListeners = (io) => {
  // Real-time monitoring data updates
  networkMonitor.on('monitoring_data', (data) => {
    io.emit('network_monitoring_update', data);
  });
  
  // Critical issue alerts
  networkMonitor.on('critical_issue', (issue) => {
    io.emit('network_critical_issue', issue);
  });
  
  // Monitoring errors
  networkMonitor.on('monitoring_error', (error) => {
    io.emit('network_monitoring_error', error);
  });
};

module.exports = {
  startMonitoring,
  stopMonitoring,
  getMonitoringStatus,
  getMonitoringData,
  runPingTest,
  runTraceroute,
  updateThresholds,
  setupEventListeners,
  networkMonitor
};