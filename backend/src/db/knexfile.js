/**
 * Database configuration using Knex.js
 */
const config = require('../config');

// Get environment specific configuration with fallbacks for testing
const getDbConfig = (environment) => {
  // For testing, use a direct connection string instead of relying on environment variables
  if (environment === 'test') {
    return 'postgres://postgres:postgres@localhost:5432/loresmith_test';
  }
  return config.dbUrl;
};

module.exports = {
  development: {
    client: 'pg',
    connection: getDbConfig('development'),
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  },
  test: {
    client: 'pg',
    connection: getDbConfig('test'),
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  },
  production: {
    client: 'pg',
    connection: getDbConfig('production'),
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: 2,
      max: 20
    }
  }
}; 