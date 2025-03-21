const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { StatusCodes } = require('http-status-codes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import routes
const documentsRoutes = require('./api/routes/documentsRoutes');
const backupRoutes = require('./api/routes/backupRoutes');

// Import config
const config = require('./config');
const logger = require('./utils/logger');

// Import database connection
const { db, testConnection } = require('./db');
const setupDatabase = require('./db/setup');
const { initializeStorage } = require('./utils/storage');

// Create Express app
const app = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LLM LoreSmith API',
      version: '1.0.0',
      description: 'API for LLM LoreSmith - A system for fine-tuning LLMs with trusted documents',
      contact: {
        name: 'Aulendur LLC',
        url: 'https://www.aulendur.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/api/routes/*.js', './src/api/models/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(compression()); // Compress responses
app.use(morgan('dev')); // HTTP request logger

// API routes
app.use('/api/documents', documentsRoutes);
app.use('/api/backups', backupRoutes);

// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = config.port || 5000;

// Initialize the application
const init = async () => {
  try {
    // Initialize storage
    const storageInitialized = initializeStorage();
    if (!storageInitialized) {
      logger.error('Storage initialization failed. Exiting application.');
      process.exit(1);
    }
    
    // Setup database (create if not exists and run migrations)
    const dbSetupSuccess = await setupDatabase();
    if (!dbSetupSuccess) {
      logger.error('Database setup failed. Exiting application.');
      process.exit(1);
    }
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting application.');
      process.exit(1);
    }
    
    // Start the server if initialization successful
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Error during initialization:', error);
    process.exit(1);
  }
};

// Start the application
init();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

module.exports = app; 