const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticateJWT } = require('../middleware/auth.middleware');

// Network Settings routes
router.get('/network', authenticateJWT, (req, res) => {
    if (typeof settingsController.getNetworkSettings === 'function') {
        return settingsController.getNetworkSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Network settings controller not properly implemented' });
    }
});
router.post('/network', authenticateJWT, (req, res) => {
    if (typeof settingsController.saveNetworkSettings === 'function') {
        return settingsController.saveNetworkSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Network settings controller not properly implemented' });
    }
});

// Billing Settings routes
router.get('/billing', authenticateJWT, (req, res) => {
    if (typeof settingsController.getBillingSettings === 'function') {
        return settingsController.getBillingSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Billing settings controller not properly implemented' });
    }
});
router.post('/billing', authenticateJWT, (req, res) => {
    if (typeof settingsController.saveBillingSettings === 'function') {
        return settingsController.saveBillingSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Billing settings controller not properly implemented' });
    }
});

// Notification Settings routes
router.get('/notifications', authenticateJWT, (req, res) => {
    if (typeof settingsController.getNotificationSettings === 'function') {
        return settingsController.getNotificationSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Notification settings controller not properly implemented' });
    }
});
router.post('/notifications', authenticateJWT, (req, res) => {
    if (typeof settingsController.saveNotificationSettings === 'function') {
        return settingsController.saveNotificationSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Notification settings controller not properly implemented' });
    }
});

// AI Settings routes
router.get('/ai', authenticateJWT, (req, res) => {
    if (typeof settingsController.getAISettings === 'function') {
        return settingsController.getAISettings(req, res);
    } else {
        return res.status(500).json({ message: 'AI settings controller not properly implemented' });
    }
});
router.post('/ai', authenticateJWT, (req, res) => {
    if (typeof settingsController.saveAISettings === 'function') {
        return settingsController.saveAISettings(req, res);
    } else {
        return res.status(500).json({ message: 'AI settings controller not properly implemented' });
    }
});

// Mikrotik Settings routes
router.get('/mikrotik', authenticateJWT, (req, res) => {
    if (typeof settingsController.getMikrotikSettings === 'function') {
        return settingsController.getMikrotikSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Mikrotik settings controller not properly implemented' });
    }
});
router.post('/mikrotik', authenticateJWT, (req, res) => {
    if (typeof settingsController.saveMikrotikSettings === 'function') {
        return settingsController.saveMikrotikSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Mikrotik settings controller not properly implemented' });
    }
});

// Network Device Settings routes
router.get('/network-device', authenticateJWT, (req, res) => {
    if (typeof settingsController.getNetworkDeviceSettings === 'function') {
        return settingsController.getNetworkDeviceSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Network device settings controller not properly implemented' });
    }
});
router.post('/network-device', authenticateJWT, (req, res) => {
    if (typeof settingsController.saveNetworkDeviceSettings === 'function') {
        return settingsController.saveNetworkDeviceSettings(req, res);
    } else {
        return res.status(500).json({ message: 'Network device settings controller not properly implemented' });
    }
});

// Templates routes - redirect to template routes
router.get('/templates', authenticateJWT, (req, res) => {
    res.redirect(307, '/api/templates');
});
router.post('/templates', authenticateJWT, (req, res) => {
    res.redirect(307, '/api/templates');
});
router.delete('/templates/:category/:key', authenticateJWT, (req, res) => {
    res.redirect(307, `/api/templates/${req.params.category}/${req.params.key}`);
});

module.exports = router;