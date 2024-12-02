// config/mqtt.js
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  brokerUrl: process.env.MQTT_BROKER_URL,
  options: {
    clientId: `mqtt_${Math.random().toString(16).substr(2, 8)}`,
    clean: true,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  }
};