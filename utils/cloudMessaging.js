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

    // Konversi semua data menjadi string
    const stringData = {
      timestamp: data.timestamp ? data.timestamp.toString() : '',
      anomaly: data.anomaly ? data.anomaly.toString() : '',
      location: data.location ? data.location.toString() : ''
    };

    const message = {
      notification: {
        title: "Anomaly Notification",
        body: `Anomaly energy usage`,
      },
      data: stringData,
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