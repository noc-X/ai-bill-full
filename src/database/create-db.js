require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  // Connect to the default 'postgres' database to create our application database
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'postgres' // Connect to the default postgres database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL default database');
    
    // Check if our database already exists
    const checkDbResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.POSTGRES_DB}'`
    );
    
    if (checkDbResult.rows.length === 0) {
      // Database doesn't exist, create it
      console.log(`Database '${process.env.POSTGRES_DB}' does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${process.env.POSTGRES_DB}`);
      console.log(`Database '${process.env.POSTGRES_DB}' created successfully!`);
    } else {
      console.log(`Database '${process.env.POSTGRES_DB}' already exists.`);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating database:', error);
    return false;
  } finally {
    await client.end();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createDatabase()
    .then(success => {
      if (success) {
        console.log('Database setup completed successfully.');
        process.exit(0);
      } else {
        console.error('Database setup failed.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

module.exports = { createDatabase };