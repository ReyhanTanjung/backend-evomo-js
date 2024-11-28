// routes/apiRoutes.js
const express = require('express');
const admin = require('firebase-admin');
const { formatDate } = require('../utils/dateFormatter');
const DatabaseService = require('../services/databaseService');
const { sendAnomaliesNotification } = require('../utils/cloudMessaging');

const router = express.Router();

// Endpoint untuk mengambil data historis berdasarkan lokasi dan rentang waktu
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

// Endpoint untuk mengambil dua data terakhir berdasarkan lokasi
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

// Endpoint untuk mengambil semua data anomali
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

// Endpoint untuk mengambil detail anomali berdasarkan ID
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
      anomaly_type: result[0].anomaly_type
    }];

    res.json(anomalyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// Testing purposes
router.post("/send-notification", async (req, res) => {
  const anomalyData = {
    timestamp: "2024-11-28 15:30:00",
    anomaly: "Overheating detected",
    location: "Jakarta",
  };

  sendAnomaliesNotification(anomalyData)
    .then(response => {
      console.log("Notifikasi berhasil dikirim:", response);
      res.status(200).json({ message: 'Notifikasi berhasil dikirim' });
    })
    .catch(error => {
      console.error("Gagal mengirim notifikasi:", error);
      res.status(500).json({ message: 'Notifikasi gagal dikirim' });
    });
});

// Testing purposes
router.post("/hours-usage", async (req, res) => {
  try {
    await DatabaseService.saveHoursUsage();
    res.status(200).json({ message: 'Hours Usage berhasil dihitung' });
  } catch (err) {
    logWithTimestamp(`Gagal menghitung hours usage: ${err.message}`);
    res.status(500).json({ error: 'Gagal menghitung hours usage' });
  }
});

module.exports = router;