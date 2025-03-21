/**
 * Document model for database operations
 */
const { db } = require('../index');

class Document {
  /**
   * Get all documents
   * @param {Object} filters - Filters to apply to the query
   * @returns {Promise<Array>}
   */
  static async getAll(filters = {}) {
    const query = db('documents').orderBy('uploaded_at', 'desc');
    
    // Apply filters if provided
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
    
    return query;
  }
  
  /**
   * Get a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>}
   */
  static async getById(id) {
    return db('documents').where({ id }).first();
  }
  
  /**
   * Create a new document
   * @param {Object} document - Document data
   * @returns {Promise<Object>}
   */
  static async create(document) {
    const [result] = await db('documents').insert(document).returning('*');
    return result;
  }
  
  /**
   * Update a document
   * @param {string} id - Document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>}
   */
  static async update(id, updates) {
    const [result] = await db('documents')
      .where({ id })
      .update(updates)
      .returning('*');
    return result || null;
  }
  
  /**
   * Delete a document
   * @param {string} id - Document ID
   * @returns {Promise<boolean>}
   */
  static async delete(id) {
    const result = await db('documents')
      .where({ id })
      .delete();
    return result > 0;
  }
  
  /**
   * Update document progress
   * @param {string} id - Document ID
   * @param {number} progress - Progress percentage
   * @returns {Promise<Object|null>}
   */
  static async updateProgress(id, progress) {
    const [result] = await db('documents')
      .where({ id })
      .update({ progress })
      .returning('*');
    return result || null;
  }
  
  /**
   * Update document status
   * @param {string} id - Document ID
   * @param {string} status - Document status
   * @param {string} error - Error message (optional)
   * @returns {Promise<Object|null>}
   */
  static async updateStatus(id, status, error = null) {
    const updates = { status };
    if (error !== null) {
      updates.error = error;
    }
    
    const [result] = await db('documents')
      .where({ id })
      .update(updates)
      .returning('*');
    return result || null;
  }
  
  /**
   * Update document metadata
   * @param {string} id - Document ID
   * @param {Object} metadata - Document metadata
   * @returns {Promise<Object|null>}
   */
  static async updateMetadata(id, metadata) {
    const [result] = await db('documents')
      .where({ id })
      .update({ metadata })
      .returning('*');
    return result || null;
  }
  
  /**
   * Update document validation result
   * @param {string} id - Document ID
   * @param {Object} validationResult - Validation result
   * @returns {Promise<Object|null>}
   */
  static async updateValidationResult(id, validationResult) {
    const [result] = await db('documents')
      .where({ id })
      .update({ validation_result: validationResult })
      .returning('*');
    return result || null;
  }
  
  /**
   * Toggle document favorite status
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>}
   */
  static async toggleFavorite(id) {
    const document = await this.getById(id);
    if (!document) return null;
    
    const [result] = await db('documents')
      .where({ id })
      .update({ is_favorite: !document.is_favorite })
      .returning('*');
    return result || null;
  }
  
  /**
   * Batch update document favorites
   * @param {string[]} ids - Document IDs
   * @param {boolean} isFavorite - Favorite status
   * @returns {Promise<number>} - Number of documents updated
   */
  static async batchUpdateFavorites(ids, isFavorite) {
    return db('documents')
      .whereIn('id', ids)
      .update({ is_favorite: isFavorite });
  }
  
  /**
   * Batch delete documents
   * @param {string[]} ids - Document IDs
   * @returns {Promise<number>} - Number of documents deleted
   */
  static async batchDelete(ids) {
    return db('documents')
      .whereIn('id', ids)
      .delete();
  }
}

module.exports = Document; 