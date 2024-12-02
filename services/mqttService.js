/**
 * MQTT Service Module
 * @module services/mqttService
 * @description A robust MQTT client service for handling message subscriptions and connections
 * Provides a flexible and configurable way to establish MQTT connections, subscribe to topics,
 * and process incoming messages with error handling and logging.
 */

const mqtt = require('mqtt');
const { logWithTimestamp } = require('../utils/logger');

/**
 * MqttService: Handles MQTT client connection, subscription, and message routing
 * @class
 * @description Creates an MQTT client with dynamic topic subscriptions and custom message handling
 */
class MqttService {
  /**
   * Create an MQTT service instance
   * @constructor
   * @param {string} brokerUrl - The URL of the MQTT broker to connect to
   * @param {Object} options - Connection options for the MQTT client
   * @param {string[]} topics - List of topics to subscribe to upon connection
   * @param {function} onMessageCallback - Callback function to handle incoming messages
   * 
   */
  constructor(brokerUrl, options, topics, onMessageCallback) {
    this.client = mqtt.connect(brokerUrl, options);
    this.topics = topics;

    // Event handler for successful connection
    this.client.on('connect', () => {
      logWithTimestamp('MQTT Connected');
      this.topics.forEach(topic => this.client.subscribe(topic));
    });

    // Event handler for incoming messages
    this.client.on('message', (topic, message) => {
      logWithTimestamp(`Message from : ${topic}`);
      onMessageCallback(topic, message);
    });

    // Event handler for connection errors
    this.client.on('error', (error) => {
      logWithTimestamp(`MQTT Error: ${error}`);
    });
  }

  /**
   * Gracefully terminate the MQTT client connection
   * @method
   * @description Closes the MQTT connection and releases resources
   */
  end() {
    this.client.end();
  }
}

module.exports = MqttService;