/**
 * Backup controller
 * 
 * Handles document backup and restoration operations.
 */

const { StatusCodes } = require('http-status-codes');
const path = require('path');
const backup = require('../../utils/backup');
const logger = require('../../utils/logger');

/**
 * Create a backup of all documents
 */
const createBackup = async (req, res, next) => {
  try {
    // Get optional custom backup directory from query
    const customBackupDir = req.query.directory || null;
    
    // Create the backup
    const backupPath = await backup.createBackup(null, customBackupDir);
    
    // Return success response
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        path: backupPath,
        filename: path.basename(backupPath),
      },
    });
  } catch (error) {
    logger.error(`Error creating backup: ${error.message}`);
    next(error);
  }
};

/**
 * List all available backups
 */
const listBackups = async (req, res, next) => {
  try {
    // Get optional custom backup directory from query
    const customBackupDir = req.query.directory || null;
    
    // Get list of backups
    const backups = await backup.listBackups(customBackupDir);
    
    // Return success response
    res.status(StatusCodes.OK).json({
      success: true,
      count: backups.length,
      backups,
    });
  } catch (error) {
    logger.error(`Error listing backups: ${error.message}`);
    next(error);
  }
};

/**
 * Restore documents from a backup
 */
const restoreBackup = async (req, res, next) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Backup path is required',
          statusCode: StatusCodes.BAD_REQUEST,
        },
      });
    }
    
    // Get optional custom restore directory from query
    const restoreDir = req.query.directory || null;
    
    // Restore the backup
    const restoredFiles = await backup.restoreBackup(backupPath, restoreDir);
    
    // Return success response
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Backup restored successfully',
      restoredFiles: restoredFiles.length,
      restoreDirectory: restoreDir,
    });
  } catch (error) {
    logger.error(`Error restoring backup: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createBackup,
  listBackups,
  restoreBackup,
}; 