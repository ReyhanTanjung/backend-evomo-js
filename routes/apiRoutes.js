/**
 * API Endpoint Routes
 * @module routes/apiRoutes
 * @description Endpoint Apit
 */

const express = require('express');
const admin = require('firebase-admin');
const { formatDate } = require('../utils/dateFormatter');
const DatabaseService = require('../services/databaseService');
const { sendAnomaliesNotification } = require('../utils/cloudMessaging');

const router = express.Router();

/**
 * API Route to fetch historical data for a specific location within a date range
 * @route GET /fetch_data/:location/:startdate&:enddate
 * @param {string} location - The location identifier
 * @param {string} startdate - Start date for data retrieval
 * @param {string} enddate - End date for data retrieval
 * @returns {Object[]} Formatted energy meter readings
 */
router.get('/fetch_data/:location/:startdate&:enddate', async (req, res) => {
  const { location, startdate, enddate } = req.params;

  try {
    const result = await DatabaseService.fetchHistoricalData(location, startdate, enddate);

    const data = result.map(item => ({
      id: item.id,
      reading_time: formatDate(item.reading_time),
      position: item.position,
      meter_type: item.meter_type,
      meter_serial_number: item.meter_serial_number,
      active_energy_import: item.active_energy_import,
      active_energy_export: item.active_energy_export,
      reactive_energy_import: item.reactive_energy_import,
      reactive_energy_export: item.reactive_energy_export,
      apparent_energy_import: item.apparent_energy_import,
      apparent_energy_export: item.apparent_energy_export
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API Route to fetch the last two records for a specific location
 * @route GET /fetch_data/:location/last_history
 * @param {string} location - The location identifier
 * @returns {Object[]} Last two energy meter readings
 */
router.get('/fetch_data/:location/last_history', async (req, res) => {
  const { location } = req.params;

  try {
    const result = await DatabaseService.fetchLastTwoRecords(location);

    const data = result.map(item => ({
      id: item.id,
      reading_time: formatDate(item.reading_time),
      position: item.position,
      meter_type: item.meter_type,
      meter_serial_number: item.meter_serial_number,
      active_energy_import: item.active_energy_import,
      active_energy_export: item.active_energy_export,
      reactive_energy_import: item.reactive_energy_import,
      reactive_energy_export: item.reactive_energy_export,
      apparent_energy_import: item.apparent_energy_import,
      apparent_energy_export: item.apparent_energy_export
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API Route to fetch all anomaly records
 * @route GET /fetch_data/anomaly
 * @returns {Object[]} List of anomaly records
 */
router.get('/fetch_data/anomaly', async (req, res) => {
  try {
    const result = await DatabaseService.fetchAnomalies();

    const anomalyData = result.map(item => ({
      id: item.id,
      position: item.position,
      reading_time: formatDate(item.reading_time),
      anomaly_type: item.anomaly_type
    }));

    res.json(anomalyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API Route to fetch detailed anomaly information by ID
 * @route GET /fetch_data/anomaly/:id
 * @param {string} id - Unique identifier for the anomaly
 * @returns {Object[]} Detailed anomaly information
 */
router.get('/fetch_data/anomaly/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const result = await DatabaseService.fetchAnomalyDetails(id);

    if (result.length === 0) {
      return res.status(404).json({ error: "Anomaly not found" });
    }

    const anomalyData = [{
      reading_time: formatDate(result[0].reading_time),
      position: result[0].position,
      meter_type: result[0].meter_type,
      meter_serial_number: result[0].meter_serial_number,
      active_energy_import: result[0].active_energy_import,
      active_energy_export: result[0].active_energy_export,
      reactive_energy_import: result[0].reactive_energy_import,
      reactive_energy_export: result[0].reactive_energy_export,
      apparent_energy_import: result[0].apparent_energy_import,
      apparent_energy_export: result[0].apparent_energy_export,
      anomaly_type: result[0].anomaly_type,
      predicted_energy: result[0].predicted_energy
    }];

    res.json(anomalyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * API Route to add a notification token
 * @route POST /add_notification_token
 * @param {Object} req.body - Request body containing notification token
 * @returns {Object} Status of token registration
 */
router.post("/add_notification_token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token tidak ditemukan' });
  }

  try {
    await DatabaseService.saveTokenToDb(token);
    res.status(200).json({ message: 'Token berhasil disimpan' });
  } catch (err) {
    logWithTimestamp(`Error saving token: ${err.message}`);
    res.status(500).json({ error: 'Gagal menyimpan token' });
  }
});

// Testing purposes (Send Notification) Delete Later
/**
 * Test Route for Sending Anomaly Notifications (Should be removed in production)
 * @route POST /send-notification
 * @returns {Object} Notification sending status
 */
// router.post("/send-notification", async (req, res) => {
//   const anomalyData = {
//     timestamp: "2024-11-28 15:30:00",
//     anomaly: "Overheating detected",
//     location: "Jakarta",
//   };

//   sendAnomaliesNotification(anomalyData)
//     .then(response => {
//       console.log("Notifikasi berhasil dikirim:", response);
//       res.status(200).json({ message: 'Notifikasi berhasil dikirim' });
//     })
//     .catch(error => {
//       console.error("Gagal mengirim notifikasi:", error);
//       res.status(500).json({ message: 'Notifikasi gagal dikirim' });
//     });
// });
router.post("/send-notification", async (req, res) => {
  const anomalyData = {
    timestamp: "2024-11-28 15:30:00",
    anomaly: "Overheating detected",
    location: "Jakarta",
  };

  try {
    // Fetch tokens explicitly
    const tokenResult = await DatabaseService.fetchUsersToken();
    const tokens = tokenResult.map(item => item.token);

    const response = await sendAnomaliesNotification(anomalyData, tokens);
    console.log("Notifikasi berhasil dikirim:", response);
    res.status(200).json({ message: 'Notifikasi berhasil dikirim' });
  } catch (error) {
    console.error("Gagal mengirim notifikasi:", error);
    res.status(500).json({ message: 'Notifikasi gagal dikirim' });
  }
});

module.exports = router;