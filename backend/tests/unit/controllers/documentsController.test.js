/**
 * Unit tests for the documents controller
 */
const { StatusCodes } = require('http-status-codes');
const documentsController = require('../../../src/api/controllers/documentsController');
const Document = require('../../../src/db/models/Document');

// Mock the Document model
jest.mock('../../../src/db/models/Document', () => ({
  getById: jest.fn(),
  delete: jest.fn(),
  getAll: jest.fn()
}));

// Mock the fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}));

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

describe('Documents Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup request, response, and next function
    req = {
      params: { id: 'test-doc-id' },
      body: {}
    };
    
    res = {
      status: jest.fn(() => res),
      json: jest.fn()
    };
    
    next = jest.fn();
  });
  
  describe('deleteDocument', () => {
    it('should return 404 if document does not exist', async () => {
      // Arrange
      Document.getById.mockResolvedValueOnce(null);
      
      // Act
      await documentsController.deleteDocument(req, res, next);
      
      // Assert
      expect(Document.getById).toHaveBeenCalledWith('test-doc-id');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining('not found'),
          statusCode: StatusCodes.NOT_FOUND
        })
      }));
      expect(Document.delete).not.toHaveBeenCalled();
    });
    
    it('should delete document and return success response', async () => {
      // Arrange
      const mockDocument = {
        id: 'test-doc-id',
        name: 'test-document.pdf',
        path: '/test/path/document.pdf',
        is_encrypted: false
      };
      
      Document.getById.mockResolvedValueOnce(mockDocument);
      Document.delete.mockResolvedValueOnce(true);
      const fs = require('fs');
      fs.existsSync.mockReturnValueOnce(true);
      
      // Act
      await documentsController.deleteDocument(req, res, next);
      
      // Assert
      expect(Document.getById).toHaveBeenCalledWith('test-doc-id');
      expect(fs.existsSync).toHaveBeenCalledWith(mockDocument.path);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockDocument.path);
      expect(Document.delete).toHaveBeenCalledWith('test-doc-id');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('deleted successfully')
      }));
    });
    
    it('should handle database errors', async () => {
      // Arrange
      const mockDocument = {
        id: 'test-doc-id',
        name: 'test-document.pdf',
        path: '/test/path/document.pdf'
      };
      
      const dbError = new Error('Database error');
      Document.getById.mockResolvedValueOnce(mockDocument);
      Document.delete.mockRejectedValueOnce(dbError);
      const fs = require('fs');
      fs.existsSync.mockReturnValueOnce(false);
      
      // Act
      await documentsController.deleteDocument(req, res, next);
      
      // Assert
      expect(Document.getById).toHaveBeenCalledWith('test-doc-id');
      expect(Document.delete).toHaveBeenCalledWith('test-doc-id');
      expect(next).toHaveBeenCalledWith(dbError);
    });
    
    it('should handle encrypted documents correctly', async () => {
      // Arrange
      const mockDocument = {
        id: 'test-doc-id',
        name: 'encrypted-document.pdf',
        path: '/test/path/encrypted-document.pdf',
        is_encrypted: true,
        encryption_metadata: {
          metadataPath: '/test/path/encrypted-document.pdf.meta'
        }
      };
      
      Document.getById.mockResolvedValueOnce(mockDocument);
      Document.delete.mockResolvedValueOnce(true);
      const fs = require('fs');
      fs.existsSync
        .mockReturnValueOnce(true) // Document exists
        .mockReturnValueOnce(true); // Metadata file exists
      
      // Act
      await documentsController.deleteDocument(req, res, next);
      
      // Assert
      expect(Document.getById).toHaveBeenCalledWith('test-doc-id');
      expect(fs.existsSync).toHaveBeenCalledWith(mockDocument.path);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockDocument.path);
      expect(fs.existsSync).toHaveBeenCalledWith(mockDocument.encryption_metadata.metadataPath);
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockDocument.encryption_metadata.metadataPath);
      expect(Document.delete).toHaveBeenCalledWith('test-doc-id');
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    });
  });
}); 