// utils/logger.js
const logWithTimestamp = (message) => {
  // Mengambil waktu dengan zona waktu Asia/Jakarta
  const jakartaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  
  // Mencetak log dengan format yang diinginkan
  console.log(`[${jakartaTime}] ${message}`);
};

module.exports = {
  logWithTimestamp
};