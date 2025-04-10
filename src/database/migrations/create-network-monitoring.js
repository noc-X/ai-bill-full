const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('NetworkMonitoring', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'NetworkDevices',
          key: 'id'
        }
      },
      timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      uptime: {
        type: DataTypes.INTEGER,
        allowNull: true
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
      bandwidth: {
        type: DataTypes.JSON,
        allowNull: true
      },
      interfaces: {
        type: DataTypes.JSON,
        allowNull: true
      },
      alerts: {
        type: DataTypes.JSON,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    await queryInterface.createTable('DeviceConfigs', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      deviceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'NetworkDevices',
          key: 'id'
        }
      },
      configType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      configData: {
        type: DataTypes.JSON,
        allowNull: false
      },
      version: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DeviceConfigs');
    await queryInterface.dropTable('NetworkMonitoring');
  }
};