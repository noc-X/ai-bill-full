/**
 * Network Controller
 * Handles network-related API endpoints
 */

const { monitorAllConnections, monitorNetworkDevices } = require('../services/network.service');

/**
 * Get bandwidth usage data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBandwidthUsage = async (req, res) => {
  try {
    const { period } = req.query;
    
    // Generate time labels based on period
    const labels = [];
    const downloadData = [];
    const uploadData = [];
    
    // Generate dummy data based on period
    const dataPoints = period === 'day' ? 24 : period === 'week' ? 7 : 30;
    
    for (let i = 0; i < dataPoints; i++) {
      // Generate labels
      if (period === 'day') {
        labels.push(`${i}:00`);
      } else if (period === 'week') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        labels.push(days[i % 7]);
      } else {
        labels.push(`Day ${i+1}`);
      }
      
      // Generate random data
      downloadData.push(Math.floor(Math.random() * 500) * 1024 * 1024); // Random MB in bytes
      uploadData.push(Math.floor(Math.random() * 200) * 1024 * 1024); // Random MB in bytes
    }
    
    res.json({
      labels,
      download: downloadData,
      upload: uploadData
    });
  } catch (error) {
    console.error('Error fetching bandwidth usage:', error);
    res.status(500).json({ message: 'Error fetching bandwidth usage', error: error.message });
  }
};

/**
 * Get top bandwidth consumers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopConsumers = async (req, res) => {
  try {
    // Get all network devices
    const devices = await monitorNetworkDevices();
    
    // Sort by bandwidth usage and take top 5
    const topConsumers = devices
      .sort((a, b) => b.bandwidthUsage - a.bandwidthUsage)
      .slice(0, 5);
    
    // Format data for chart
    const labels = topConsumers.map(device => device.name);
    const usage = topConsumers.map(device => device.bandwidthUsage);
    
    res.json({
      labels,
      usage
    });
  } catch (error) {
    console.error('Error fetching top consumers:', error);
    res.status(500).json({ message: 'Error fetching top consumers', error: error.message });
  }
};

module.exports = {
  getBandwidthUsage,
  getTopConsumers
};