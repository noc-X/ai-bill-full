const express = require('express');
const router = express.Router();
const { 
  checkNetworkStatus, 
  monitorAllConnections, 
  troubleshootConnection, 
  createNetworkMonitoringJob,
  manageBandwidth,
  getNetworkHealthMetrics,
  generateServiceQualityReport,
  monitorNetworkDevices,
  getBandwidthUsageStats
} = require('../services/network.service');
const { getBandwidthUsage, getTopConsumers } = require('../controllers/network.controller');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Get network status for a specific customer
router.get('/status/:username', authenticateJWT, async (req, res) => {
  try {
    const { username } = req.params;
    const status = await checkNetworkStatus(username);
    res.json(status);
  } catch (error) {
    console.error('Error fetching network status:', error);
    res.status(500).json({ message: 'Error fetching network status', error: error.message });
  }
});

// Get all active connections (admin/technician only)
router.get('/connections', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const connections = await monitorAllConnections();
    res.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Error fetching connections', error: error.message });
  }
});

// Get bandwidth usage data
router.get('/bandwidth-usage', authenticateJWT, getBandwidthUsage);

// Get top bandwidth consumers
router.get('/top-consumers', authenticateJWT, getTopConsumers);

// Get network topology data
router.get('/topology', authenticateJWT, isTechnician, async (req, res) => {
  try {
    // Get network devices and their connections
    const devices = await monitorNetworkDevices();
    
    // Create a topology representation
    const nodes = [];
    const edges = [];
    
    // Add main router
    nodes.push({ id: 'router', label: 'Main Router', type: 'router' });
    
    // Add switches and access points
    devices.devices.interfaces.forEach(device => {
      if (device.type === 'ether' || device.type === 'bridge') {
        nodes.push({
          id: device.name,
          label: device.name,
          type: 'switch',
          status: device.status
        });
        
        // Connect to main router
        edges.push({ from: 'router', to: device.name });
      } else if (device.type === 'wlan') {
        nodes.push({
          id: device.name,
          label: device.name,
          type: 'ap',
          status: device.status
        });
        
        // Connect to main router
        edges.push({ from: 'router', to: device.name });
      }
    });
    
    // Add client devices
    devices.devices.connectedClients.forEach(client => {
      nodes.push({
        id: client.macAddress,
        label: client.hostname || client.macAddress,
        type: 'client',
        ipAddress: client.ipAddress,
        status: client.status
      });
      
      // Connect to an access point or switch (simplified model)
      if (nodes.find(n => n.type === 'ap')) {
        const ap = nodes.find(n => n.type === 'ap');
        edges.push({ from: ap.id, to: client.macAddress });
      } else {
        edges.push({ from: 'router', to: client.macAddress });
      }
    });
    
    res.json({ nodes, edges });
  } catch (error) {
    console.error('Error generating network topology:', error);
    res.status(500).json({ message: 'Error generating network topology', error: error.message });
  }
});

// Troubleshoot connection for a specific customer
router.get('/troubleshoot/:username', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const { username } = req.params;
    const troubleshootData = await troubleshootConnection(username);
    res.json(troubleshootData);
  } catch (error) {
    console.error('Error troubleshooting connection:', error);
    res.status(500).json({ message: 'Error troubleshooting connection', error: error.message });
  }
});

// Run network monitoring job (admin only)
router.post('/monitor', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const results = await createNetworkMonitoringJob();
    res.json({
      message: 'Network monitoring job completed successfully',
      results
    });
  } catch (error) {
    console.error('Error running network monitoring job:', error);
    res.status(500).json({ message: 'Error running network monitoring job', error: error.message });
  }
});

// Manage bandwidth for a customer (admin/technician only)
router.post('/bandwidth/:username', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const { username } = req.params;
    const { uploadLimit, downloadLimit } = req.body;
    
    if (!uploadLimit || !downloadLimit) {
      return res.status(400).json({ message: 'Upload and download limits are required' });
    }
    
    const result = await manageBandwidth(username, uploadLimit, downloadLimit);
    res.json(result);
  } catch (error) {
    console.error('Error managing bandwidth:', error);
    res.status(500).json({ message: 'Error managing bandwidth', error: error.message });
  }
});

// Get network health metrics (admin only)
router.get('/health', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const healthMetrics = await getNetworkHealthMetrics();
    res.json(healthMetrics);
  } catch (error) {
    console.error('Error fetching network health metrics:', error);
    res.status(500).json({ message: 'Error fetching network health metrics', error: error.message });
  }
});

// Generate service quality report (admin only)
router.get('/quality-report', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { timeframe } = req.query;
    const report = await generateServiceQualityReport(timeframe || 'daily');
    res.json(report);
  } catch (error) {
    console.error('Error generating service quality report:', error);
    res.status(500).json({ message: 'Error generating service quality report', error: error.message });
  }
});

// Get network devices status (admin/technician only)
router.get('/devices', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const devices = await monitorNetworkDevices();
    res.json(devices);
  } catch (error) {
    console.error('Error monitoring network devices:', error);
    res.status(500).json({ message: 'Error monitoring network devices', error: error.message });
  }
});

// Get bandwidth usage statistics (admin only)
router.get('/bandwidth-stats', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { period } = req.query;
    const stats = await getBandwidthUsageStats(period || 'day');
    res.json(stats);
  } catch (error) {
    console.error('Error getting bandwidth usage statistics:', error);
    res.status(500).json({ message: 'Error getting bandwidth usage statistics', error: error.message });
  }
});

module.exports = router;