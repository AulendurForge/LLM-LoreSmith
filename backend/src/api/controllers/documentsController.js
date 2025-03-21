const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { StatusCodes } = require('http-status-codes');
const logger = require('../../utils/logger');
const { encryptFile, decryptFile } = require('../../utils/encryption');
const { backupDocument } = require('../../utils/backup');
const Document = require('../../db/models/Document');
const DocumentVersion = require('../../db/models/DocumentVersion');
const config = require('../../config');
const storage = require('../../utils/storage');
const { db } = require('../../db');

// Define storage directory
const STORAGE_DIR = path.join(__dirname, '../../../data/local-storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Get all documents
 */
const getAllDocuments = async (req, res, next) => {
  try {
    // Build filters from query parameters
    const filters = {};
    
    if (req.query.category) {
      filters.category = req.query.category;
    }
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.searchTerm) {
      filters.searchTerm = req.query.searchTerm;
    }
    
    if (req.query.tags) {
      filters.tags = Array.isArray(req.query.tags) 
        ? req.query.tags 
        : [req.query.tags];
    }
    
    if (req.query.favorite) {
      filters.isFavorite = req.query.favorite === 'true';
    }
    
    // Get documents with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Get the query object and modify it for pagination
    const query = db('documents');
    
    // Apply filters
    if (filters.category) {
      query.where('category', filters.category);
    }
    
    if (filters.status) {
      query.where('status', filters.status);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.whereRaw('tags @> ?', [JSON.stringify(filters.tags)]);
    }
    
    if (filters.isFavorite !== undefined) {
      query.where('is_favorite', filters.isFavorite);
    }
    
    if (filters.searchTerm) {
      query.where(function() {
        this.where('name', 'ilike', `%${filters.searchTerm}%`)
            .orWhereRaw("metadata::text ILIKE '%' || ? || '%'", [filters.searchTerm]);
      });
    }
    
    query.orderBy('uploaded_at', 'desc');
    
    // Clone the query for count
    const countQuery = db.count('* as total').from('documents').as('count');
    
    // Apply same filters to count query
    if (filters.category) {
      countQuery.where('category', filters.category);
    }
    
    if (filters.status) {
      countQuery.where('status', filters.status);
    }
    
    if (filters.tags && filters.tags.length > 0) {
      countQuery.whereRaw('tags @> ?', [JSON.stringify(filters.tags)]);
    }
    
    if (filters.isFavorite !== undefined) {
      countQuery.where('is_favorite', filters.isFavorite);
    }
    
    if (filters.searchTerm) {
      countQuery.where(function() {
        this.where('name', 'ilike', `%${filters.searchTerm}%`)
            .orWhereRaw("metadata::text ILIKE '%' || ? || '%'", [filters.searchTerm]);
      });
    }
    
    // Execute both queries
    const [documents, countResult] = await Promise.all([
      query.limit(limit).offset(offset),
      db.count('* as total')
        .from('documents')
        .modify(builder => {
          // Apply same filters to count query
          if (filters.category) {
            builder.where('category', filters.category);
          }
          
          if (filters.status) {
            builder.where('status', filters.status);
          }
          
          if (filters.tags && filters.tags.length > 0) {
            builder.whereRaw('tags @> ?', [JSON.stringify(filters.tags)]);
          }
          
          if (filters.isFavorite !== undefined) {
            builder.where('is_favorite', filters.isFavorite);
          }
          
          if (filters.searchTerm) {
            builder.where(function() {
              this.where('name', 'ilike', `%${filters.searchTerm}%`)
                  .orWhereRaw("metadata::text ILIKE '%' || ? || '%'", [filters.searchTerm]);
            });
          }
        })
        .first()
    ]);
    
    const total = parseInt(countResult.total, 10) || 0;
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: documents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a document by ID
 */
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: document
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
    // Check if file exists
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'No file uploaded',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    const file = req.file;
    const id = uuidv4();
    const fileName = `${id}_${file.originalname}`;
    
    // Save file using storage utility
    const filePath = storage.saveFile(file.buffer, fileName);
    
    // Create document in database
    const document = {
      id,
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      path: filePath,
      uploaded_at: new Date().toISOString(),
      status: 'uploading',
      progress: 0
    };
    
    // Add metadata if provided
    if (req.body.metadata) {
      try {
        document.metadata = JSON.parse(req.body.metadata);
      } catch (err) {
        logger.warn(`Invalid metadata format for document: ${id}`);
      }
    }
    
    // Add to database
    const createdDocument = await Document.create(document);
    
    // Log document creation
    logger.info(`Document created: ${createdDocument.name} (${createdDocument.id})`);
    
    // Return response
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: createdDocument
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document metadata
 */
const updateDocumentMetadata = async (req, res, next) => {
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
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Update metadata
    const updatedDocument = await Document.updateMetadata(id, {
      ...document.metadata,
      ...metadata
    });
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document metadata updated successfully',
      data: {
        metadata: updatedDocument.metadata
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document
 */
const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating certain fields
    delete updates.id;
    delete updates.path;
    delete updates.uploaded_at;
    
    // Convert tags to array if it's a string
    if (typeof updates.tags === 'string') {
      updates.tags = [updates.tags];
    }
    
    // Convert camelCase properties to snake_case for database
    const dbUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      dbUpdates[dbKey] = value;
    }
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Update document
    const updatedDocument = await Document.update(id, dbUpdates);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document updated successfully',
      data: updatedDocument
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update document progress
 */
const updateDocumentProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    // Validate progress
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Progress must be a number between 0 and 100',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Update document progress
    const updatedDocument = await Document.updateProgress(id, progress);
    
    // Check if document exists
    if (!updatedDocument) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Document with ID ${id} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Update status if progress is 100%
    if (progress === 100 && updatedDocument.status === 'uploading') {
      await Document.updateStatus(id, 'uploaded');
      updatedDocument.status = 'uploaded';
    }
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedDocument
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 */
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Delete file from storage
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path);
      
      // Delete encryption metadata file if exists
      if (document.is_encrypted && document.encryption_metadata?.metadataPath) {
        if (fs.existsSync(document.encryption_metadata.metadataPath)) {
          fs.unlinkSync(document.encryption_metadata.metadataPath);
        }
      }
    }
    
    // Delete document from database
    await Document.delete(id);
    
    // Log document deletion
    logger.info(`Document deleted: ${document.name} (${document.id})`);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document status
 */
const getDocumentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Check if file exists
    if (!fs.existsSync(document.path)) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `File not found for document ${id}`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Set Content-Disposition header to trigger download
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', document.type || 'application/octet-stream');
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(document.path);
    fileStream.pipe(res);
    
    // Log download
    logger.info(`Document downloaded: ${document.name} (${document.id})`);
  } catch (error) {
    next(error);
  }
};

