/**
 * Backup routes
 * 
 * API routes for document backup and restoration.
 */

const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

/**
 * @swagger
 * /backups:
 *   post:
 *     summary: Create a backup
 *     description: Create a backup of all documents
 *     parameters:
 *       - in: query
 *         name: directory
 *         schema:
 *           type: string
 *         description: Optional custom backup directory
 *     responses:
 *       201:
 *         description: Backup created successfully
 *       500:
 *         description: Server error
 */
router.post('/', backupController.createBackup);

/**
 * @swagger
 * /backups:
 *   get:
 *     summary: List backups
 *     description: Get a list of all available backups
 *     parameters:
 *       - in: query
 *         name: directory
 *         schema:
 *           type: string
 *         description: Optional custom backup directory
 *     responses:
 *       200:
 *         description: List of backups
 *       500:
 *         description: Server error
 */
router.get('/', backupController.listBackups);

/**
 * @swagger
 * /backups/restore:
 *   post:
 *     summary: Restore from backup
 *     description: Restore documents from a backup
 *     parameters:
 *       - in: query
 *         name: directory
 *         schema:
 *           type: string
 *         description: Optional custom restore directory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backupPath:
 *                 type: string
 *                 description: Path to the backup file
 *             required:
 *               - backupPath
 *     responses:
 *       200:
 *         description: Backup restored successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/restore', backupController.restoreBackup);

module.exports = router; 