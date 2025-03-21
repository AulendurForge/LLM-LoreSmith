const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');
const documentsController = require('../controllers/documentsController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.storagePath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// File filter to only allow specific file types
const fileFilter = (req, file, cb) => {
  if (config.allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${config.allowedFileTypes.join(', ')}`), false);
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
});

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get all documents
 *     description: Retrieve a list of all documents with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: A list of documents
 *       500:
 *         description: Server error
 */
router.get('/', documentsController.getAllDocuments);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get a document by ID
 *     description: Retrieve a single document by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document found
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id', documentsController.getDocumentById);

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Upload a new document
 *     description: Upload a new document file
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/', upload.single('file'), documentsController.uploadDocument);

/**
 * @swagger
 * /documents/{id}/metadata:
 *   patch:
 *     summary: Update document metadata
 *     description: Update metadata for a specific document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Metadata updated successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/metadata', documentsController.updateDocumentMetadata);

/**
 * @swagger
 * /documents/{id}:
 *   patch:
 *     summary: Update document basic information
 *     description: Update basic information like name and type for a specific document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', documentsController.updateDocument);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Delete a document by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', documentsController.deleteDocument);

/**
 * @swagger
 * /documents/{id}/process:
 *   post:
 *     summary: Process a document
 *     description: Start processing a document for metadata extraction and validation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Processing started successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.post('/:id/process', documentsController.processDocument);

/**
 * @swagger
 * /documents/{id}/status:
 *   get:
 *     summary: Get document processing status
 *     description: Get the current processing status of a document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document status retrieved successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id/status', documentsController.getDocumentStatus);

/**
 * @swagger
 * /documents/{id}/download:
 *   get:
 *     summary: Download a document
 *     description: Download a document file by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id/download', documentsController.downloadDocument);

/**
 * @swagger
 * /documents/batch:
 *   delete:
 *     summary: Delete multiple documents
 *     description: Delete multiple documents by their IDs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs to delete
 *     responses:
 *       200:
 *         description: Documents deleted successfully
 *       400:
 *         description: Invalid input - IDs array required
 *       500:
 *         description: Server error
 */
router.delete('/batch', documentsController.batchDeleteDocuments);

/**
 * @swagger
 * /documents/batch/tags:
 *   patch:
 *     summary: Update tags for multiple documents
 *     description: Add, remove, or set tags for multiple documents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs to update
 *               operation:
 *                 type: string
 *                 enum: [add, remove, set]
 *                 description: The tag operation to perform
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags for the operation
 *     responses:
 *       200:
 *         description: Tags updated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.patch('/batch/tags', documentsController.batchUpdateTags);

/**
 * @swagger
 * /documents/batch/category:
 *   patch:
 *     summary: Update category for multiple documents
 *     description: Set category for multiple documents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of document IDs to update
 *               category:
 *                 type: string
 *                 description: Category to set for all documents
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.patch('/batch/category', documentsController.batchUpdateCategory);

/**
 * @swagger
 * /documents/{id}/versions:
 *   get:
 *     summary: Get document versions
 *     description: Retrieve all versions of a document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document versions retrieved successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.get('/:id/versions', documentsController.getDocumentVersions);

/**
 * @swagger
 * /documents/{id}/versions:
 *   post:
 *     summary: Create a new document version
 *     description: Create a new version of a document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               changes:
 *                 type: string
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document version created successfully
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
router.post('/:id/versions', upload.single('file'), documentsController.createDocumentVersion);

/**
 * @swagger
 * /documents/{id}/versions/{versionId}/restore:
 *   post:
 *     summary: Restore a document version
 *     description: Restore a document to a previous version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Version ID
 *     responses:
 *       200:
 *         description: Document version restored successfully
 *       404:
 *         description: Document or version not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/:id/versions/:versionId/restore', documentsController.restoreDocumentVersion);

/**
 * @swagger
 * /documents/{id}/versions/{versionId}:
 *   delete:
 *     summary: Delete a document version
 *     description: Delete a specific version of a document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Version ID
 *     responses:
 *       200:
 *         description: Document version deleted successfully
 *       404:
 *         description: Document or version not found
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.delete('/:id/versions/:versionId', documentsController.deleteDocumentVersion);

module.exports = router; 