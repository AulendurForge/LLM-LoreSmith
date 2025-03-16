/**
 * Encryption utilities for document storage
 * 
 * This module provides functionality to encrypt and decrypt files 
 * using AES-256-GCM encryption to ensure document security at rest.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const config = require('../config');

// Encryption key and initialization vector management
const getEncryptionKey = () => {
  // Use environment variable or generate a key (in production, this should be stored securely)
  return process.env.ENCRYPTION_KEY || crypto.scryptSync('default-key-for-development-only', 'salt', 32);
};

/**
 * Encrypts a file using AES-256-GCM
 * @param {string} sourcePath - Path to the source file
 * @param {string} destinationPath - Path where the encrypted file will be saved
 * @returns {Promise<Object>} - Object containing encryption metadata
 */
const encryptFile = async (sourcePath, destinationPath) => {
  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  
  // Create cipher using AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // Create read and write streams
  const readStream = fs.createReadStream(sourcePath);
  const writeStream = fs.createWriteStream(destinationPath);
  
  // Write IV at the beginning of the file
  writeStream.write(iv);
  
  try {
    // Pipe the file through the cipher
    await pipeline(readStream, cipher, writeStream);
    
    // Get the authentication tag and append it to a metadata file
    const authTag = cipher.getAuthTag();
    
    // Create metadata for decryption
    const metadata = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: 'aes-256-gcm'
    };
    
    // Write metadata to a separate file
    const metadataPath = `${destinationPath}.meta`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    
    return {
      encryptedPath: destinationPath,
      metadataPath,
      metadata
    };
  } catch (error) {
    // Clean up in case of error
    if (fs.existsSync(destinationPath)) {
      fs.unlinkSync(destinationPath);
    }
    throw error;
  }
};

/**
 * Decrypts a file using AES-256-GCM
 * @param {string} encryptedPath - Path to the encrypted file
 * @param {string} destinationPath - Path where the decrypted file will be saved
 * @param {Object} metadata - Optional metadata object (if not provided, will load from .meta file)
 * @returns {Promise<string>} - Path to the decrypted file
 */
const decryptFile = async (encryptedPath, destinationPath, metadata = null) => {
  // If metadata not provided, load it from the metadata file
  if (!metadata) {
    const metadataPath = `${encryptedPath}.meta`;
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Encryption metadata not found');
    }
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  }
  
  const key = getEncryptionKey();
  const iv = Buffer.from(metadata.iv, 'hex');
  const authTag = Buffer.from(metadata.authTag, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  // Skip IV in the encrypted file (first 16 bytes)
  const readStream = fs.createReadStream(encryptedPath, { start: 16 });
  const writeStream = fs.createWriteStream(destinationPath);
  
  try {
    // Pipe the file through the decipher
    await pipeline(readStream, decipher, writeStream);
    return destinationPath;
  } catch (error) {
    // Clean up in case of error
    if (fs.existsSync(destinationPath)) {
      fs.unlinkSync(destinationPath);
    }
    throw error;
  }
};

/**
 * Reads an encrypted file into memory (for small files only)
 * @param {string} encryptedPath - Path to the encrypted file
 * @returns {Promise<Buffer>} - Decrypted file contents as a buffer
 */
const readEncryptedFile = async (encryptedPath) => {
  const tempPath = `${encryptedPath}.temp`;
  await decryptFile(encryptedPath, tempPath);
  
  try {
    const contents = fs.readFileSync(tempPath);
    return contents;
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
};

module.exports = {
  encryptFile,
  decryptFile,
  readEncryptedFile
}; 