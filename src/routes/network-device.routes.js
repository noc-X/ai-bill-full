const express = require('express');
const router = express.Router();
const { 
  getAllDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  updateDeviceStatus
} = require('../controllers/network-device.controller');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Get all network devices
router.get('/devices', authenticateJWT, getAllDevices);

// Get a single device
router.get('/devices/:id', authenticateJWT, getDeviceById);

// Create a new device (admin/technician only)
router.post('/devices', authenticateJWT, isTechnician, createDevice);

// Update a device (admin/technician only)
router.put('/devices/:id', authenticateJWT, isTechnician, updateDevice);

// Delete a device (admin only)
router.delete('/devices/:id', authenticateJWT, isAdmin, deleteDevice);

// Update device status
router.patch('/devices/:id/status', authenticateJWT, isTechnician, updateDeviceStatus);

module.exports = router;