const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Self-referential association for parent-child relationship

const NetworkDevice = sequelize.define('NetworkDevice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('mikrotik', 'switch', 'olt', 'ap'),
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIP: true
    }
  },
  macAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  connectionMethod: {
    type: DataTypes.ENUM('ethernet', 'wifi', 'fiber'),
    allowNull: false
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'warning'),
    defaultValue: 'offline'
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  cpuLoad: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  memoryUsage: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  uptime: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  firmware: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'NetworkDevices',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Setup parent-child relationship
NetworkDevice.belongsTo(NetworkDevice, { as: 'parent', foreignKey: 'parentId' });
NetworkDevice.hasMany(NetworkDevice, { as: 'children', foreignKey: 'parentId' });

module.exports = NetworkDevice;