/**
 * Storage utility for managing document storage and retrieval
 */
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./logger');

// Define storage directories
const LOCAL_STORAGE_DIR = path.join(__dirname, '../../data/local-storage');
const TEMP_STORAGE_DIR = path.join(__dirname, '../../data/temp');
const BACKUP_STORAGE_DIR = path.join(__dirname, '../../data/backups');

/**
 * Ensure all storage directories exist
 */
const ensureStorageDirectories = () => {
  const directories = [
    LOCAL_STORAGE_DIR,
    TEMP_STORAGE_DIR,
    BACKUP_STORAGE_DIR
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      logger.info(`Creating storage directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

/**
 * Initialize storage
 */
const initializeStorage = () => {
  try {
    ensureStorageDirectories();
    logger.info('Storage initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing storage:', error);
    return false;
  }
};

/**
 * Save a file to local storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @returns {string} File path
 */
const saveFile = (fileBuffer, fileName) => {
  const filePath = path.join(LOCAL_STORAGE_DIR, fileName);
  fs.writeFileSync(filePath, fileBuffer);
  return filePath;
};

/**
 * Get a file from local storage
 * @param {string} filePath - File path
 * @returns {Buffer} File buffer
 */
const getFile = (filePath) => {
  return fs.readFileSync(filePath);
};

/**
 * Delete a file from local storage
 * @param {string} filePath - File path
 * @returns {boolean} Success
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
};

module.exports = {
  LOCAL_STORAGE_DIR,
  TEMP_STORAGE_DIR,
  BACKUP_STORAGE_DIR,
  initializeStorage,
  saveFile,
  getFile,
  deleteFile
}; 