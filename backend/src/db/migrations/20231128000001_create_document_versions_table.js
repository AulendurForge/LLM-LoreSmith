/**
 * Migration to create the document versions table
 */
exports.up = function(knex) {
  return knex.schema.createTable('document_versions', (table) => {
    table.uuid('id').primary().notNullable();
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE');
    table.integer('version_number').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.string('created_by');
    table.text('changes');
    table.integer('file_size').notNullable();
    table.string('path').notNullable();
    
    // Add a unique constraint to ensure each document has unique version numbers
    table.unique(['document_id', 'version_number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('document_versions');
}; 