/**
 * Test setup file for the backend tests
 * This file is used to set up the test environment before running tests
 */

// Set the NODE_ENV to 'test' before requiring db
process.env.NODE_ENV = 'test';
// Set a test database URL if it doesn't exist
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/loresmith_test';

const { db } = require('../src/db');
const logger = require('../src/utils/logger');

// Silence logger during tests
logger.level = 'silent';

// Setup function to be called before running tests
const setupTestEnvironment = async () => {
  try {
    // Check database connection
    await db.raw('SELECT 1');
    console.log('Database connection established for tests');
  } catch (error) {
    console.error('Error connecting to database for tests:', error);
    console.error('Make sure PostgreSQL is running and the database exists');
    process.exit(1);
  }
};

// Teardown function to be called after running tests
const teardownTestEnvironment = async () => {
  try {
    // Close database connection
    await db.destroy();
    console.log('Database connection closed after tests');
  } catch (error) {
    console.error('Error closing database connection after tests:', error);
  }
};

// Global setup and teardown
beforeAll(async () => {
  await setupTestEnvironment();
});

afterAll(async () => {
  await teardownTestEnvironment();
});

module.exports = {
  setupTestEnvironment,
  teardownTestEnvironment
}; 