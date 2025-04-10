const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Invoices',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'bank_transfer', 'e-wallet', 'credit_card', 'other'),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('pending_approval', 'pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending_approval'
  },
  approvedById: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE
  },
  receiptNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  notes: {
    type: DataTypes.TEXT
  },
  processedById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  processedByRole: {
    type: DataTypes.ENUM('admin', 'technician', 'finance', 'collector'),
    allowNull: false
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['customerId', 'paymentDate']
    },
    {
      fields: ['invoiceId']
    }
  ]
});

module.exports = Payment;