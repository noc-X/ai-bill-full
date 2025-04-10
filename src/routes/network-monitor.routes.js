/**
 * Network Monitor Routes
 * API endpoints for real-time network monitoring
 */

const express = require('express');
const router = express.Router();
const {
  startMonitoring,
  stopMonitoring,
  getMonitoringStatus,
  getMonitoringData,
  runPingTest,
  runTraceroute,
  updateThresholds
} = require('../controllers/network-monitor.controller');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Start network monitoring (admin only)
router.post('/start', authenticateJWT, isAdmin, startMonitoring);

// Stop network monitoring (admin only)
router.post('/stop', authenticateJWT, isAdmin, stopMonitoring);

// Get current monitoring status
router.get('/status', authenticateJWT, isTechnician, getMonitoringStatus);

// Get latest monitoring data
router.get('/data', authenticateJWT, isTechnician, getMonitoringData);

// Run ping test to a specific host
router.post('/ping', authenticateJWT, isTechnician, runPingTest);

// Run traceroute to a specific host
router.post('/traceroute', authenticateJWT, isTechnician, runTraceroute);

// Update monitoring thresholds (admin only)
router.post('/thresholds', authenticateJWT, isAdmin, updateThresholds);

module.exports = router;