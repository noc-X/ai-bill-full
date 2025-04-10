const express = require('express');
const router = express.Router();
const Customer = require('../models/customer.model');
const Package = require('../models/package.model');
const Invoice = require('../models/invoice.model');
const { authenticateJWT, isAdmin } = require('../middleware/auth.middleware');
const { manageBandwidth } = require('../services/network.service');
const { Op } = require('sequelize');

// Get all customers
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const customers = await Customer.findAll({
      include: [{ model: Package }]
    });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

// Get customer by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      include: [{ model: Package }]
    });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
});

// Create new customer
router.post('/', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      pppoeUsername,
      pppoePassword,
      packageId,
      installationDate,
      billingDay,
      locationLat,
      locationLng,
      notes
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !phone || !address || !pppoeUsername || !pppoePassword || !packageId || !installationDate || !billingDay) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }
    
    // Check if package exists
    const package = await Package.findByPk(packageId);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    
    // Create customer
    const newCustomer = await Customer.create({
      name,
      email,
      phone,
      address,
      pppoeUsername,
      pppoePassword,
      packageId,
      installationDate,
      billingDay,
      locationLat: locationLat || null,
      locationLng: locationLng || null,
      notes: notes || null,
      status: 'active'
    });
    
    // Set bandwidth limits in Mikrotik
    await manageBandwidth(pppoeUsername, package.uploadSpeed, package.downloadSpeed);
    
    res.status(201).json({
      message: 'Customer created successfully',
      customer: newCustomer
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Error creating customer', error: error.message });
  }
});

// Update customer
router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const {
      name,
      email,
      phone,
      address,
      pppoeUsername,
      pppoePassword,
      packageId,
      billingDay,
      status,
      locationLat,
      locationLng,
      notes
    } = req.body;
    
    // Update customer
    await customer.update({
      name: name || customer.name,
      email: email || customer.email,
      phone: phone || customer.phone,
      address: address || customer.address,
      pppoeUsername: pppoeUsername || customer.pppoeUsername,
      pppoePassword: pppoePassword || customer.pppoePassword,
      packageId: packageId || customer.packageId,
      billingDay: billingDay || customer.billingDay,
      status: status || customer.status,
      locationLat: locationLat !== undefined ? locationLat : customer.locationLat,
      locationLng: locationLng !== undefined ? locationLng : customer.locationLng,
      notes: notes !== undefined ? notes : customer.notes
    });
    
    // If package changed, update bandwidth limits
    if (packageId && packageId !== customer.packageId) {
      const package = await Package.findByPk(packageId);
      if (package) {
        await manageBandwidth(customer.pppoeUsername, package.uploadSpeed, package.downloadSpeed);
      }
    }
    
    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
});

// Delete customer
router.delete('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    await customer.destroy();
    
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
});

// Get customer invoices
router.get('/:id/invoices', authenticateJWT, async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const invoices = await Invoice.findAll({
      where: { customerId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({ message: 'Error fetching customer invoices', error: error.message });
  }
});

// Get customers with overdue invoices
router.get('/status/overdue', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const customersWithOverdueInvoices = await Customer.findAll({
      include: [{
        model: Invoice,
        where: {
          status: 'overdue',
          dueDate: { [Op.lt]: new Date() }
        }
      }, { model: Package }]
    });
    
    res.json(customersWithOverdueInvoices);
  } catch (error) {
    console.error('Error fetching customers with overdue invoices:', error);
    res.status(500).json({ message: 'Error fetching customers with overdue invoices', error: error.message });
  }
});

module.exports = router;