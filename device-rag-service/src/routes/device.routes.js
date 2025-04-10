const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/device.controller');
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

// Endpoint untuk analisis perangkat
router.post('/analyze', deviceController.analyzeDevice);

// Endpoint untuk generasi respons
router.post('/response', deviceController.generateResponse);

// Endpoint untuk menambah pengetahuan perangkat dari file
router.post('/knowledge', upload.single('file'), deviceController.addKnowledge);

module.exports = router;