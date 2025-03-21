/**
 * API endpoint testing script for documents
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');
const config = require('../src/config');

// Set debug level for detailed logs
logger.level = 'debug';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Create a test document in the database directly
const testDocumentId = uuidv4();
const testDocument = {
  id: testDocumentId,
  name: 'API Test Document.txt',
  type: 'text/plain',
  size: 1024,
  status: 'uploaded',
  created_at: new Date(),
  updated_at: new Date(),
  metadata: JSON.stringify({ source: 'api test script' })
};

// Function to perform API tests
const runApiTests = async () => {
  try {
    logger.info('Starting API Test Script');
    
    // 1. Test connection to the API
    logger.info('Testing API connection...');
    
    try {
      const healthResponse = await axios.get(`${API_URL}/health`);
      logger.info(`API Health Check: ${healthResponse.status} ${healthResponse.statusText}`);
      logger.info(`API Response: ${JSON.stringify(healthResponse.data)}`);
    } catch (error) {
      logger.error('API Health Check Failed:', error.message);
      if (error.code === 'ECONNREFUSED') {
        logger.error('Connection refused. Is the API server running?');
        return;
      }
    }
    
    // 2. Test GET documents endpoint
    logger.info('\nTesting GET documents endpoint');
    try {
      const getResponse = await axios.get(`${API_URL}/documents`);
      logger.info(`GET Documents Status: ${getResponse.status}`);
      logger.info(`Found ${getResponse.data.documents.length} documents`);
      
      if (getResponse.data.documents.length > 0) {
        logger.info(`Sample document: ${JSON.stringify(getResponse.data.documents[0], null, 2)}`);
      }
    } catch (error) {
      logger.error('GET Documents Failed:', error.message);
    }
    
    // 3. Test DELETE document endpoint with a non-existent ID
    const nonExistentId = uuidv4();
    logger.info(`\nTesting DELETE document with non-existent ID: ${nonExistentId}`);
    
    try {
      const deleteResponse = await axios.delete(`${API_URL}/documents/${nonExistentId}`);
      logger.info(`DELETE Non-existent Document Status: ${deleteResponse.status}`);
      logger.info(`Response: ${JSON.stringify(deleteResponse.data)}`);
    } catch (error) {
      logger.info(`Expected error for non-existent document: ${error.message}`);
      if (error.response) {
        logger.info(`Status code: ${error.response.status}`);
        logger.info(`Response data: ${JSON.stringify(error.response.data)}`);
      }
    }
    
    // 4. Insert test document directly in the database using Knex
    logger.info('\nInserting test document in database');
    
    try {
      const { db } = require('../src/db');
      
      // Check if a document with this ID already exists
      const existingDoc = await db('documents').where({ id: testDocumentId }).first();
      
      if (existingDoc) {
        logger.info(`Test document already exists with ID: ${testDocumentId}`);
      } else {
        await db('documents').insert(testDocument);
        logger.info(`Test document inserted with ID: ${testDocumentId}`);
      }
      
      // Verify document exists in database
      const verifyDoc = await db('documents').where({ id: testDocumentId }).first();
      if (verifyDoc) {
        logger.info('Document verification successful');
      }
      
      // 5. Test GET document by ID
      logger.info(`\nTesting GET document by ID: ${testDocumentId}`);
      
      try {
        const getByIdResponse = await axios.get(`${API_URL}/documents/${testDocumentId}`);
        logger.info(`GET Document by ID Status: ${getByIdResponse.status}`);
        logger.info(`Response: ${JSON.stringify(getByIdResponse.data, null, 2)}`);
      } catch (error) {
        logger.error('GET Document by ID Failed:', error.message);
        if (error.response) {
          logger.error(`Status code: ${error.response.status}`);
          logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
      }
      
      // 6. Test DELETE document with the test document ID
      logger.info(`\nTesting DELETE document with ID: ${testDocumentId}`);
      
      try {
        const deleteTestResponse = await axios.delete(`${API_URL}/documents/${testDocumentId}`);
        logger.info(`DELETE Test Document Status: ${deleteTestResponse.status}`);
        logger.info(`Response: ${JSON.stringify(deleteTestResponse.data)}`);
        
        // Verify document was deleted
        const verifyDeleted = await db('documents').where({ id: testDocumentId }).first();
        if (!verifyDeleted) {
          logger.info('Document deletion verification successful - document no longer exists in database');
        } else {
          logger.error('Document still exists in database after deletion');
        }
      } catch (error) {
        logger.error('DELETE Test Document Failed:', error.message);
        if (error.response) {
          logger.error(`Status code: ${error.response.status}`);
          logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
      }
      
      // Clean up database connection
      await db.destroy();
      
    } catch (dbError) {
      logger.error('Database Error:', dbError);
    }
    
  } catch (error) {
    logger.error('Test Script Error:', error.message);
  }
  
  logger.info('API Test Script Completed');
};

// Run the tests
runApiTests(); 