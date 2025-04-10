const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WhatsAppConnection = sequelize.define('WhatsAppConnection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  connectionStatus: {
    type: DataTypes.ENUM('connected', 'disconnected', 'pending'),
    defaultValue: 'disconnected'
  },
  lastConnected: {
    type: DataTypes.DATE
  },
  lastDisconnected: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true
});

module.exports = WhatsAppConnection;