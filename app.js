/**
 * IoT Energy Monitoring Application
 * @module app
 * @description Central coordination and entry point for IoT-based energy monitoring application
 */

// Import Dependencies
const cron = require('node-cron');
const admin = require("firebase-admin");
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv')
const { logWithTimestamp } = require('./utils/logger');

// Environment Configuration
dotenv.config();

// Firebase Initialization
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Import Configurations
const mqttConfig = require('./config/mqtt');
const { locationMapping, topics } = require('./config/topics');

// Import Services
const MqttService = require('./services/mqttService');
const DatabaseService = require('./services/databaseService');
const DataProcessor = require('./services/dataProcessor');

// Import Routes
const apiRoutes = require('./routes/apiRoutes');

// Express App Setup
const app = express();
app.use(bodyParser.json());
app.use('/api', apiRoutes);

// Data Preparation
const locations = Object.values(locationMapping);
const dataProcessor = new DataProcessor(locations);

/**
 * MQTT Message Handler
 * @param {string} topic - MQTT topic
 * @param {Buffer} message - MQTT payload
 */
const handleMqttMessage = async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    const location = locationMapping[topic];
    const payload = JSON.parse(data.data);

    const differentialData = dataProcessor.calculateDifference(location, payload);
    
    if (differentialData.active_energy_import_diff !== undefined) {
      const dataToSave = { ...payload, ...differentialData };
      await DatabaseService.saveDataToDb(location, dataToSave);
    }
  } catch (error) {
    logWithTimestamp(`Error processing MQTT message: ${error.message}`);
  }
};

// MQTT Service Initialization
const mqttService = new MqttService(
  mqttConfig.brokerUrl, 
  mqttConfig.options, 
  topics, 
  handleMqttMessage
);

// Periodic Data Processing Schedule
cron.schedule('5 * * * *', async () => {
  // Fungsi Save Average Hours Usage ke tabel hours_usage untuk setiap lokasi
  await DatabaseService.saveHoursUsage();
  // Fetch data 24 jam terakhir dari setiap lokasi dan kirim ke Endpoint Model ML
  // Simpan respon prediksi dari Model ML ke suatu variabel untuk setiap lokasi (respon prediksi adalah data prediksi penggunaan 1 jam kedepan)
  // Fetch data 1 jam terakhir dari setiap lokasi
  // Bandingkan dengan data prediksi
  // Apabila ada Anomaly kirim notifikasi dengan fungsi sendAnomaliesNotification di utils/cloudMessaging dan simpan data ke database di tabel anomaly_data dengan id merupakan id dari data pada hours_usage
  // Field data yang perlu diisi ada di contoh routes/apiRoutes.js router.post() (fungsi ini nanti di apus karena contoh doang) 
  // untuk testing jangan, pake database postgres sekarang, tapi pake localhost aja
  // Di services/databaseServic.js ada fungsi fetchLast24HoursUsage (ngambil data 24 jam), sendAnomalyPredictionRequest (kirim data anomaly), processAnomalyPredictions (proses data prediksi untuk menntukan anomaly) tapi belum dicoba

  // Contoh Cases:
  // Jam 9 pagi ada data masuk
  // Simpan data average selama satu jam (8-9) kedalam tabel hours_usage di database
  // Fetch data 24 jam terakhir dari tabel hours_usage dan kirim ke Endpoint Model ML
  // Simpan respon prediksi dari Model ML (data untuk jam 10) ke suatu variabel untuk setiap lokasi 
  // Fetch data 1 jam terakhir dari setiap lokasi (data dari jam 8-9) dan bandingkan dengan data prediksi
  // deteksi anomaly, apabila ada anomaly simpan di database dan kirim notifikasi
  // kalau tidak ada, jangan lakukan apa apa
  
});

// Server Configuration
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logWithTimestamp(`Server running on port ${PORT}`);
});

// Graceful Shutdown Handler
process.on('SIGINT', () => {
  mqttService.end();
  DatabaseService.close();
  server.close(() => {
    logWithTimestamp('Server and database connections closed');
    process.exit(0);
  });
});

module.exports = app;
