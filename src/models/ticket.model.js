const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('connection_issue', 'billing_inquiry', 'technical_support', 'service_request', 'other'),
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  assignedToId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  source: {
    type: DataTypes.ENUM('whatsapp', 'email', 'phone', 'web', 'ai_monitoring'),
    defaultValue: 'whatsapp'
  },
  // For attachments and comments, we'll create separate models and establish relationships
  // This is a simplified approach for now
  attachmentsData: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  commentsData: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  resolutionDetails: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['customerId', 'status']
    },
    {
      fields: ['ticketNumber']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = Ticket;