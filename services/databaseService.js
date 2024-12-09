/**
 * Database Service Module
 * @module services/databaseService
 * @description Manages database interactions for sensor data, tokens, and anomaly predictions
 * Provides CRUD operations and complex querying for energy consumption and anomaly detection
 */
const { Client } = require('pg');
const axios = require('axios');
const dbConfig = require('../config/database');
const { sendAnomalyNotification } = require('../utils/cloudMessaging');
const { logWithTimestamp } = require('../utils/logger');
const dayjs = require('dayjs');

/**
 * DatabaseService: Handles PostgreSQL database operations for energy monitoring system
 * @class
 * @description Manages database connections, data storage, retrieval, and anomaly prediction
 */
class DatabaseService {
  /**
   * Create a DatabaseService instance
   * @constructor
   * @description Initializes database connection and establishes client
   */
  constructor() {
    this.client = new Client(dbConfig);
    this.connect();
  }

  /**
   * Establish database connection
   * @method
   * @description Connects to the PostgreSQL database and logs connection status
   */
  connect() {
    this.client.connect()
      .then(() => logWithTimestamp('Database connected successfully'))
      .catch(err => logWithTimestamp(`Database connection error: ${err.message}`));
  }

  /**
   * Save sensor data to database
   * @method
   * @param {string} location - Identifier for the sensor location
   * @param {Object} data - Sensor reading data with energy consumption metrics
   * @description Inserts differential energy consumption data into sensor_data table
   */
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

  /**
   * Save user authentication token
   * @method
   * @param {string} token - Authentication token to be stored
   * @description Stores user token with current date in user_token table
   */
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

  /**
   * Calculate and save hourly usage statistics
   * @method
   * @description Computes average energy metrics for the past hour and saves to hours_usage table
   */
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

      logWithTimestamp('Data berhasil disimpan ke tabel hours_usage.');
    } catch (error) {
      logWithTimestamp('Terjadi kesalahan:', error);
    }
  }

  /**
   * Retrieve valid user tokens
   * @method
   * @returns {Promise<Array>} List of valid tokens (less than 270 days old)
   * @description Fetches and filters user tokens based on initialization time
   */
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

  /**
   * Fetch historical sensor data
   * @method
   * @param {string} location - Sensor location identifier
   * @param {string} [startdate] - Optional start date for data retrieval
   * @param {string} [enddate] - Optional end date for data retrieval
   * @returns {Promise<Array>} Historical sensor data records
   */
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

  /**
   * Fetch most recent two records for a location
   * @method
   * @param {string} location - Sensor location identifier
   * @returns {Promise<Array>} Last two sensor data records
   */
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

  /**
   * Retrieve anomaly data
   * @method
   * @returns {Promise<Array>} List of detected anomalies
   */
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

  /**
   * Get detailed anomaly information
   * @method
   * @param {number} id - Unique identifier for the anomaly
   * @returns {Promise<Array>} Detailed anomaly information
   */
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

  /**
   * Send anomaly notification via Firebase Cloud Messaging
   * @method
   * @param {Object} anomalyData - Anomaly details for notification
   */
  async predictAndSaveAnomalies() {
    try {
      const currentTime = new Date();
      const halfhourago = new Date(currentTime.getTime() - 30 * 60 * 1000);
      
      const query = `
          SELECT id, reading_time, position, 
                 active_energy_import AS usage
          FROM hours_usage
          WHERE reading_time BETWEEN $1 AND $2
      `;
  
      const tokensResult = await this.fetchUsersToken();
      const tokens = tokensResult.map(item => item.token);
  
      const result = await this.client.query(query, [halfhourago, currentTime]);
  
      const predictionEndpoints = {
        'AHU_Lantai_2': '/predict_ahu',
        'Chiller_Witel_Jaksel': '/predict_chiller',
        'Lift_Witel_Jaksel': '/predict_lift'
        // Note: Lift_OPMC is intentionally not included
      };
  
      for (const row of result.rows) {
        const endpoint = predictionEndpoints[row.position];
        
        if (!endpoint) {
          logWithTimestamp(`No prediction endpoint for location: ${row.position}`);
          continue;
        }
  
        try {
          const predictionPayload = {
            timestamp: dayjs(row.reading_time).format('YYYY-MM-DD HH:mm:ss'),
            usage: row.usage
          };
  
          const predictionResponse = await axios.post(
            `https://ml-api-903524315911.asia-southeast1.run.app${endpoint}`, 
            predictionPayload,
            {
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
  
          if (predictionResponse.data.anomaly === true) {
            const anomalyQuery = `
              INSERT INTO anomaly_data (hours_usage_id, anomaly_type)
              VALUES ($1, $2)
            `;
            await this.client.query(anomalyQuery, [row.id, 'ANOMALY']);
  
            const message = {
              timestamp: row.reading_time,
              anomaly: 'ANOMALY',
              location: row.position
            }
            
            try {
              const response = await sendAnomaliesNotification(message, tokens);
              console.log("Notifikasi berhasil dikirim:", response);
            } catch (error) {
              console.error("Gagal mengirim notifikasi:", error);
            }
          }
        } catch (err) {
          logWithTimestamp(`Prediction error for ${row.position}`);
        }
      }
  
      logWithTimestamp('Anomaly prediction and processing completed.');
    } catch (error) {
      logWithTimestamp('Error in anomaly prediction process:', error);
    }
  }

  /**
   * Close database connection
   * @method
   * @description Terminates the PostgreSQL client connection
   */
  close() {
    this.client.end();
  }
}

module.exports = new DatabaseService();