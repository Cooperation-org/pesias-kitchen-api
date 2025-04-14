// const mongoose = require('mongoose');
const app = require('./src/app');
const logger = require('./src/utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
let server;

(async () => {
  try {
    const connectDB = require('./src/config/database');
    await connectDB();
    
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
      logger.error(`Server error: ${err.message}`);
      process.exit(1);
    });

  } catch (err) {
    logger.error(`Startup error: ${err.message}`);
    process.exit(1);
  }
})();

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});