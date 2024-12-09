/**
 * Firebase Cloud Messaging Function 
 * @module utils
 * @description Firebase Cloud Messaging Function 
 */

const admin = require('firebase-admin');
const { logWithTimestamp } = require('../utils/logger');

/**
 * Send Anomalies Notification
 * @param {JSON} data - JSON Data
 */
const sendAnomaliesNotification = async (data, tokens) => {
  try {
    if (!tokens || tokens.length === 0) {
      logWithTimestamp('No valid tokens found');
      return;
    }

    const message = {
      notification: {
        title: "Anomaly Notification",
        body: "Anomaly on energy usage",
      },
      data,
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