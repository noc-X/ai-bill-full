const NetworkDevice = require('../models/network-device.model');
const NetworkMonitor = require('../services/network-monitor');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Get all network devices
const getAllDevices = async (req, res) => {
  try {
    const devices = await NetworkDevice.findAll();
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error fetching devices', 
      error: error.message 
    });
  }
};

// Get a single device by ID
const getDeviceById = async (req, res) => {
  try {
    const device = await NetworkDevice.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Device not found' 
      });
    }
    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error fetching device', 
      error: error.message 
    });
  }
};

// Create a new device
const createDevice = async (req, res) => {
  try {
    const device = await NetworkDevice.create(req.body);
    res.status(201).json(device);
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error creating device', 
      error: error.message 
    });
  }
};

// Update a device
const updateDevice = async (req, res) => {
  try {
    const device = await NetworkDevice.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Device not found' 
      });
    }
    await device.update(req.body);
    res.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error updating device', 
      error: error.message 
    });
  }
};

// Delete a device
const deleteDevice = async (req, res) => {
  try {
    const device = await NetworkDevice.findByPk(req.params.id);
    if (!device) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Device not found' 
      });
    }
    await device.destroy();
    res.json({ 
      status: 'success', 
      message: 'Device deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error deleting device', 
      error: error.message 
    });
  }
};

// Update device status
const updateDeviceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cpuLoad, memoryUsage, temperature, uptime } = req.body;
    
    const device = await NetworkDevice.findByPk(id);
    if (!device) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Device not found' 
      });
    }
    
    await device.update({
      status,
      cpuLoad,
      memoryUsage,
      temperature,
      uptime,
      lastSeen: new Date()
    });
    
    res.json(device);
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error updating device status', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  updateDeviceStatus
};