const express = require('express');
const router = express.Router();
const Package = require('../models/package.model');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');

// Get all packages
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const packages = await Package.findAll();
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ message: 'Error fetching packages', error: error.message });
  }
});

// Get package by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    res.json(package);
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ message: 'Error fetching package', error: error.message });
  }
});

// Create new package
router.post('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const {
      name,
      downloadSpeed,
      uploadSpeed,
      speedUnit,
      price,
      description,
      features,
      isActive
    } = req.body;
    
    // Validate required fields
    if (!name || !downloadSpeed || !uploadSpeed || !price) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    // Ensure features is properly formatted
    let processedFeatures = [];
    if (features) {
      if (Array.isArray(features)) {
        // Ensure each feature is a string
        processedFeatures = features.map(feature => String(feature)).filter(feature => feature.trim().length > 0);
      } else if (typeof features === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsed = JSON.parse(features);
          if (Array.isArray(parsed)) {
            processedFeatures = parsed.map(feature => String(feature)).filter(feature => feature.trim().length > 0);
          } else {
            processedFeatures = [String(parsed)];
          }
        } catch (e) {
          // If not a valid JSON, treat as a single feature
          if (features.trim().length > 0) {
            // Split by newline if it contains newlines
            if (features.includes('\n')) {
              processedFeatures = features.split('\n')
                .map(feature => feature.trim())
                .filter(feature => feature.length > 0);
            } else {
              processedFeatures = [features];
            }
          }
        }
      }
    }
    
    console.log('Features received:', features);
    console.log('Processed features:', processedFeatures);
    
    console.log('Creating package with data:', {
      name,
      downloadSpeed,
      uploadSpeed,
      speedUnit,
      price,
      description,
      features: processedFeatures,
      isActive
    });
    
    // Create package
    console.log('Attempting to create package in database');
    try {
      const newPackage = await Package.create({
        name,
        downloadSpeed,
        uploadSpeed,
        speedUnit: speedUnit || 'Mbps',
        price,
        description: description || null,
        features: processedFeatures,
        isActive: isActive !== undefined ? isActive : true
      });
      
      console.log('Package created successfully with ID:', newPackage.id);
      console.log('Package data in database:', newPackage.toJSON());
      
      res.status(201).json({
        message: 'Package created successfully',
        package: newPackage
      });
    } catch (dbError) {
      console.error('Database error creating package:', dbError);
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error creating package:', error);
    console.error('Request body:', req.body);
    
    // Check for specific error types
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors.map(e => ({ field: e.path, message: e.message })) 
      });
    }
    
    res.status(500).json({ message: 'Error creating package', error: error.message });
  }
});

// Update package
router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    const {
      name,
      downloadSpeed,
      uploadSpeed,
      speedUnit,
      price,
      description,
      features,
      isActive
    } = req.body;
    
    // Process features for update
    let processedFeatures = features;
    if (features && typeof features === 'string') {
      try {
        // Try to parse if it's a JSON string
        const parsed = JSON.parse(features);
        if (Array.isArray(parsed)) {
          processedFeatures = parsed.map(feature => String(feature)).filter(feature => feature.trim().length > 0);
        } else {
          processedFeatures = [String(parsed)];
        }
      } catch (e) {
        // If not a valid JSON, treat as a single feature or split by newlines
        if (features.trim().length > 0) {
          // Split by newline if it contains newlines
          if (features.includes('\n')) {
            processedFeatures = features.split('\n')
              .map(feature => feature.trim())
              .filter(feature => feature.length > 0);
          } else {
            processedFeatures = [features];
          }
        }
      }
    }
    
    console.log('Features received for update:', features);
    console.log('Processed features for update:', processedFeatures);
    
    // Update package
    console.log('Attempting to update package in database with ID:', package.id);
    try {
      await package.update({
        name: name || package.name,
        downloadSpeed: downloadSpeed || package.downloadSpeed,
        uploadSpeed: uploadSpeed || package.uploadSpeed,
        speedUnit: speedUnit || package.speedUnit,
        price: price || package.price,
        description: description !== undefined ? description : package.description,
        features: processedFeatures || package.features,
        isActive: isActive !== undefined ? isActive : package.isActive
      });
      
      console.log('Package updated successfully with ID:', package.id);
      console.log('Updated package data in database:', package.toJSON());
      
      res.json({
        message: 'Package updated successfully',
        package
      });
    } catch (dbError) {
      console.error('Database error updating package:', dbError);
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: 'Error updating package', error: error.message });
  }
});

// Delete package
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const package = await Package.findByPk(req.params.id);
    
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    await package.destroy();
    
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ message: 'Error deleting package', error: error.message });
  }
});

module.exports = router;