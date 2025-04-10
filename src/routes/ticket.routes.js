const express = require('express');
const router = express.Router();
const Ticket = require('../models/ticket.model');
const Customer = require('../models/customer.model');
const { authenticateJWT, isAdmin, isTechnician } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// Get all tickets
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const tickets = await Ticket.findAll({
      include: [{ model: Customer }],
      order: [['createdAt', 'DESC']]
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

// Get ticket by ID
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id, {
      include: [{ model: Customer }]
    });
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ message: 'Error fetching ticket', error: error.message });
  }
});

// Create new ticket
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const {
      customerId,
      subject,
      description,
      category,
      priority,
      source
    } = req.body;
    
    // Validate required fields
    if (!customerId || !subject || !description || !category) {
      return res.status(400).json({ message: 'Customer ID, subject, description, and category are required' });
    }
    
    // Check if customer exists
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}`;
    
    // Create ticket
    const newTicket = await Ticket.create({
      ticketNumber,
      customerId,
      subject,
      description,
      category,
      priority: priority || 'medium',
      source: source || 'manual',
      status: 'open',
      assignedTo: null,
      resolution: null,
      closedAt: null
    });
    
    // Notify via Socket.io if available
    if (req.io) {
      req.io.emit('new:ticket', { ticket: newTicket });
    }
    
    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: newTicket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Error creating ticket', error: error.message });
  }
});

// Update ticket
router.put('/:id', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const {
      status,
      priority,
      assignedTo,
      resolution,
      notes
    } = req.body;
    
    // Update ticket
    const updates = {};
    
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (resolution) updates.resolution = resolution;
    if (notes) updates.notes = notes;
    
    // If status is being changed to 'closed', set closedAt
    if (status === 'closed' && ticket.status !== 'closed') {
      updates.closedAt = new Date();
    }
    
    await ticket.update(updates);
    
    // Notify via Socket.io if available
    if (req.io) {
      req.io.emit('update:ticket', { ticket });
    }
    
    res.json({
      message: 'Ticket updated successfully',
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ message: 'Error updating ticket', error: error.message });
  }
});

// Get tickets by status
router.get('/status/:status', authenticateJWT, async (req, res) => {
  try {
    const { status } = req.params;
    
    const tickets = await Ticket.findAll({
      where: { status },
      include: [{ model: Customer }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets by status:', error);
    res.status(500).json({ message: 'Error fetching tickets by status', error: error.message });
  }
});

// Get tickets by customer
router.get('/customer/:customerId', authenticateJWT, async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const tickets = await Ticket.findAll({
      where: { customerId },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    res.status(500).json({ message: 'Error fetching customer tickets', error: error.message });
  }
});

// Get tickets assigned to technician
router.get('/assigned/:technicianId', authenticateJWT, isTechnician, async (req, res) => {
  try {
    const { technicianId } = req.params;
    
    const tickets = await Ticket.findAll({
      where: { 
        assignedTo: technicianId,
        status: {
          [Op.ne]: 'closed'
        }
      },
      include: [{ model: Customer }],
      order: [['priority', 'DESC'], ['createdAt', 'ASC']]
    });
    
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching assigned tickets:', error);
    res.status(500).json({ message: 'Error fetching assigned tickets', error: error.message });
  }
});

// Add comment to ticket
router.post('/:id/comments', authenticateJWT, async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }
    
    // Add comment to ticket
    // Note: This assumes there's a comments field in the Ticket model
    // If not, you would need to create a separate TicketComment model
    const comments = ticket.comments || [];
    comments.push({
      userId: req.user.id,
      userName: req.user.name,
      comment,
      timestamp: new Date()
    });
    
    await ticket.update({ comments });
    
    res.json({
      message: 'Comment added successfully',
      ticket
    });
  } catch (error) {
    console.error('Error adding comment to ticket:', error);
    res.status(500).json({ message: 'Error adding comment to ticket', error: error.message });
  }
});

module.exports = router;