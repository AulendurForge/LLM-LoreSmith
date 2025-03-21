/**
 * Database setup script
 * This script creates the database if it doesn't exist and runs migrations
 */
const { execSync } = require('child_process');
const path = require('path');
const pg = require('pg');
const knex = require('knex');
const config = require('../config');
const logger = require('../utils/logger');

// Parse the database URL
const parseDbUrl = (dbUrl) => {
  // Updated regex to support both postgres:// and postgresql:// protocols
  const regex = /(?:postgres|postgresql):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)/;
  const match = dbUrl.match(regex);

  if (!match) {
    logger.error(`Invalid database URL format: ${dbUrl}`);
    throw new Error(`Invalid database URL format: ${dbUrl}`);
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5]
  };
};

const createDatabase = async () => {
  try {
    // Extract database details from connection URL
    const dbConfig = parseDbUrl(config.dbUrl);
    logger.info(`Attempting to connect to database host: ${dbConfig.host}:${dbConfig.port}`);
    
    // Connect to postgres database to create our app database
    const connectionString = `postgres://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/postgres`;
    
    const client = new pg.Client({
      connectionString
    });
    
    await client.connect();
    
    // Check if database already exists
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname=$1`,
      [dbConfig.database]
    );
    
    // Create database if it doesn't exist
    if (result.rowCount === 0) {
      logger.info(`Creating database: ${dbConfig.database}`);
      await client.query(`CREATE DATABASE ${dbConfig.database}`);
      logger.info(`Database created successfully`);
    } else {
      logger.info(`Database ${dbConfig.database} already exists`);
    }
    
    await client.end();
    return true;
  } catch (error) {
    logger.error(`Error creating database: ${error.message}`);
    if (error.stack) {
      logger.error(`Stack trace: ${error.stack}`);
    }
    return false;
  }
};

const runMigrations = () => {
  try {
    logger.info('Running database migrations...');
    
    // Run migrations using knex CLI
    const knexBin = path.join(__dirname, '../../node_modules/.bin/knex');
    execSync(`${knexBin} migrate:latest --knexfile ${path.join(__dirname, 'knexfile.js')}`, {
      stdio: 'inherit'
    });
    
    logger.info('Migrations completed successfully');
    return true;
  } catch (error) {
    logger.error('Error running migrations:', error);
    return false;
  }
};

const runSeeds = () => {
  try {
    logger.info('Running database seeds...');
    
    // Run seeds using knex CLI
    const knexBin = path.join(__dirname, '../../node_modules/.bin/knex');
    execSync(`${knexBin} seed:run --knexfile ${path.join(__dirname, 'knexfile.js')}`, {
      stdio: 'inherit'
    });
    
    logger.info('Seeding completed successfully');
    return true;
  } catch (error) {
    logger.error('Error running seeds:', error);
    return false;
  }
};

const setupDatabase = async () => {
  // Step 1: Create database if it doesn't exist
  const dbCreated = await createDatabase();
  if (!dbCreated) {
    return false;
  }
  
  // Step 2: Run migrations
  const migrationsRun = runMigrations();
  if (!migrationsRun) {
    return false;
  }
  
  // Step 3: Run seeds
  return runSeeds();
};

// Run setup if script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(success => {
      if (success) {
        logger.info('Database setup completed successfully');
        process.exit(0);
      } else {
        logger.error('Database setup failed');
        process.exit(1);
      }
    })
    .catch(error => {
      logger.error('Unexpected error during database setup:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase; 