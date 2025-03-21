# Database Implementation

This directory contains the database implementation for the LLM-LoreSmith application.

## Structure

- `index.js` - Main database connection module
- `knexfile.js` - Knex.js configuration file
- `setup.js` - Database setup script (creates database and runs migrations)
- `migrations/` - Database migrations
- `models/` - Database models
- `seeds/` - Database seed data

## Database Configuration

The database configuration is stored in the `knexfile.js` file and uses the configuration from `../config/index.js`. 
The default configuration uses PostgreSQL with the connection URL from the `dbUrl` environment variable.

## Models

### Document

The `Document` model provides methods for working with documents in the database:

- `getAll(filters)` - Get all documents with optional filters
- `getById(id)` - Get a document by ID
- `create(document)` - Create a new document
- `update(id, updates)` - Update a document
- `delete(id)` - Delete a document
- `updateProgress(id, progress)` - Update document progress
- `updateStatus(id, status, error)` - Update document status
- `updateMetadata(id, metadata)` - Update document metadata
- `updateValidationResult(id, validationResult)` - Update document validation result
- `toggleFavorite(id)` - Toggle document favorite status
- `batchUpdateFavorites(ids, isFavorite)` - Batch update document favorites
- `batchDelete(ids)` - Batch delete documents

### DocumentVersion

The `DocumentVersion` model provides methods for working with document versions:

- `getAllForDocument(documentId)` - Get all versions for a document
- `getById(id)` - Get a version by ID
- `getByVersionNumber(documentId, versionNumber)` - Get a version by document ID and version number
- `create(version)` - Create a new version
- `getLatestVersionNumber(documentId)` - Get the latest version number for a document
- `delete(id)` - Delete a version

## Migrations

The database uses Knex.js migrations to manage the database schema:

- `20231128000000_create_documents_table.js` - Creates the documents table
- `20231128000001_create_document_versions_table.js` - Creates the document versions table

## Seeds

The database uses Knex.js seeds to populate the database with initial data:

- `initial_data.js` - Creates a sample document and version

## Usage

### Setup

To set up the database, run:

```bash
npm run setup:db
```

This will create the database if it doesn't exist, run migrations, and seed the database with initial data.

### Migrations

To run migrations manually, run:

```bash
npm run migrate
```

To rollback migrations, run:

```bash
npm run migrate:rollback
```

### Seeds

To run seeds manually, run:

```bash
npm run seed
``` 