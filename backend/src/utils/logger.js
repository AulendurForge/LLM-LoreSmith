const pino = require('pino');
const config = require('../config');

// Create a logger instance
const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  base: {
    env: config.nodeEnv,
  },
});

module.exports = logger; 