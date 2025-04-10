const express = require('express');
const router = express.Router();
const Payment = require('../models/payment.model');
const Invoice = require('../models/invoice.model');
const Customer = require('../models/customer.model');
const { authenticateJWT, isAdmin, isFinance, isCollector } = require('../middleware/auth.middleware');
const { sendPaymentNotification } = require('../services/billing.service');
const { getPaymentStats, getRevenueData } = require('../controllers/payment.controller');
const { Op } = require('sequelize');

// Get payment statistics
router.get('/stats', authenticateJWT, getPaymentStats);

// Get revenue data for chart
router.get('/revenue', authenticateJWT, getRevenueData);

// Approve payment
router.post('/:id/approve', authenticateJWT, isFinance, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Invoice, include: [{ model: Customer }] }]
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Payment is not in pending approval status' });
    }
    
    // Update payment status
    await payment.update({
      status: 'completed',
      approvedById: req.user.id,
      approvedAt: new Date()
    });
    
    // Update invoice status
    await payment.Invoice.update({
      status: 'paid',
      paymentDate: payment.paymentDate
    });
    
    // If customer was suspended, reactivate their service
    if (payment.Invoice.Customer.status === 'suspended') {
      await payment.Invoice.Customer.update({ status: 'active' });
    }
    
    // Send payment confirmation
    await sendPaymentNotification(payment.invoiceId, 'payment_confirmation');
    
    res.json({
      message: 'Payment approved successfully',
      payment
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ message: 'Error approving payment', error: error.message });
  }
});

// Get all payments
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [{ model: Invoice, include: [{ model: Customer }] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

// Get payment by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{ model: Invoice, include: [{ model: Customer }] }]
    });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
});

// Create new payment
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod,
      paymentDate,
      receiptNumber,
      notes
    } = req.body;
    
    // Validate required fields
    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Invoice ID, amount, and payment method are required' });
    }
    
    // Check if invoice exists
    const invoice = await Invoice.findByPk(invoiceId, {
      include: [{ model: Customer }]
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Check if payment amount is valid
    if (amount < invoice.totalAmount) {
      return res.status(400).json({ message: 'Payment amount must be at least the total invoice amount' });
    }
    
    // Set initial status based on user role
    let initialStatus = 'pending_approval';
    if (req.user.role === 'admin' || req.user.role === 'finance') {
      initialStatus = 'completed';
    }
    
    // Create payment
    const newPayment = await Payment.create({
      invoiceId,
      customerId: invoice.customerId,
      amount,
      paymentMethod,
      paymentDate: paymentDate || new Date(),
      receiptNumber,
      notes,
      status: initialStatus,
      processedById: req.user.id,
      processedByRole: req.user.role,
      approvedById: initialStatus === 'completed' ? req.user.id : null,
      approvedAt: initialStatus === 'completed' ? new Date() : null
    });
    
    // Only update invoice status if payment is completed
    if (initialStatus === 'completed') {
      await invoice.update({
        status: 'paid',
        paymentDate: paymentDate || new Date()
      });
      
      // If customer was suspended due to non-payment, reactivate their service
      if (invoice.Customer.status === 'suspended') {
        await invoice.Customer.update({ status: 'active' });
      }
      
      // Send payment confirmation to customer
      await sendPaymentNotification(invoiceId, 'payment_confirmation');
    }
    
    res.status(201).json({
      message: initialStatus === 'completed' ? 'Payment processed successfully' : 'Payment recorded and pending approval',
      payment: newPayment
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Error processing payment', error: error.message });
  }
});

// Update payment
router.put('/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    const {
      paymentMethod,
      paymentDate,
      receiptNumber,
      notes,
      status
    } = req.body;
    
    // Update payment
    await payment.update({
      paymentMethod: paymentMethod || payment.paymentMethod,
      paymentDate: paymentDate || payment.paymentDate,
      receiptNumber: receiptNumber || payment.receiptNumber,
      notes: notes !== undefined ? notes : payment.notes,
      status: status || payment.status
    });
    
    res.json({
      message: 'Payment updated successfully',
      payment
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Error updating payment', error: error.message });
  }
});

module.exports = router;