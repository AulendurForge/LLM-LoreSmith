/**
 * Test database setup script
 * Creates a dedicated test database for running tests
 */

const { Client } = require('pg');
const knex = require('knex');
const path = require('path');
const logger = require('../src/utils/logger');

// Database configuration
const dbConfig = {
  // Connect to postgres DB to create test DB
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

// Test database name
const testDatabaseName = 'loresmith_test';

// Function to create test database
async function createTestDatabase() {
  const client = new Client(dbConfig);
  
  try {
    logger.info('Connecting to PostgreSQL to create test database...');
    await client.connect();
    
    // Check if test database already exists
    const checkResult = await client.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [testDatabaseName]);
    
    if (checkResult.rowCount > 0) {
      logger.info(`Test database '${testDatabaseName}' already exists`);
    } else {
      // Create test database
      logger.info(`Creating test database '${testDatabaseName}'...`);
      await client.query(`CREATE DATABASE ${testDatabaseName}`);
      logger.info('Test database created successfully');
    }
    
    // Now connect to the test database and run migrations
    const testDb = knex({
      client: 'pg',
      connection: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: testDatabaseName
      },
      migrations: {
        directory: path.join(__dirname, '../src/db/migrations')
      },
      seeds: {
        directory: path.join(__dirname, '../src/db/seeds')
      }
    });
    
    // Run migrations
    logger.info('Running migrations on test database...');
    await testDb.migrate.latest();
    logger.info('Migrations completed successfully');
    
    // Run seeds
    logger.info('Running seeds on test database...');
    await testDb.seed.run();
    logger.info('Seeds completed successfully');
    
    // Close test DB connection
    await testDb.destroy();
    logger.info('Test database setup completed successfully');
    
  } catch (error) {
    logger.error('Error setting up test database:', error);
  } finally {
    // Close client connection
    await client.end();
  }
}

// Run the setup function
createTestDatabase(); 