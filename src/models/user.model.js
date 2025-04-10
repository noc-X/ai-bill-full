const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'technician', 'finance', 'collector', 'user'),
    defaultValue: 'user'
  },
  phone: {
    type: DataTypes.STRING
  },
  profilePicture: {
    type: DataTypes.STRING,
    defaultValue: 'default.jpg'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  passwordChangedAt: {
    type: DataTypes.DATE
  },
  passwordResetToken: {
    type: DataTypes.STRING
  },
  passwordResetExpires: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  hooks: {
    beforeSave: async (user) => {
      // Only run this function if password was modified
      if (!user.changed('password')) return;
      
      // Hash the password with cost of 12
      user.password = await bcrypt.hash(user.password, 12);
      
      // Update passwordChangedAt field
      user.passwordChangedAt = new Date(Date.now() - 1000);
    }
  }
});

// Method to check if password is correct
User.prototype.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to check if user changed password after token was issued
User.prototype.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  
  // False means NOT changed
  return false;
};

module.exports = User;