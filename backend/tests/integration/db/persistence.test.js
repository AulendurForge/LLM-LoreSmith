/**
 * Integration tests for document persistence
 * Tests the document model's CRUD operations with the database
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Document = require('../../../src/db/models/Document');
const { db } = require('../../../src/db');
const config = require('../../../src/config');

// Create a test storage directory
const TEST_STORAGE_PATH = path.join(__dirname, '..', '..', 'tmp');

describe('Document Persistence', () => {
  beforeAll(async () => {
    // Create test storage directory if it doesn't exist
    if (!fs.existsSync(TEST_STORAGE_PATH)) {
      fs.mkdirSync(TEST_STORAGE_PATH, { recursive: true });
    }
    
    // Ensure database connection is established
    try {
      await db.raw('SELECT 1');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Database connection failed');
    }
  });

  afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(TEST_STORAGE_PATH)) {
      const files = fs.readdirSync(TEST_STORAGE_PATH);
      for (const file of files) {
        fs.unlinkSync(path.join(TEST_STORAGE_PATH, file));
      }
      fs.rmdirSync(TEST_STORAGE_PATH);
    }
    
    // Close database connection
    await db.destroy();
  });

  afterEach(async () => {
    // Clean up test documents after each test
    try {
      await db('documents').delete();
    } catch (error) {
      console.error('Error cleaning up test documents:', error);
    }
  });

  it('should create and retrieve a document from the database', async () => {
    // Arrange: Create a test document
    const testFileName = `test-document-${uuidv4()}.pdf`;
    const testFilePath = path.join(TEST_STORAGE_PATH, testFileName);
    
    // Create a dummy file
    fs.writeFileSync(testFilePath, 'Test content');
    
    const testDoc = {
      name: testFileName,
      size: fs.statSync(testFilePath).size,
      type: 'application/pdf',
      path: testFilePath,
      status: 'complete',
      tags: ['test', 'integration'],
      category: 'Testing',
      progress: 100,
      is_favorite: false,
      metadata: { author: 'Test User', pages: 1 }
    };
    
    // Act: Save to database
    const createdDoc = await Document.create(testDoc);
    
    // Assert: Verify document was created with an ID
    expect(createdDoc).toBeDefined();
    expect(createdDoc.id).toBeDefined();
    expect(createdDoc.name).toBe(testFileName);
    
    // Act: Retrieve the document
    const retrievedDoc = await Document.getById(createdDoc.id);
    
    // Assert: Verify retrieved document matches created document
    expect(retrievedDoc).toBeDefined();
    expect(retrievedDoc.id).toBe(createdDoc.id);
    expect(retrievedDoc.name).toBe(testDoc.name);
    expect(retrievedDoc.size).toBe(testDoc.size);
    expect(retrievedDoc.status).toBe(testDoc.status);
    expect(JSON.stringify(retrievedDoc.tags)).toBe(JSON.stringify(testDoc.tags));
    expect(retrievedDoc.category).toBe(testDoc.category);
    
    // Clean up file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should update a document in the database', async () => {
    // Arrange: Create a test document
    const testFileName = `test-document-${uuidv4()}.pdf`;
    const testFilePath = path.join(TEST_STORAGE_PATH, testFileName);
    
    // Create a dummy file
    fs.writeFileSync(testFilePath, 'Test content');
    
    const testDoc = {
      name: testFileName,
      size: fs.statSync(testFilePath).size,
      type: 'application/pdf',
      path: testFilePath,
      status: 'uploading',
      progress: 50,
      tags: ['test'],
      category: 'Original'
    };
    
    // Create initial document
    const createdDoc = await Document.create(testDoc);
    
    // Act: Update the document
    const updates = {
      status: 'complete',
      progress: 100,
      category: 'Updated',
      tags: ['test', 'updated']
    };
    
    const updatedDoc = await Document.update(createdDoc.id, updates);
    
    // Assert: Verify document was updated
    expect(updatedDoc).toBeDefined();
    expect(updatedDoc.id).toBe(createdDoc.id);
    expect(updatedDoc.status).toBe(updates.status);
    expect(updatedDoc.progress).toBe(updates.progress);
    expect(updatedDoc.category).toBe(updates.category);
    expect(JSON.stringify(updatedDoc.tags)).toBe(JSON.stringify(updates.tags));
    
    // Clean up file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should delete a document from the database', async () => {
    // Arrange: Create a test document
    const testFileName = `test-document-${uuidv4()}.pdf`;
    const testFilePath = path.join(TEST_STORAGE_PATH, testFileName);
    
    // Create a dummy file
    fs.writeFileSync(testFilePath, 'Test content');
    
    const testDoc = {
      name: testFileName,
      size: fs.statSync(testFilePath).size,
      type: 'application/pdf',
      path: testFilePath,
      status: 'complete',
      progress: 100
    };
    
    // Create document to delete
    const createdDoc = await Document.create(testDoc);
    
    // Verify document exists
    const docBeforeDelete = await Document.getById(createdDoc.id);
    expect(docBeforeDelete).toBeDefined();
    expect(docBeforeDelete.id).toBe(createdDoc.id);
    
    // Act: Delete the document
    const deleteResult = await Document.delete(createdDoc.id);
    
    // Assert: Verify document was deleted
    expect(deleteResult).toBe(true);
    
    // Verify document no longer exists
    const docAfterDelete = await Document.getById(createdDoc.id);
    expect(docAfterDelete).toBeNull();
    
    // Clean up file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  it('should return null when getting a non-existent document', async () => {
    // Act: Try to get a document with a non-existent ID
    const nonExistentId = uuidv4();
    const result = await Document.getById(nonExistentId);
    
    // Assert: Verify null is returned
    expect(result).toBeNull();
  });

  it('should handle document listing with pagination', async () => {
    // Arrange: Create multiple test documents
    const testDocs = [];
    
    for (let i = 0; i < 5; i++) {
      const testFileName = `test-document-${i}-${uuidv4()}.pdf`;
      const testFilePath = path.join(TEST_STORAGE_PATH, testFileName);
      
      // Create a dummy file
      fs.writeFileSync(testFilePath, `Test content ${i}`);
      
      const testDoc = {
        name: testFileName,
        size: fs.statSync(testFilePath).size,
        type: 'application/pdf',
        path: testFilePath,
        status: 'complete',
        progress: 100,
        uploaded_at: new Date(Date.now() - i * 1000) // Different timestamps
      };
      
      // Create document
      const createdDoc = await Document.create(testDoc);
      testDocs.push(createdDoc);
    }
    
    // Act: Get all documents
    const allDocs = await Document.getAll({});
    
    // Assert: Verify all documents were retrieved
    expect(allDocs.length).toBe(5);
    
    // Act: Get documents with pagination
    const pageSize = 2;
    const page1Docs = await Document.getAll({}).limit(pageSize).offset(0);
    const page2Docs = await Document.getAll({}).limit(pageSize).offset(pageSize);
    
    // Assert: Verify pagination works
    expect(page1Docs.length).toBe(pageSize);
    expect(page2Docs.length).toBe(pageSize);
    
    // Clean up files
    for (let i = 0; i < 5; i++) {
      const testFilePath = path.join(TEST_STORAGE_PATH, testDocs[i].name);
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });
}); 