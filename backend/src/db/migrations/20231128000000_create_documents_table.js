/**
 * Migration to create the documents table
 */
exports.up = function(knex) {
  return knex.schema.createTable('documents', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('name').notNullable();
    table.integer('size').notNullable();
    table.string('type').notNullable();
    table.string('path').notNullable();
    table.timestamp('uploaded_at').defaultTo(knex.fn.now()).notNullable();
    table.enum('status', ['uploading', 'uploaded', 'processing', 'error', 'complete']).defaultTo('uploading').notNullable();
    table.integer('progress').defaultTo(0).notNullable();
    table.string('error');
    table.specificType('tags', 'text[]');
    table.string('category');
    table.boolean('is_favorite').defaultTo(false);
    table.boolean('is_encrypted').defaultTo(false);
    table.jsonb('metadata');
    table.jsonb('validation_result');
    table.jsonb('encryption_metadata');
    table.integer('current_version').defaultTo(1);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('documents');
}; 