/**
 * Dashboard Routes
 * API endpoints for dashboard statistics and metrics
 */

const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboard.controller');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Get dashboard statistics
router.get('/stats', authenticateJWT, getDashboardStats);

module.exports = router;