require('dotenv').config();
const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Import all models
const models = require('../models');

// Import default admin migration
const { up: createDefaultAdmin } = require('./migrations/create-default-admin');

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Sync all models with the database
    // This will create tables if they don't exist
    // Force: true will drop tables if they exist
    await sequelize.sync({ force: true });

    // Run default admin migration
    console.log('Creating default admin user...');
    await createDefaultAdmin(sequelize.getQueryInterface(), sequelize);
    
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();