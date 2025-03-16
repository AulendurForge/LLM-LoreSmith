const { StatusCodes } = require('http-status-codes');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');
const encryption = require('../../utils/encryption');
const config = require('../../config');

// In-memory document storage for now (would be replaced with a database in production)
const documents = [];

/**
 * Get all documents with pagination
 */
const getAllDocuments = (req, res, next) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    // Get paginated documents
    const paginatedDocuments = documents.slice(startIndex, endIndex);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      total: documents.length,
      page,
      limit,
      documents: paginatedDocuments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a document by ID
 */
const getDocumentById = (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find document
    const document = documents.find(doc => doc.id === id);
    
    // Check if document exists
    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Document with ID ${id} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Return document
    res.status(StatusCodes.OK).json({
      success: true,
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a new document
 */
const uploadDocument = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'No file uploaded',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Get the uploaded file information
    const uploadedFilePath = req.file.path;
    const encryptedFilename = `${path.basename(uploadedFilePath)}.encrypted`;
    const encryptedFilePath = path.join(path.dirname(uploadedFilePath), encryptedFilename);
    
    // Encrypt the uploaded file
    const encryptionResult = await encryption.encryptFile(uploadedFilePath, encryptedFilePath);
    
    // Delete the original unencrypted file
    fs.unlinkSync(uploadedFilePath);
    
    // Create document object with encryption metadata
    const document = {
      id: uuidv4(),
      name: req.file.originalname,
      filename: encryptedFilename,
      path: encryptedFilePath,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      progress: 100,
      metadata: {},
      isEncrypted: true,
      encryptionMetadata: {
        algorithm: encryptionResult.metadata.algorithm,
        metadataPath: encryptionResult.metadataPath,
      },
    };
    
    // Add document to storage
    documents.push(document);
    
    // Log document upload
    logger.info(`Document uploaded and encrypted: ${document.name} (${document.id})`);
    
    // Return response
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Document uploaded and encrypted successfully',
      document: {
        ...document,
        // Don't expose sensitive encryption metadata in the response
        encryptionMetadata: {
          algorithm: document.encryptionMetadata.algorithm,
        }
      },
    });
  } catch (error) {
    logger.error(`Error uploading document: ${error.message}`);
    next(error);
  }
};

/**
 * Update document metadata
 */
const updateDocumentMetadata = (req, res, next) => {
  try {
    const { id } = req.params;
    const { metadata } = req.body;
    
    // Validate request body
    if (!metadata || typeof metadata !== 'object') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Metadata must be an object',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Find document index
    const documentIndex = documents.findIndex(doc => doc.id === id);
    
    // Check if document exists
    if (documentIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Document with ID ${id} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Update metadata
    documents[documentIndex].metadata = {
      ...documents[documentIndex].metadata,
      ...metadata,
    };
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document metadata updated successfully',
      metadata: documents[documentIndex].metadata,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 */
const deleteDocument = (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find document index
    const documentIndex = documents.findIndex(doc => doc.id === id);
    
    // Check if document exists
    if (documentIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Document with ID ${id} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Get document
    const document = documents[documentIndex];
    
    // Delete file from storage
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
      
      // Delete encryption metadata file if exists
      if (document.isEncrypted && document.encryptionMetadata.metadataPath) {
        if (fs.existsSync(document.encryptionMetadata.metadataPath)) {
          fs.unlinkSync(document.encryptionMetadata.metadataPath);
        }
      }
    }
    
    // Remove document from storage
    documents.splice(documentIndex, 1);
    
    // Log document deletion
    logger.info(`Document deleted: ${document.name} (${document.id})`);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process a document
 */
const processDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find document index
    const documentIndex = documents.findIndex(doc => doc.id === id);
    
    // Check if document exists
    if (documentIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Document with ID ${id} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Update document status
    documents[documentIndex].status = 'processing';
    documents[documentIndex].progress = 0;
    
    // Simulate document processing
    simulateDocumentProcessing(id);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document processing started',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document processing status
 */
const getDocumentStatus = (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find document
    const document = documents.find(doc => doc.id === id);
    
    // Check if document exists
    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Document with ID ${id} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Return status
    res.status(StatusCodes.OK).json({
      success: true,
      status: document.status,
      progress: document.progress,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a document
 */
const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find document
    const document = documents.find(doc => doc.id === id);
    
    // Check if document exists
    if (!document) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Document with ID ${id} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // If document is encrypted, decrypt it first
    if (document.isEncrypted) {
      // Create a temporary file for the decrypted content
      const tempFilePath = path.join(
        path.dirname(document.path),
        `temp-${path.basename(document.path, '.encrypted')}`
      );
      
      // Decrypt the file
      await encryption.decryptFile(document.path, tempFilePath);
      
      // Set up response headers
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
      res.setHeader('Content-Type', document.type);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.pipe(res);
      
      // Clean up the temp file after sending
      fileStream.on('end', () => {
        fs.unlinkSync(tempFilePath);
      });
      
      // Log download
      logger.info(`Document downloaded: ${document.name} (${document.id})`);
    } else {
      // For unencrypted files, send directly
      res.download(document.path, document.name, (err) => {
        if (err) {
          next(err);
        } else {
          logger.info(`Document downloaded: ${document.name} (${document.id})`);
        }
      });
    }
  } catch (error) {
    logger.error(`Error downloading document: ${error.message}`);
    next(error);
  }
};

/**
 * Simulate document processing
 * @param {string} id - Document ID
 */
const simulateDocumentProcessing = (id) => {
  // Find document index
  const documentIndex = documents.findIndex(doc => doc.id === id);
  
  if (documentIndex === -1) {
    return;
  }
  
  // Simulate processing with progress updates
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 10;
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      // Update document status and metadata
      documents[documentIndex].status = 'complete';
      documents[documentIndex].progress = 100;
      documents[documentIndex].metadata = {
        ...documents[documentIndex].metadata,
        title: documents[documentIndex].name.split('.')[0],
        pageCount: Math.floor(Math.random() * 100) + 1,
        language: 'en',
        dateProcessed: new Date().toISOString(),
      };
      
      // Log completion
      logger.info(`Document processing completed: ${documents[documentIndex].name} (${id})`);
    } else {
      // Update progress
      documents[documentIndex].progress = Math.round(progress);
    }
  }, 1000);
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  updateDocumentMetadata,
  deleteDocument,
  processDocument,
  getDocumentStatus,
  downloadDocument
};