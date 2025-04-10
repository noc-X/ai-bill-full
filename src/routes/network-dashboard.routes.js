/**
 * Network Dashboard Routes
 * API endpoints for network dashboard statistics and metrics
 */

const express = require('express');
const router = express.Router();
const { getBandwidthUsage, getTopConsumers } = require('../controllers/network.controller');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Get bandwidth usage data
router.get('/bandwidth-usage', authenticateJWT, getBandwidthUsage);

// Get top bandwidth consumers
router.get('/top-consumers', authenticateJWT, getTopConsumers);

module.exports = router;