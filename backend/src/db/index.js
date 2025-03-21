/**
 * Database connection module
 */
const knex = require('knex');
const knexfile = require('./knexfile');
const logger = require('../utils/logger');

// Get environment from Node environment variable or default to development
const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

// Initialize knex connection
const db = knex(config);

// Test the connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
};

module.exports = {
  db,
  testConnection
}; 