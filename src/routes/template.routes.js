const express = require('express');
const router = express.Router();
const Settings = require('../models/settings.model');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Get all templates
router.get('/templates', authenticateJWT, async (req, res) => {
    try {
        const settings = await Settings.findOne({ where: { key: 'response_templates' } });
        res.json(settings ? settings.value : {});
    } catch (error) {
        res.status(500).json({ message: 'Failed to load templates' });
    }
});

// Save template
router.post('/templates', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { category, key, title, content, variables } = req.body;
        const settings = await Settings.findOne({ where: { key: 'response_templates' } });
        const templates = settings ? settings.value : {};

        // Initialize category if it doesn't exist
        if (!templates[category]) {
            templates[category] = {};
        }

        // Add or update template
        templates[category][key] = {
            title,
            content,
            variables
        };

        await Settings.upsert({
            key: 'response_templates',
            value: templates,
            category: 'ai',
            description: 'AI response templates'
        });

        res.json({ message: 'Template saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save template' });
    }
});

// Delete template
router.delete('/templates/:category/:key', authenticateJWT, isAdmin, async (req, res) => {
    try {
        const { category, key } = req.params;
        const settings = await Settings.findOne({ where: { key: 'response_templates' } });
        
        if (!settings || !settings.value[category] || !settings.value[category][key]) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const templates = settings.value;
        delete templates[category][key];

        // Remove category if empty
        if (Object.keys(templates[category]).length === 0) {
            delete templates[category];
        }

        await Settings.upsert({
            key: 'response_templates',
            value: templates,
            category: 'ai',
            description: 'AI response templates'
        });

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete template' });
    }
});

module.exports = router;