const NetworkDevice = require('../models/network-device.model');
const Ticket = require('../models/ticket.model');
const ragService = require('../../device-rag-service/src/services/rag.service');
const { logger } = require('../utils/logger');

class DeviceIntegrationService {
  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      await ragService.initializeCollections();
      logger.info('RAG service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize RAG service:', error);
      throw error;
    }
  }

  async syncDeviceData(deviceId) {
    try {
      const device = await NetworkDevice.findByPk(deviceId, {
        include: [{
          model: Ticket,
          where: { category: 'device_issue' },
          required: false
        }]
      });

      if (!device) {
        throw new Error('Device not found');
      }

      // Prepare device knowledge for RAG
      const deviceKnowledge = {
        deviceInfo: {
          id: device.id,
          name: device.name,
          type: device.type,
          ipAddress: device.ipAddress,
          status: device.status,
          location: device.location,
          lastSeen: device.lastSeen,
          cpuLoad: device.cpuLoad,
          memoryUsage: device.memoryUsage,
          temperature: device.temperature,
          uptime: device.uptime,
          firmware: device.firmware
        },
        issueHistory: device.Tickets.map(ticket => ({
          date: ticket.createdAt,
          description: ticket.description,
          resolution: ticket.resolution,
          status: ticket.status
        }))
      };

      // Add device knowledge to RAG system
      await ragService.addDeviceKnowledge(deviceId, deviceKnowledge);
      logger.info(`Device data synced successfully for device ${deviceId}`);

      return deviceKnowledge;
    } catch (error) {
      logger.error(`Failed to sync device data for ${deviceId}:`, error);
      throw error;
    }
  }

  async analyzeDeviceIssue(deviceId, issue) {
    try {
      // Sync latest device data before analysis
      await this.syncDeviceData(deviceId);

      // Get analysis from RAG service
      const analysis = await ragService.analyzeDeviceIssue(deviceId, issue);
      logger.info(`Analysis generated for device ${deviceId}`);

      return analysis;
    } catch (error) {
      logger.error(`Failed to analyze device issue for ${deviceId}:`, error);
      throw error;
    }
  }

  async generateResponse(deviceId, analysis) {
    try {
      const response = await ragService.generateDeviceResponse(deviceId, analysis);
      logger.info(`Response generated for device ${deviceId}`);

      return response;
    } catch (error) {
      logger.error(`Failed to generate response for ${deviceId}:`, error);
      throw error;
    }
  }
}

module.exports = new DeviceIntegrationService();