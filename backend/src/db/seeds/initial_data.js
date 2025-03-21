/**
 * Seed file to add initial data to the database
 */
const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Check if we already have documents
  const existingDocs = await knex('documents').select('id').limit(1);
  
  // If we have data, don't seed
  if (existingDocs.length > 0) {
    console.log('Database already has data, skipping seed operation');
    return;
  }
  
  console.log('Seeding initial data...');
  
  // Create a demo document
  const documentId = uuidv4();
  const documentVersionId = uuidv4();
  
  // Truncate existing tables if they exist
  await knex('document_versions').del();
  await knex('documents').del();
  
  // Insert sample document
  await knex('documents').insert({
    id: documentId,
    name: 'Sample Document.pdf',
    size: 1024, // 1KB
    type: 'application/pdf',
    path: 'sample-path/sample-document.pdf',
    uploaded_at: new Date().toISOString(),
    status: 'complete',
    progress: 100,
    tags: ['sample', 'demo'],
    category: 'Documentation',
    is_favorite: true,
    is_encrypted: false,
    metadata: JSON.stringify({
      author: 'LLM LoreSmith',
      created: new Date().toISOString(),
      pages: 5,
      description: 'A sample document for demonstration purposes'
    }),
    validation_result: JSON.stringify({
      valid: true,
      score: 0.95,
      details: {
        format: 'valid',
        content: 'valid'
      }
    }),
    current_version: 1
  });
  
  // Insert sample document version
  await knex('document_versions').insert({
    id: documentVersionId,
    document_id: documentId,
    version_number: 1,
    created_at: new Date().toISOString(),
    created_by: 'system',
    changes: 'Initial version',
    file_size: 1024, // 1KB
    path: 'sample-path/sample-document.pdf'
  });
  
  console.log('Seeding completed');
}; 