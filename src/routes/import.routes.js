const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');
const { importCustomersFromCSV, importCustomersFromExcel } = require('../database/migrations/import-customers');
const { Op } = require('sequelize');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only CSV and Excel files
    const filetypes = /csv|xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
});

// Import customers from file
router.post('/customers', authenticateJWT, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let result;
    
    if (fileExt === '.csv') {
      result = await importCustomersFromCSV(filePath);
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      result = await importCustomersFromExcel(filePath);
    } else {
      return res.status(400).json({ message: 'Unsupported file format' });
    }
    
    // Delete the file after processing
    fs.unlinkSync(filePath);
    
    res.json(result);
  } catch (error) {
    console.error('Error importing customers:', error);
    res.status(500).json({ message: 'Error importing customers', error: error.message });
  }
});

module.exports = router;