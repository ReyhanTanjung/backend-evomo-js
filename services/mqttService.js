// services/mqttService.js
const mqtt = require('mqtt');
const { logWithTimestamp } = require('../utils/logger');

class MqttService {
  constructor(brokerUrl, options, topics, onMessageCallback) {
    this.client = mqtt.connect(brokerUrl, options);
    this.topics = topics;

    this.client.on('connect', () => {
      logWithTimestamp('MQTT Connected');
      this.topics.forEach(topic => this.client.subscribe(topic));
    });

    this.client.on('message', (topic, message) => {
      logWithTimestamp(`Message from : ${topic}`);
      onMessageCallback(topic, message);
    });

    this.client.on('error', (error) => {
      logWithTimestamp(`MQTT Error: ${error}`);
    });
  }

  end() {
    this.client.end();
  }
}

module.exports = MqttService;