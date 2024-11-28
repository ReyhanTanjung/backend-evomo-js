// services/databaseService.js
const { Client } = require('pg');
const dbConfig = require('../config/database');
const { logWithTimestamp } = require('../utils/logger');
const dayjs = require('dayjs');

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
      INSERT INTO sensor_data(
        reading_time, position, meter_type, meter_serial_number, 
        active_energy_import, active_energy_export, reactive_energy_import, 
        reactive_energy_export, apparent_energy_import, apparent_energy_export
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    ];

    try {
      await this.client.query(query, values);
      logWithTimestamp(`Differential data from ${location} saved successfully`);
    } catch (err) {
      logWithTimestamp(`Error saving data to DB: ${err.message}`);
    }
  }

  async saveTokenToDb(token) {
    const jakartaTime = new Date().toISOString().slice(0, 10);
    const query = `
      INSERT INTO user_token(token, init_time)
      VALUES($1, $2)
    `;
    
    const values = [
      token,
      jakartaTime
    ];

    try {
      await this.client.query(query, values);
      logWithTimestamp(`User Token ${token} saved successfully`);
    } catch (err) {
      logWithTimestamp(`Error saving data to DB: ${err.message}`);
    }
  }

  async saveHoursUsage() {
    try {
      const currentTime = new Date();
      
      const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000);

      const query = `
          SELECT position, meter_type, meter_serial_number, 
                AVG(active_energy_import) AS avg_active_energy_import,
                AVG(active_energy_export) AS avg_active_energy_export,
                AVG(reactive_energy_import) AS avg_reactive_energy_import,
                AVG(reactive_energy_export) AS avg_reactive_energy_export,
                AVG(apparent_energy_import) AS avg_apparent_energy_import,
                AVG(apparent_energy_export) AS avg_apparent_energy_export
          FROM sensor_data
          WHERE reading_time BETWEEN $1 AND $2
          GROUP BY position, meter_type, meter_serial_number
      `;

      const result = await this.client.query(query, [oneHourAgo, currentTime]);

      for (const row of result.rows) {
          const insertQuery = `
              INSERT INTO hours_usage (
                  reading_time, position, meter_type, meter_serial_number, 
                  active_energy_import, active_energy_export,
                  reactive_energy_import, reactive_energy_export,
                  apparent_energy_import, apparent_energy_export
              ) VALUES (
                  $1, $2, 
                  $3, $4, 
                  $5, $6, 
                  $7, $8,
                  $9, $10
              )
          `;
          // Menyimpan data rata-rata ke tabel hours_usage
          await this.client.query(insertQuery, [
              currentTime, 
              row.position,
              row.meter_type,
              row.meter_serial_number, 
              row.avg_active_energy_import, 
              row.avg_active_energy_export, 
              row.avg_reactive_energy_import, 
              row.avg_reactive_energy_export, 
              row.avg_apparent_energy_import, 
              row.avg_apparent_energy_export
          ]);
      }

      console.log('Data berhasil disimpan ke tabel hours_usage.');
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
    }
  }

  async fetchUsersToken() {
    const query = 'SELECT token, init_time FROM user_token';

    try {
      const result = await this.client.query(query);
      const now = dayjs();

      const validTokens = result.rows.filter(item => {
        const initTime = dayjs(item.init_time);
        const diffInDays = now.diff(initTime, 'day'); 
        return diffInDays <= 270;
      });

      return validTokens;
    } catch (err) {
      logWithTimestamp(`Error fetching tokens from DB: ${err.message}`);
      throw err;
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
      SELECT ad.hours_usage_id as id, hu.position, hu.reading_time, ad.anomaly_type
      FROM anomaly_data ad
      JOIN hours_usage hu ON ad.hours_usage_id = hu.id
      ORDER BY hu.reading_time DESC
    `;

    const result = await this.client.query(query);
    return result.rows;
  }

  async fetchAnomalyDetails(id) {
    const query = `
      SELECT hu.*, ad.anomaly_type
      FROM hours_usage hu
      JOIN anomaly_data ad ON hu.id = ad.hours_usage_id
      WHERE hu.id = $1
    `;

    const result = await this.client.query(query, [id]);
    return result.rows;
  }

  close() {
    this.client.end();
  }
}

module.exports = new DatabaseService();