/**
 * Process document
 */
const processDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Update status to processing
    await Document.updateStatus(id, 'processing');
    
    // Simulate processing (in a real implementation, this would be async)
    // For now, we'll just set a timeout to update the status after 3 seconds
    setTimeout(async () => {
      await Document.updateStatus(id, 'complete');
      logger.info(`Document processed: ${document.name} (${document.id})`);
    }, 3000);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Document processing started'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch delete multiple documents
 */
const batchDeleteDocuments = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    // Validate request body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Document IDs must be provided as an array',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Get documents to delete
    const documents = await db('documents').whereIn('id', ids);
    
    // Delete files from storage
    for (const doc of documents) {
      if (fs.existsSync(doc.path)) {
        fs.unlinkSync(doc.path);
        
        // Delete encryption metadata file if exists
        if (doc.is_encrypted && doc.encryption_metadata?.metadataPath) {
          if (fs.existsSync(doc.encryption_metadata.metadataPath)) {
            fs.unlinkSync(doc.encryption_metadata.metadataPath);
          }
        }
      }
    }
    
    // Delete documents from database
    const deletedCount = await Document.batchDelete(ids);
    
    // Log document deletion
    logger.info(`Batch deleted ${deletedCount} documents`);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: `${deletedCount} documents deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch update tags
 */
const batchUpdateTags = async (req, res, next) => {
  try {
    const { ids, operation, tags } = req.body;
    
    // Validate request body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Document IDs must be provided as an array',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    if (!tags || !Array.isArray(tags)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Tags must be provided as an array',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    if (!operation || !['add', 'remove', 'set'].includes(operation)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Operation must be one of: add, remove, set',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Get documents to update
    const documents = await db('documents').whereIn('id', ids);
    
    // Update each document
    for (const doc of documents) {
      let updatedTags = doc.tags || [];
      
      switch (operation) {
        case 'add':
          // Add tags that don't already exist
          updatedTags = [...new Set([...updatedTags, ...tags])];
          break;
        case 'remove':
          // Remove specified tags
          updatedTags = updatedTags.filter(tag => !tags.includes(tag));
          break;
        case 'set':
          // Replace all tags
          updatedTags = [...tags];
          break;
      }
      
      // Update document
      await Document.update(doc.id, { tags: updatedTags });
    }
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Tags ${operation}ed for ${documents.length} documents`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch update category
 */
