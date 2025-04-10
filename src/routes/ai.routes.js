const express = require('express');
const router = express.Router();
const { processAIResponse, analyzeNetworkIssue, generateCustomerNotification, analyzeBillingData, analyzeNetworkMonitoringData } = require('../services/ai.service');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');
const Customer = require('../models/customer.model');
const { getNetworkHealthMetrics, monitorAllConnections, monitorNetworkDevices, getBandwidthUsageStats } = require('../services/network.service');

// Analyze network issue for a specific customer
router.get('/network-analysis/:username', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const { username } = req.params;
    const analysis = await analyzeNetworkIssue(username);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing network issue:', error);
    res.status(500).json({ message: 'Error analyzing network issue', error: error.message });
  }
});

// Generate customer notification
router.post('/notification', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { customerId, notificationType, additionalData } = req.body;
    
    if (!customerId || !notificationType) {
      return res.status(400).json({ message: 'Customer ID and notification type are required' });
    }
    
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const notification = await generateCustomerNotification(customer, notificationType, additionalData || {});
    res.json(notification);
  } catch (error) {
    console.error('Error generating notification:', error);
    res.status(500).json({ message: 'Error generating notification', error: error.message });
  }
});

// Process customer message (for testing AI responses)
router.post('/process-message', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { customerId, message } = req.body;
    
    if (!customerId || !message) {
      return res.status(400).json({ message: 'Customer ID and message are required' });
    }
    
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const response = await processAIResponse(message, customer);
    res.json(response);
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({ message: 'Error processing message', error: error.message });
  }
});

// Analyze billing data for a customer
router.get('/billing-analysis/:customerId', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { customerId } = req.params;
    const analysis = await analyzeBillingData(customerId);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing billing data:', error);
    res.status(500).json({ message: 'Error analyzing billing data', error: error.message });
  }
});

// Analyze network monitoring data
router.get('/network-monitoring-analysis', authenticateJWT, isAdmin, async (req, res) => {
  try {
    // Gather all network monitoring data
    const healthMetrics = await getNetworkHealthMetrics();
    const activeConnections = await monitorAllConnections();
    const deviceStatus = await monitorNetworkDevices();
    const bandwidthUsage = await getBandwidthUsageStats('day');
    
    // Combine all data for analysis
    const monitoringData = {
      healthMetrics,
      activeConnections,
      deviceStatus,
      bandwidthUsage
    };
    
    // Analyze the data with AI
    const analysis = await analyzeNetworkMonitoringData(monitoringData);
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing network monitoring data:', error);
    res.status(500).json({ message: 'Error analyzing network monitoring data', error: error.message });
  }
});

module.exports = router;