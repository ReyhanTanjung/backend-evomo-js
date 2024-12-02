// app.js
const cron = require('node-cron');
const admin = require("firebase-admin");
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv')
const { logWithTimestamp } = require('./utils/logger');

// Load .env file
dotenv.config();

// Parse Firebase credentials from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Configuration imports
const mqttConfig = require('./config/mqtt');
const { locationMapping, topics } = require('./config/topics');

// Service imports
const MqttService = require('./services/mqttService');
const DatabaseService = require('./services/databaseService');
const DataProcessor = require('./services/dataProcessor');

// Route imports
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.use(bodyParser.json());
app.use('/api', apiRoutes);

// Get locations from location mapping
const locations = Object.values(locationMapping);

// Initialize data processor
const dataProcessor = new DataProcessor(locations);

// MQTT message handler
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

// Initialize MQTT Service
const mqttService = new MqttService(
  mqttConfig.brokerUrl, 
  mqttConfig.options, 
  topics, 
  handleMqttMessage
);

// Schedulling to calculate average usage per hour for every XX:05:XX
cron.schedule('5 * * * *', async () => {
  await DatabaseService.saveHoursUsage();
  // Implement querry to get last usage in 24 hours
  // Send Notification and save to database if there is anomaly
  // Send notif use sendAnomaliesNotification()
});

// Run server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logWithTimestamp(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  mqttService.end();
  DatabaseService.close();
  server.close(() => {
    logWithTimestamp('Server and database connections closed');
    process.exit(0);
  });
});

module.exports = app;
