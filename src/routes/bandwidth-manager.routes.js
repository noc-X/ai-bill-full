const express = require('express');
const router = express.Router();
const { 
  applyBandwidthLimit, 
  applyQoSProfile, 
  syncAllCustomerBandwidthLimits,
  temporaryBandwidthBoost
} = require('../services/bandwidth-manager');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');

// Apply bandwidth limit for a specific customer
router.post('/limit/:username', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const { username } = req.params;
    const { downloadLimit, uploadLimit } = req.body;
    
    if (!downloadLimit || !uploadLimit) {
      return res.status(400).json({ message: 'Download and upload limits are required' });
    }
    
    const result = await applyBandwidthLimit(username, downloadLimit, uploadLimit);
    res.json(result);
  } catch (error) {
    console.error('Error applying bandwidth limit:', error);
    res.status(500).json({ message: 'Error applying bandwidth limit', error: error.message });
  }
});

// Apply QoS profile for a specific customer
router.post('/qos/:username', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const { username } = req.params;
    const { qosProfile } = req.body;
    
    if (!qosProfile) {
      return res.status(400).json({ message: 'QoS profile is required' });
    }
    
    const result = await applyQoSProfile(username, qosProfile);
    res.json(result);
  } catch (error) {
    console.error('Error applying QoS profile:', error);
    res.status(500).json({ message: 'Error applying QoS profile', error: error.message });
  }
});

// Sync all customer bandwidth limits with their packages
router.post('/sync', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const result = await syncAllCustomerBandwidthLimits();
    res.json(result);
  } catch (error) {
    console.error('Error syncing bandwidth limits:', error);
    res.status(500).json({ message: 'Error syncing bandwidth limits', error: error.message });
  }
});

// Temporarily boost bandwidth for a specific customer
router.post('/boost/:username', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const { username } = req.params;
    const { downloadBoost, uploadBoost, durationMinutes } = req.body;
    
    if (!downloadBoost || !uploadBoost || !durationMinutes) {
      return res.status(400).json({ 
        message: 'Download boost, upload boost, and duration minutes are required' 
      });
    }
    
    const result = await temporaryBandwidthBoost(
      username, 
      downloadBoost, 
      uploadBoost, 
      durationMinutes
    );
    res.json(result);
  } catch (error) {
    console.error('Error applying temporary bandwidth boost:', error);
    res.status(500).json({ 
      message: 'Error applying temporary bandwidth boost', 
      error: error.message 
    });
  }
});

module.exports = router;