// utils/logger.js
const logWithTimestamp = (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
  };
  
  module.exports = {
    logWithTimestamp
  };