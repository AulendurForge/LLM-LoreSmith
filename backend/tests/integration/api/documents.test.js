/**
 * Integration tests for the documents API endpoints
 */
const request = require('supertest');
const { StatusCodes } = require('http-status-codes');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../../../src/db');
const Document = require('../../../src/db/models/Document');
const app = require('../../../src/index');

// Create test directories
const TEST_STORAGE_PATH = path.join(__dirname, '..', '..', 'tmp', 'api-tests');
const TEST_FILE_PATH = path.join(TEST_STORAGE_PATH, `test-file-${uuidv4()}.txt`);

describe('Documents API Integration Tests', () => {
  let testDocId;
  
  beforeAll(async () => {
    // Create test directories
    if (!fs.existsSync(TEST_STORAGE_PATH)) {
      fs.mkdirSync(TEST_STORAGE_PATH, { recursive: true });
    }
    
    // Create test file
    fs.writeFileSync(TEST_FILE_PATH, 'Test content for API integration tests');
    
    // Create a test document in the database
    const testDoc = {
      name: path.basename(TEST_FILE_PATH),
      size: fs.statSync(TEST_FILE_PATH).size,
      type: 'text/plain',
      path: TEST_FILE_PATH,
      status: 'complete',
      progress: 100,
      tags: ['test', 'api'],
      category: 'Integration Tests',
      uploaded_at: new Date()
    };
    
    const doc = await Document.create(testDoc);
    testDocId = doc.id;
  });
  
  afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(TEST_FILE_PATH)) {
      fs.unlinkSync(TEST_FILE_PATH);
    }
    
    // Clean up test directory
    if (fs.existsSync(TEST_STORAGE_PATH)) {
      fs.rmdirSync(TEST_STORAGE_PATH, { recursive: true });
    }
    
    // Close database connection
    await db.destroy();
    
    // Close server connection
    if (app.server) {
      app.server.close();
    }
  });
  
  describe('GET /api/documents', () => {
    it('should return a list of documents', async () => {
      const response = await request(app)
        .get('/api/documents')
        .expect('Content-Type', /json/)
        .expect(StatusCodes.OK);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verify our test document is in the list
      const foundDoc = response.body.data.find(doc => doc.id === testDocId);
      expect(foundDoc).toBeDefined();
      expect(foundDoc.name).toBe(path.basename(TEST_FILE_PATH));
    });
    
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/documents?page=1&limit=5')
        .expect('Content-Type', /json/)
        .expect(StatusCodes.OK);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });
  });
  
  describe('GET /api/documents/:id', () => {
    it('should return a document by ID', async () => {
      const response = await request(app)
        .get(`/api/documents/${testDocId}`)
        .expect('Content-Type', /json/)
        .expect(StatusCodes.OK);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testDocId);
      expect(response.body.data).toHaveProperty('name', path.basename(TEST_FILE_PATH));
    });
    
    it('should return 404 for non-existent document', async () => {
      const nonExistentId = uuidv4();
      const response = await request(app)
        .get(`/api/documents/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(StatusCodes.NOT_FOUND);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('statusCode', StatusCodes.NOT_FOUND);
    });
  });
  
  describe('DELETE /api/documents/:id', () => {
    it('should delete a document by ID', async () => {
      // First create a document specifically for deletion
      const deleteTestFilePath = path.join(TEST_STORAGE_PATH, `delete-test-${uuidv4()}.txt`);
      fs.writeFileSync(deleteTestFilePath, 'Test content for deletion');
      
      const deleteTestDoc = {
        name: path.basename(deleteTestFilePath),
        size: fs.statSync(deleteTestFilePath).size,
        type: 'text/plain',
        path: deleteTestFilePath,
        status: 'complete',
        progress: 100
      };
      
      const doc = await Document.create(deleteTestDoc);
      const deleteDocId = doc.id;
      
      // Now test deletion
      const response = await request(app)
        .delete(`/api/documents/${deleteDocId}`)
        .expect('Content-Type', /json/)
        .expect(StatusCodes.OK);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Document deleted successfully');
      
      // Verify document no longer exists in the database
      const deletedDoc = await Document.getById(deleteDocId);
      expect(deletedDoc).toBeNull();
      
      // Clean up test file if it still exists
      if (fs.existsSync(deleteTestFilePath)) {
        fs.unlinkSync(deleteTestFilePath);
      }
    });
    
    it('should return 404 when deleting non-existent document', async () => {
      const nonExistentId = uuidv4();
      const response = await request(app)
        .delete(`/api/documents/${nonExistentId}`)
        .expect('Content-Type', /json/)
        .expect(StatusCodes.NOT_FOUND);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('statusCode', StatusCodes.NOT_FOUND);
    });
  });
}); 