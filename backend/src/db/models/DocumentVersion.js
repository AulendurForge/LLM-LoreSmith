/**
 * DocumentVersion model for database operations
 */
const { db } = require('../index');

class DocumentVersion {
  /**
   * Get all versions for a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>}
   */
  static async getAllForDocument(documentId) {
    return db('document_versions')
      .where({ document_id: documentId })
      .orderBy('version_number', 'desc');
  }
  
  /**
   * Get a specific version
   * @param {string} id - Version ID
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    return db('document_versions').where({ id }).first();
  }
  
  /**
   * Get a specific version by document ID and version number
   * @param {string} documentId - Document ID
   * @param {number} versionNumber - Version number
   * @returns {Promise<Object|null>}
   */
  static async getByVersionNumber(documentId, versionNumber) {
    return db('document_versions')
      .where({ document_id: documentId, version_number: versionNumber })
      .first();
  }
  
  /**
   * Create a new version
   * @param {Object} version - Version data
   * @returns {Promise<Object>}
   */
  static async create(version) {
    const [result] = await db('document_versions').insert(version).returning('*');
    
    // Update the document's current version
    await db('documents')
      .where({ id: version.document_id })
      .update({ current_version: version.version_number });
    
    return result;
  }
  
  /**
   * Get the latest version number for a document
   * @param {string} documentId - Document ID
   * @returns {Promise<number>}
   */
  static async getLatestVersionNumber(documentId) {
    const result = await db('document_versions')
      .where({ document_id: documentId })
      .max('version_number as max_version');
    
    return result[0]?.max_version || 0;
  }
  
  /**
   * Delete a version
   * @param {string} id - Version ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await db('document_versions')
      .where({ id })
      .delete();
    return result > 0;
  }
}

module.exports = DocumentVersion; 