const batchUpdateCategory = async (req, res, next) => {
  try {
    const { ids, category } = req.body;
    
    // Validate request body
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Document IDs must be provided as an array',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    if (!category || typeof category !== 'string') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Category must be provided as a string',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Update documents
    const updatePromises = ids.map(id => Document.update(id, { category }));
    await Promise.all(updatePromises);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Category updated for ${ids.length} documents`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document versions
 */
const getDocumentVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Get versions
    const versions = await DocumentVersion.getAllForDocument(id);
    
    // Return document versions or empty array if none exist
    res.status(StatusCodes.OK).json({
      success: true,
      versions,
      currentVersion: document.current_version || 1,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new document version
 */
const createDocumentVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { changes } = req.body;
    const file = req.file;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Get the latest version number
    const latestVersionNumber = await DocumentVersion.getLatestVersionNumber(id);
    const versionNumber = latestVersionNumber + 1;
    
    // If no versions exist, create the first version with original file
    if (latestVersionNumber === 0) {
      const originalVersion = {
        id: uuidv4(),
        document_id: id,
        version_number: 1,
        created_at: document.uploaded_at,
        file_size: document.size,
        path: document.path
      };
      
      await DocumentVersion.create(originalVersion);
    }
    
    // Create new file path for the version if file is provided
    let filePath = document.path;
    let fileSize = document.size;
    
    if (file) {
      const fileExt = path.extname(document.name);
      const fileName = `${id}_v${versionNumber}${fileExt}`;
      filePath = path.join(STORAGE_DIR, fileName);
      
      // Save the new version file
      fs.writeFileSync(filePath, file.buffer);
      fileSize = file.size;
    }
    
    // Create new version
    const newVersion = {
      id: uuidv4(),
      document_id: id,
      version_number: versionNumber,
      created_at: new Date().toISOString(),
      created_by: req.body.createdBy || 'system',
      changes: changes || 'Document updated',
      file_size: fileSize,
      path: filePath
    };
    
    // Add new version to database
    const version = await DocumentVersion.create(newVersion);
    
    // If this is a file update, update the document's main path
    if (file) {
      await Document.update(id, { 
        path: filePath,
        size: fileSize
      });
    }
    
    // Log version creation
    logger.info(`New version created for document: ${document.name} (${document.id}), version: ${versionNumber}`);
    
    // Return response
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Document version created successfully',
      version
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Restore a document version
 */
const restoreDocumentVersion = async (req, res, next) => {
  try {
    const { id, versionId } = req.params;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Get the version to restore
    const versionToRestore = await DocumentVersion.getById(versionId);
    
    // Check if version exists
    if (!versionToRestore) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Version with ID ${versionId} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Check if version belongs to document
    if (versionToRestore.document_id !== id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: `Version does not belong to document ${id}`,
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Get the latest version number
    const latestVersionNumber = await DocumentVersion.getLatestVersionNumber(id);
    const newVersionNumber = latestVersionNumber + 1;
    
    // Set the restored version as the current one
    const restoredVersion = {
      id: uuidv4(),
      document_id: id,
      version_number: newVersionNumber,
      created_at: new Date().toISOString(),
      created_by: req.body.createdBy || 'system',
      changes: `Restored from version ${versionToRestore.version_number}`,
      file_size: versionToRestore.file_size,
      path: versionToRestore.path
    };
    
    // Add restored version to database
    const version = await DocumentVersion.create(restoredVersion);
    
    // Update document with the restored version
    await Document.update(id, {
      path: versionToRestore.path,
      size: versionToRestore.file_size,
      current_version: newVersionNumber
    });
    
    // Log version restoration
    logger.info(`Restored document ${document.name} (${document.id}) to version ${versionToRestore.version_number}`);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Document restored to version ${versionToRestore.version_number}`,
      version
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Delete a document version
 */
const deleteDocumentVersion = async (req, res, next) => {
  try {
    const { id, versionId } = req.params;
    
    // Get document from database
    const document = await Document.getById(id);
    
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
    
    // Get versions
    const versions = await DocumentVersion.getAllForDocument(id);
    
    // Check if document has versions
    if (!versions || versions.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Document has no versions to delete',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Find the version to delete
    const versionToDelete = versions.find(v => v.id === versionId);
    
    if (!versionToDelete) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: {
          message: `Version with ID ${versionId} not found`,
          statusCode: StatusCodes.NOT_FOUND,
        },
      });
    }
    
    // Check if it's the only version
    if (versions.length === 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Cannot delete the only version of a document',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Check if it's the current version
    if (versionToDelete.version_number === document.current_version) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Cannot delete the current version of a document',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Delete the version file if it's not used by any other version
    const versionPath = versionToDelete.path;
    const isPathUsedByOtherVersions = versions.some(
      v => v.id !== versionId && v.path === versionPath
    );
    
    if (!isPathUsedByOtherVersions && fs.existsSync(versionPath)) {
      fs.unlinkSync(versionPath);
    }
    
    // Remove version from database
    await DocumentVersion.delete(versionId);
    
    // Log version deletion
    logger.info(`Deleted version ${versionToDelete.version_number} of document ${document.name} (${document.id})`);
    
    // Return response
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Document version ${versionToDelete.version_number} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  updateDocumentMetadata,
  updateDocumentProgress,
  deleteDocument,
  getDocumentStatus,
  downloadDocument,
  processDocument,
  batchDeleteDocuments,
  batchUpdateTags,
  batchUpdateCategory,
  getDocumentVersions,
  createDocumentVersion,
  restoreDocumentVersion,
  deleteDocumentVersion
};
