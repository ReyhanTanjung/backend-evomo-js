// services/databaseService.js
const { Client } = require('pg');
const dbConfig = require('../config/database');
const { logWithTimestamp } = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.client = new Client(dbConfig);
    this.connect();
  }

  connect() {
    this.client.connect()
      .then(() => logWithTimestamp('Database connected successfully'))
      .catch(err => logWithTimestamp(`Database connection error: ${err.message}`));
  }

  async saveDataToDb(location, data) {
    const query = `
      WITH inserted_sensor_data AS (
        INSERT INTO sensor_data(
          reading_time, position, meter_type, meter_serial_number, 
          active_energy_import, active_energy_export, reactive_energy_import, 
          reactive_energy_export, apparent_energy_import, apparent_energy_export
        ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      )
      INSERT INTO anomaly_data(sensor_data_id, anomaly_type)
      SELECT id, $11
      FROM inserted_sensor_data;
    `;
    
    const values = [
      data.reading_time,
      location,
      data.meter_type,
      data.meter_serial_number,
      data.active_energy_import_diff,
      data.active_energy_export_diff,
      data.reactive_energy_import_diff,
      data.reactive_energy_export_diff,
      data.apparent_energy_import_diff,
      data.apparent_energy_export_diff,
      data.anomaly_type || 'NORMAL'
    ];

    try {
      await this.client.query(query, values);
      logWithTimestamp(`Differential data from ${location} saved successfully`);
    } catch (err) {
      logWithTimestamp(`Error saving data to DB: ${err.message}`);
    }
  }

  async fetchHistoricalData(location, startdate, enddate) {
    let query = 'SELECT * FROM sensor_data WHERE position = $1';
    const queryParams = [location];

    if (startdate) {
      query += ' AND reading_time >= $' + (queryParams.length + 1);
      queryParams.push(new Date(startdate));
    }

    if (enddate) {
      query += ' AND reading_time <= $' + (queryParams.length + 1);
      queryParams.push(new Date(enddate));
    }

    const result = await this.client.query(query, queryParams);
    return result.rows;
  }

  async fetchLastTwoRecords(location) {
    const query = `
      SELECT * FROM sensor_data 
      WHERE position = $1 
      ORDER BY reading_time DESC 
      LIMIT 2
    `;

    const result = await this.client.query(query, [location]);
    return result.rows;
  }

  async fetchAnomalies() {
    const query = `
      SELECT ad.sensor_data_id as id, sd.position, sd.reading_time, ad.anomaly_type
      FROM anomaly_data ad
      JOIN sensor_data sd ON ad.sensor_data_id = sd.id
      ORDER BY sd.reading_time DESC
    `;

    const result = await this.client.query(query);
    return result.rows;
  }

  async fetchAnomalyDetails(id) {
    const query = `
      SELECT sd.*, ad.anomaly_type
      FROM sensor_data sd
      JOIN anomaly_data ad ON sd.id = ad.sensor_data_id
      WHERE sd.id = $1
    `;

    const result = await this.client.query(query, [id]);
    return result.rows;
  }

  close() {
    this.client.end();
  }
}

module.exports = new DatabaseService();