const admin = require('firebase-admin');
const DatabaseService = require('../services/databaseService');
const { logWithTimestamp } = require('../utils/logger');

const sendAnomaliesNotification = async (data) => {
    try {
      const result = await DatabaseService.fetchUsersToken();
  
      const tokens = result.map(item => item.token);
  
      if (tokens.length === 0) {
        logWithTimestamp('No valid tokens found in database');
        return;
      }
  
      const message = {
        notification: {
          title: "Anomaly Notification",
          body: "Anomaly on energy usage",
        },
        data: {
          timestamp: data.timestamp || "",
          anomaly: data.anomaly || "NORMAL",
          location: data.location || "",
        },
        tokens: tokens,
      };
  
      const response = await admin.messaging().sendEachForMulticast(message);
  
      logWithTimestamp(`Notifikasi berhasil dikirim: ${JSON.stringify(response)}`);
      
      return response;
    } catch (error) {
      logWithTimestamp(`Gagal mengirim notifikasi: ${error.message}`);
      throw error;
    }
};

module.exports = {
    sendAnomaliesNotification
};