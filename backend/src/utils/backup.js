/**
 * Document backup and restoration utilities
 * 
 * This module provides functionality to create backups of documents
 * and restore them when needed. It supports both encrypted and
 * unencrypted documents.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const archiver = require('archiver');
const extract = require('extract-zip');
const logger = require('./logger');
const config = require('../config');

/**
 * Creates a backup of specified documents or all documents
 * @param {Array<string>} documentPaths - Optional array of document paths to backup
 * @param {string} backupDir - Directory to store the backup
 * @returns {Promise<string>} - Path to the backup file
 */
const createBackup = async (documentPaths = null, backupDir = null) => {
  try {
    // Use default backup directory if not specified
    const targetDir = backupDir || path.join(config.storagePath, '../backups');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFilename = `document-backup-${timestamp}.zip`;
    const backupFilePath = path.join(targetDir, backupFilename);
    
    // Create a write stream for the backup file
    const output = fs.createWriteStream(backupFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression level
    });
    
    // Pipe the archive to the file
    archive.pipe(output);
    
    // Get all document files if specific paths not provided
    const sourceDir = config.storagePath;
    const filesToBackup = documentPaths || await getAllDocumentFiles(sourceDir);
    
    // Add each file to the archive
    for (const filePath of filesToBackup) {
      // Get relative path for archive
      const relativePath = path.relative(path.dirname(sourceDir), filePath);
      
      // Add file to archive
      archive.file(filePath, { name: relativePath });
      
      // If file is encrypted, also backup the metadata file
      const metaFilePath = `${filePath}.meta`;
      if (fs.existsSync(metaFilePath)) {
        const relativeMetaPath = path.relative(path.dirname(sourceDir), metaFilePath);
        archive.file(metaFilePath, { name: relativeMetaPath });
      }
    }
    
    // Finalize the archive
    await archive.finalize();
    
    // Return when the output stream is closed
    return new Promise((resolve, reject) => {
      output.on('close', () => {
        logger.info(`Backup created: ${backupFilePath} (${archive.pointer()} bytes)`);
        resolve(backupFilePath);
      });
      
      archive.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    logger.error(`Error creating backup: ${error.message}`);
    throw error;
  }
};

/**
 * Restores documents from a backup file
 * @param {string} backupFilePath - Path to the backup file
 * @param {string} restoreDir - Optional directory to restore to (defaults to original location)
 * @returns {Promise<Array<string>>} - Array of restored file paths
 */
const restoreBackup = async (backupFilePath, restoreDir = null) => {
  try {
    // Use default restore directory if not specified
    const targetDir = restoreDir || config.storagePath;
    
    // Create restore directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // Extract the backup zip file
    await extract(backupFilePath, { dir: path.dirname(targetDir) });
    
    // Get all restored files
    const restoredFiles = await getAllDocumentFiles(targetDir);
    
    logger.info(`Backup restored: ${backupFilePath} to ${targetDir}`);
    return restoredFiles;
  } catch (error) {
    logger.error(`Error restoring backup: ${error.message}`);
    throw error;
  }
};

/**
 * Gets all document files in a directory recursively
 * @param {string} directory - Directory to scan
 * @returns {Promise<Array<string>>} - Array of file paths
 */
const getAllDocumentFiles = async (directory) => {
  const files = [];
  
  // Helper function to recursively get files
  const getFiles = async (dir) => {
    const items = await readdir(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const itemStat = await stat(itemPath);
      
      if (itemStat.isDirectory()) {
        await getFiles(itemPath);
      } else {
        // Skip .meta files (they'll be included with their parent file)
        if (!item.endsWith('.meta')) {
          files.push(itemPath);
        }
      }
    }
  };
  
  await getFiles(directory);
  return files;
};

/**
 * Lists available backups
 * @param {string} backupDir - Directory containing backups
 * @returns {Promise<Array<Object>>} - Array of backup information objects
 */
const listBackups = async (backupDir = null) => {
  try {
    // Use default backup directory if not specified
    const targetDir = backupDir || path.join(config.storagePath, '../backups');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
      return [];
    }
    
    // Get all backup files
    const files = await readdir(targetDir);
    const backups = [];
    
    // Get info for each backup file
    for (const file of files) {
      if (file.endsWith('.zip')) {
        const filePath = path.join(targetDir, file);
        const fileStat = await stat(filePath);
        
        backups.push({
          name: file,
          path: filePath,
          size: fileStat.size,
          createdAt: fileStat.birthtime,
        });
      }
    }
    
    // Sort by creation date (newest first)
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    logger.error(`Error listing backups: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createBackup,
  restoreBackup,
  listBackups
}; 