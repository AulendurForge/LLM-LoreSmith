/**
 * Document deletion diagnostic script
 * Used to diagnose issues with document creation and deletion
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../src/db');
const logger = require('../src/utils/logger');
const config = require('../src/config');

// Set higher log level for diagnostics
logger.level = 'debug';

// Log database configuration for debugging
const logDbConfig = () => {
  const { NODE_ENV } = process.env;
  logger.info(`Current environment: ${NODE_ENV || 'development'}`);
  logger.info(`Database URL: ${config.dbUrl}`);
};

// Run diagnostics
const runDiagnostics = async () => {
  logger.info('Starting document deletion diagnostic', { env: process.env.NODE_ENV });
  
  logDbConfig();
  
  logger.info('Testing database connection...', { env: process.env.NODE_ENV });
  
  try {
    // Test database connection
    await db.raw('SELECT 1');
    logger.info('Database connection successful', { env: process.env.NODE_ENV });
    
    // Check documents table exists
    const hasDocumentsTable = await db.schema.hasTable('documents');
    
    if (!hasDocumentsTable) {
      logger.error('Documents table does not exist in the database', { env: process.env.NODE_ENV });
      return;
    }
    
    logger.info('Documents table exists', { env: process.env.NODE_ENV });
    
    // Get document count
    const countResult = await db('documents').count('id as count').first();
    const documentCount = parseInt(countResult.count);
    
    logger.info(`Total documents in database: ${documentCount}`, { env: process.env.NODE_ENV });
    
    // Get all documents
    const documents = await db('documents').select('*');
    
    if (documents.length === 0) {
      logger.info('No documents found in the database', { env: process.env.NODE_ENV });
      
      // Create a test document
      const testDoc = {
        id: uuidv4(),
        name: 'Test Document',
        type: 'text/plain',
        size: 1024,
        status: 'uploaded',
        created_at: new Date(),
        updated_at: new Date(),
        metadata: JSON.stringify({ source: 'diagnostic script' })
      };
      
      await db('documents').insert(testDoc);
      logger.info(`Created test document with ID: ${testDoc.id}`, { env: process.env.NODE_ENV });
      
      // Fetch updated list
      const updatedDocs = await db('documents').select('*');
      documents.push(...updatedDocs);
    }
    
    // Check each document
    for (const doc of documents) {
      logger.info(`Checking document: ${doc.id} - ${doc.name}`, { env: process.env.NODE_ENV });
      
      // Check if file exists in storage
      const docPath = path.join(config.storagePath, doc.id);
      const fileExists = fs.existsSync(docPath);
      
      logger.info(`Document file ${fileExists ? 'exists' : 'does not exist'} at: ${docPath}`, { env: process.env.NODE_ENV });
      
      // Check status
      logger.info(`Document status: ${doc.status}`, { env: process.env.NODE_ENV });
      
      // Additional information
      logger.info(`Created: ${doc.created_at}, Updated: ${doc.updated_at}`, { env: process.env.NODE_ENV });
    }
    
    // Test deletion of the first document
    if (documents.length > 0) {
      const docToDelete = documents[0];
      logger.info(`Attempting to delete document: ${docToDelete.id}`, { env: process.env.NODE_ENV });
      
      // Delete from database
      const deleteCount = await db('documents').where('id', docToDelete.id).del();
      
      if (deleteCount > 0) {
        logger.info(`Successfully deleted document from database: ${docToDelete.id}`, { env: process.env.NODE_ENV });
        
        // Delete file if it exists
        const docPath = path.join(config.storagePath, docToDelete.id);
        if (fs.existsSync(docPath)) {
          fs.unlinkSync(docPath);
          logger.info(`Deleted document file: ${docPath}`, { env: process.env.NODE_ENV });
        }
      } else {
        logger.error(`Failed to delete document from database: ${docToDelete.id}`, { env: process.env.NODE_ENV });
      }
    }
    
  } catch (error) {
    logger.error(`Database connection failed:`, { env: process.env.NODE_ENV });
    logger.error(error);
  } finally {
    logger.info('Database connection closed', { env: process.env.NODE_ENV });
    await db.destroy();
  }
};

// Run the diagnostics
runDiagnostics(); 