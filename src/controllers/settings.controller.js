const Settings = require('../models/settings.model');

// Get network settings
exports.getNetworkSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ where: { key: 'network_settings' } });
        res.json(settings ? settings.value : {});
    } catch (error) {
        console.error('Error loading network settings:', error);
        res.status(500).json({ message: 'Failed to load network settings' });
    }
};

// Save network settings
exports.saveNetworkSettings = async (req, res) => {
    try {
        await Settings.upsert({
            key: 'network_settings',
            value: req.body,
            category: 'network',
            description: 'Network configuration'
        });
        res.json({ message: 'Network settings saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save network settings' });
    }
};

// Get billing settings
exports.getBillingSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ where: { key: 'billing_settings' } });
        res.json(settings ? settings.value : {});
    } catch (error) {
        res.status(500).json({ message: 'Failed to load billing settings' });
    }
};

// Save billing settings
exports.saveBillingSettings = async (req, res) => {
    try {
        await Settings.upsert({
            key: 'billing_settings',
            value: req.body,
            category: 'billing',
            description: 'Billing configuration'
        });
        res.json({ message: 'Billing settings saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save billing settings' });
    }
};

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ where: { key: 'notification_settings' } });
        const value = settings ? settings.value : {};
        // Don't send password back to client
        delete value.emailPassword;
        res.json(value);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load notification settings' });
    }
};

// Save notification settings
exports.saveNotificationSettings = async (req, res) => {
    try {
        await Settings.upsert({
            key: 'notification_settings',
            value: req.body,
            category: 'notifications',
            description: 'Notification configuration'
        });
        res.json({ message: 'Notification settings saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save notification settings' });
    }
};

// Get AI settings
exports.getAISettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ where: { key: 'ai_settings' } });
        const value = settings ? settings.value : {};
        
        // Don't send API key back to client if it's masked
        if (value.apiKey && value.apiKey.startsWith('*****')) {
            delete value.apiKey;
        }
        
        res.json(value);
    } catch (error) {
        console.error('Error loading AI settings:', error);
        res.status(500).json({ message: 'Failed to load AI settings' });
    }
};

// Save AI settings
exports.saveAISettings = async (req, res) => {
    try {
        // Get existing settings to check if we need to preserve the API key
        const existingSettings = await Settings.findOne({ where: { key: 'ai_settings' } });
        let settingsToSave = { ...req.body };
        
        // If API key is not provided or is masked, use the existing one
        if (existingSettings && existingSettings.value && existingSettings.value.apiKey) {
            if (!settingsToSave.apiKey || settingsToSave.apiKey.startsWith('*****')) {
                settingsToSave.apiKey = existingSettings.value.apiKey;
            }
        }
        
        // Save the settings
        await Settings.upsert({
            key: 'ai_settings',
            value: settingsToSave,
            category: 'ai',
            description: 'AI service configuration'
        });
        
        res.json({ message: 'AI settings saved successfully' });
    } catch (error) {
        console.error('Error saving AI settings:', error);
        res.status(500).json({ message: 'Failed to save AI settings' });
    }
};

// Get Mikrotik settings
exports.getMikrotikSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ where: { key: 'mikrotik_settings' } });
        const value = settings ? settings.value : { routers: [] };
        // Don't send passwords back to client
        if (value.routers) {
            value.routers = value.routers.map(router => {
                const { password, ...routerWithoutPassword } = router;
                return routerWithoutPassword;
            });
        }
        res.json(value);
    } catch (error) {
        res.status(500).json({ message: 'Failed to load Mikrotik settings' });
    }
};

// Save Mikrotik settings
exports.saveMikrotikSettings = async (req, res) => {
    try {
        const { routers, ...otherSettings } = req.body;
        
        // Validate routers array
        if (!Array.isArray(routers)) {
            return res.status(400).json({ message: 'Routers must be an array' });
        }

        // Validate each router configuration
        for (const router of routers) {
            if (!router.name || !router.host || !router.port || !router.username) {
                return res.status(400).json({ 
                    message: 'Each router must have name, host, port, and username' 
                });
            }
        }

        await Settings.upsert({
            key: 'mikrotik_settings',
            value: { routers, ...otherSettings },
            category: 'network',
            description: 'Multiple Mikrotik routers configuration'
        });
        res.json({ message: 'Mikrotik settings saved successfully' });
    } catch (error) {
        console.error('Error saving Mikrotik settings:', error);
        res.status(500).json({ message: 'Failed to save Mikrotik settings' });
    }
};

// Get network device settings
exports.getNetworkDeviceSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne({ where: { key: 'network_device_settings' } });
        res.json(settings ? settings.value : { monitoringEnabled: false, monitoringInterval: 60 });
    } catch (error) {
        console.error('Error loading network device settings:', error);
        res.status(500).json({ message: 'Failed to load network device settings' });
    }
};

// Save network device settings
exports.saveNetworkDeviceSettings = async (req, res) => {
    try {
        await Settings.upsert({
            key: 'network_device_settings',
            value: req.body,
            category: 'network',
            description: 'Network device monitoring configuration'
        });
        res.json({ message: 'Network device settings saved successfully' });
    } catch (error) {
        console.error('Error saving network device settings:', error);
        res.status(500).json({ message: 'Failed to save network device settings' });
    }
};