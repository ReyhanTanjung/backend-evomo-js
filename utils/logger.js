/**
 * Logger
 * @module utils
 * @description Logger with timestamp
 */

const logWithTimestamp = (message) => {
  // Timezone Asia/Jakarta
  const jakartaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  console.log(`[${jakartaTime}] ${message}`);
};

module.exports = {
  logWithTimestamp
};