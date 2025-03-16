require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  
  // Database configuration
  dbUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/llm_loresmith',
  
  // Storage configuration
  storageType: process.env.STORAGE_TYPE || 'local', // 'local', 's3', etc.
  storagePath: process.env.STORAGE_PATH || './data/documents',
  
  // Encryption configuration
  encryption: {
    enabled: process.env.ENCRYPTION_ENABLED === 'true' || true,
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    encryptionKey: process.env.ENCRYPTION_KEY, // Should be set in production environment
    keyLength: 32, // 256 bits
  },
  
  // AWS configuration (for S3 storage)
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  
  // Redis configuration (for caching and rate limiting)
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Document processing
  maxFileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ],
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config; 