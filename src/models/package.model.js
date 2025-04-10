const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  downloadSpeed: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploadSpeed: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  speedUnit: {
    type: DataTypes.ENUM('Kbps', 'Mbps', 'Gbps'),
    defaultValue: 'Mbps'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  features: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('features');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('features', value ? JSON.stringify(value) : null);
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Package;