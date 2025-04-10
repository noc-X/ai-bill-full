const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth.middleware');
const NetworkDevice = require('../models/network-device.model');
const { processAIResponse } = require('../services/ai.service');
const { analyzeDeviceIssue, generateDeviceResponse } = require('../services/device-rag.service');

// Route untuk menangani pesan WhatsApp
router.post('/whatsapp-message', authenticateJWT, async (req, res) => {
  try {
    const { message, customerId, deviceId } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    
    // Persiapkan konteks untuk routing
    const context = {
      customerId,
      deviceId
    };
    
    // Jika ada deviceId, validasi perangkat
    if (deviceId) {
      const device = await NetworkDevice.findByPk(deviceId);
      if (!device) {
        return res.status(404).json({ message: 'Device not found' });
      }
    }
    
    // Deteksi apakah permintaan terkait perangkat/jaringan
    const deviceKeywords = [
      'router', 'modem', 'perangkat', 'device',
      'sinyal', 'signal', 'koneksi', 'connection',
      'wifi', 'wireless', 'internet', 'network',
      'bandwidth', 'speed', 'kecepatan'
    ];
    
    const isDeviceRelated = deviceKeywords.some(keyword => message.toLowerCase().includes(keyword));
    
    let response;
    if (isDeviceRelated && context.deviceId) {
      // Gunakan RAG service untuk masalah perangkat
      const analysis = await analyzeDeviceIssue(context.deviceId, message);
      response = await generateDeviceResponse(context.deviceId, analysis);
    } else {
      // Gunakan AI service untuk layanan CS
      response = await processAIResponse(message, context);
    }
    res.json(response);
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    res.status(500).json({ message: 'Error processing message', error: error.message });
  }
});

module.exports = router;