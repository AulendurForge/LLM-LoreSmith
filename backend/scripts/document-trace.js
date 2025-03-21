/**
 * Document lifecycle tracing script
 * Used to diagnose issues with document persistence
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Document = require('../src/db/models/Document');
const logger = require('../src/utils/logger');
const config = require('../src/config');
const { db } = require('../src/db');

// Enable more detailed logging for debugging
logger.level = 'debug';

// Configure enhanced logging
let originalQuery;
try {
  originalQuery = db.client.query;
  db.client.query = function(...args) {
    logger.debug(`DB QUERY: ${args[0]}`);
    return originalQuery.apply(this, args);
  };
} catch (err) {
  logger.warn('Could not add query logging:', err.message);
}

async function traceDocumentLifecycle() {
  try {
    logger.info('Starting document lifecycle trace');
    
    // 1. Check database connection first
    logger.info('Checking database connection...');
    try {
      await db.raw('SELECT 1');
      logger.info('Database connection successful');
    } catch (dbError) {
      logger.error('Database connection failed:', dbError);
      return;
    }
    
    // 2. List all documents in database using raw query instead of model
    logger.info('Listing all documents in database...');
    try {
      const docs = await db('documents').select('*');
      logger.info(`Found ${docs.length} documents in database`);
      
      // 3. Check for filesystem and database sync
      logger.info('Checking filesystem and database synchronization...');
      for (const doc of docs) {
        const fileExists = fs.existsSync(doc.path);
        logger.info(`Document ${doc.id} - ${doc.name}: File exists: ${fileExists}`);
        
        if (!fileExists) {
          logger.warn(`File missing for document: ${doc.id} - ${doc.name}, path: ${doc.path}`);
        }
      }
    } catch (queryError) {
      logger.error('Error querying documents:', queryError);
      // Continue with creating a test document even if listing fails
    }
    
    // 3. Test creating and deleting a document
    const testDir = path.join(config.storagePath || './data/documents', 'trace-test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const testFileName = `trace-test-document-${uuidv4()}.txt`;
    const testFilePath = path.join(testDir, testFileName);
    
    // Create a test file
    logger.info(`Creating test file at ${testFilePath}...`);
    fs.writeFileSync(testFilePath, 'Test content for document tracing');
    
    const testDoc = {
      name: testFileName,
      size: fs.statSync(testFilePath).size,
      type: 'text/plain',
      path: testFilePath,
      status: 'complete',
      progress: 100,
      tags: ['test', 'trace'],
      category: 'Diagnostic',
      is_favorite: false,
      uploaded_at: new Date(),
      metadata: { author: 'System', purpose: 'Diagnostic' }
    };
    
    logger.info('Creating test document in database...');
    let createdDoc;
    try {
      createdDoc = await Document.create(testDoc);
      logger.info(`Created document with ID: ${createdDoc.id}`);
    } catch (err) {
      logger.error('Error creating test document:', err);
      throw err;
    }
    
    // Verify it exists
    logger.info(`Verifying document ${createdDoc.id} exists...`);
    let fetchedDoc;
    try {
      fetchedDoc = await Document.getById(createdDoc.id);
      logger.info(`Fetched document: ${fetchedDoc ? 'Success' : 'Failed'}`);
      if (fetchedDoc) {
        logger.info(`Document details: ${JSON.stringify(fetchedDoc, null, 2)}`);
      }
    } catch (err) {
      logger.error('Error fetching document:', err);
      throw err;
    }
    
    // Delete the document
    logger.info(`Deleting test document ${createdDoc.id}...`);
    let deleteResult;
    try {
      deleteResult = await Document.delete(createdDoc.id);
      logger.info(`Document deletion result: ${deleteResult}`);
    } catch (err) {
      logger.error('Error deleting document:', err);
      throw err;
    }
    
    // Verify it was deleted
    logger.info(`Verifying document ${createdDoc.id} was deleted...`);
    let docAfterDelete;
    try {
      docAfterDelete = await Document.getById(createdDoc.id);
      logger.info(`Document after delete: ${docAfterDelete ? 'Still exists' : 'Successfully deleted'}`);
    } catch (err) {
      logger.error('Error checking deletion:', err);
      throw err;
    }
    
    // Cleanup test file
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
        logger.info(`Test file deleted: ${testFilePath}`);
      }
      
      // Try to remove test directory if empty
      const testDirFiles = fs.readdirSync(testDir);
      if (testDirFiles.length === 0) {
        fs.rmdirSync(testDir);
        logger.info(`Test directory removed: ${testDir}`);
      }
    } catch (err) {
      logger.warn('Error during cleanup:', err);
    }
    
    logger.info('Document trace complete');
  } catch (error) {
    logger.error('Error in document trace:', error);
    logger.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    // If there's an inner error, log that too
    if (error.cause || error.original) {
      const innerError = error.cause || error.original;
      logger.error('Inner error details:', {
        message: innerError.message,
        stack: innerError.stack,
        name: innerError.name
      });
    }
  } finally {
    // Restore original query function if it was modified
    if (originalQuery) {
      try {
        db.client.query = originalQuery;
      } catch (err) {
        logger.warn('Could not restore query function:', err.message);
      }
    }
    
    // Close database connection
    try {
      await db.destroy();
      logger.info('Database connection closed');
    } catch (err) {
      logger.error('Error closing database connection:', err);
    }
  }
}

// Run the trace
traceDocumentLifecycle(); 