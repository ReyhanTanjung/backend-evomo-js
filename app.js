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
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
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
  await DatabaseService.saveHoursUsage();
  // Future: Implement anomaly detection and notification
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
