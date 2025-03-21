/**
 * Database connection test script
 * Tests connections to both Docker and local databases
 */

const knex = require('knex');
const { Client } = require('pg');

console.log('Database Connection Test Script');
console.log('===============================');

// Test direct connection to Docker container
async function testDockerConnection() {
  console.log('\n1. Testing connection to Docker PostgreSQL container:');
  const dockerDb = knex({
    client: 'pg',
    connection: 'postgres://postgres:postgres@postgres:5432/loresmith'
  });
  
  try {
    await dockerDb.raw('SELECT 1');
    console.log('✅ SUCCESS: Connected to Docker PostgreSQL container');
    return true;
  } catch (error) {
    console.error('❌ FAILED: Could not connect to Docker PostgreSQL container');
    console.error('Error details:', error.message);
    return false;
  } finally {
    await dockerDb.destroy();
  }
}

// Test direct connection to local PostgreSQL
async function testLocalConnection() {
  console.log('\n2. Testing connection to local PostgreSQL:');
  const localDb = knex({
    client: 'pg',
    connection: 'postgres://postgres:postgres@localhost:5432/postgres'
  });
  
  try {
    await localDb.raw('SELECT 1');
    console.log('✅ SUCCESS: Connected to local PostgreSQL');
    return true;
  } catch (error) {
    console.error('❌ FAILED: Could not connect to local PostgreSQL');
    console.error('Error details:', error.message);
    return false;
  } finally {
    await localDb.destroy();
  }
}

// Test test database connection
async function testTestDatabaseConnection() {
  console.log('\n3. Testing connection to test database:');
  
  // First check if database exists
  const client = new Client({
    host: 'localhost', 
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
  });
  
  try {
    await client.connect();
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'loresmith_test'`);
    
    if (result.rowCount === 0) {
      console.log('⚠️ WARNING: Test database does not exist yet');
      console.log('Run "node scripts/setup-test-db.js" to create it');
      return false;
    }
    
    // Test connection to test database
    const testDb = knex({
      client: 'pg',
      connection: 'postgres://postgres:postgres@localhost:5432/loresmith_test'
    });
    
    await testDb.raw('SELECT 1');
    console.log('✅ SUCCESS: Connected to test database');
    
    // Check for documents table
    const tables = await testDb.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tableNames = tables.rows.map(row => row.table_name);
    console.log('Available tables:', tableNames.join(', '));
    
    if (!tableNames.includes('documents')) {
      console.log('⚠️ WARNING: documents table does not exist in test database');
    } else {
      console.log('✅ documents table exists');
    }
    
    await testDb.destroy();
    return true;
  } catch (error) {
    console.error('❌ FAILED: Error connecting to test database');
    console.error('Error details:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

// Run all tests
async function runAllTests() {
  try {
    const dockerResult = await testDockerConnection();
    const localResult = await testLocalConnection();
    const testDbResult = await testTestDatabaseConnection();
    
    console.log('\nSummary:');
    console.log('---------');
    console.log('Docker PostgreSQL connection:', dockerResult ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Local PostgreSQL connection:', localResult ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Test database connection:', testDbResult ? '✅ SUCCESS' : '❌ FAILED');
    
    console.log('\nRecommendations:');
    if (!dockerResult) {
      console.log('- Ensure Docker containers are running: `docker compose up -d`');
    }
    
    if (!localResult) {
      console.log('- Ensure PostgreSQL is installed and running locally');
      console.log('- Check PostgreSQL credentials (default: postgres/postgres)');
    }
    
    if (!testDbResult) {
      console.log('- Run `node scripts/setup-test-db.js` to create test database');
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run all the tests
runAllTests(); 