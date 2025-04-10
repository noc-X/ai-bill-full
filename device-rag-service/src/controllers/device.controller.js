const ragService = require('../services/rag.service');
const fileProcessor = require('../services/file-processor.service');
const winston = require('winston');
const multer = require('multer');
const path = require('path');

const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.csv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, CSV, and TXT files are allowed.'));
    }
  }
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: process.env.LOG_FILE || 'logs/device.log' }),
    new winston.transports.Console()
  ]
});

class DeviceController {
  async analyzeDevice(req, res) {
    try {
      const { deviceId, issue } = req.body;

      if (!deviceId || !issue) {
        return res.status(400).json({
          status: 'error',
          message: 'Device ID and issue are required'
        });
      }

      const analysis = await ragService.analyzeDeviceIssue(deviceId, issue);
      
      logger.info(`Analysis generated for device ${deviceId}`);
      res.json({
        status: 'success',
        data: analysis
      });
    } catch (error) {
      logger.error('Error in device analysis:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  async generateResponse(req, res) {
    try {
      const { deviceId, analysis } = req.body;

      if (!deviceId || !analysis) {
        return res.status(400).json({
          status: 'error',
          message: 'Device ID and analysis are required'
        });
      }

      const response = await ragService.generateDeviceResponse(deviceId, analysis);
      
      logger.info(`Response generated for device ${deviceId}`);
      res.json({
        status: 'success',
        data: response
      });
    } catch (error) {
      logger.error('Error in response generation:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }

  async addKnowledge(req, res) {
    try {
      const { deviceId } = req.body;
      const file = req.file;

      if (!deviceId || !file) {
        return res.status(400).json({
          status: 'error',
          message: 'Device ID and file are required'
        });
      }

      // Process the uploaded file
      const processedContent = await fileProcessor.processFile(file.path);

      // Add the processed content to the knowledge base
      await ragService.addDeviceKnowledge(deviceId, processedContent);
      
      logger.info(`Knowledge added for device ${deviceId} from file ${file.originalname}`);
      res.json({
        status: 'success',
        message: 'Device knowledge added successfully from file'
      });
    } catch (error) {
      logger.error('Error adding device knowledge:', error);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  }
}

module.exports = new DeviceController();