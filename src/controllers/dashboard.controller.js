/**
 * Dashboard Controller
 * Handles dashboard statistics and metrics
 */

const Customer = require('../models/customer.model');
const Payment = require('../models/payment.model');
const Invoice = require('../models/invoice.model');
const { Op } = require('sequelize');
const { monitorAllConnections, monitorNetworkDevices } = require('../services/network.service');

/**
 * Get dashboard statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get active connections count
    const connections = await monitorAllConnections();
    const activeConnections = connections.length;
    
    // Get total devices count
    const devices = await monitorNetworkDevices();
    const totalDevices = devices.length;
    
    // Calculate network health (dummy implementation)
    const networkHealth = 95; // 95% health
    
    // Calculate bandwidth usage (dummy implementation)
    const bandwidthUsage = 1024 * 1024 * 256; // 256 MB
    
    // Get top 5 devices for the table
    const topDevices = devices
      .sort((a, b) => b.bandwidthUsage - a.bandwidthUsage)
      .slice(0, 5)
      .map(device => ({
        name: device.name,
        ipAddress: device.ipAddress,
        status: device.status,
        lastSeen: device.lastSeen,
        bandwidthUsage: device.bandwidthUsage
      }));
    
    res.json({
      networkHealth,
      activeConnections,
      totalDevices,
      bandwidthUsage,
      devices: topDevices
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

module.exports = {
  getDashboardStats
};