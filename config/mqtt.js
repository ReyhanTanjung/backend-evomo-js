// config/mqtt.js
module.exports = {
    brokerUrl: 'mqtt://mqtt.eclipseprojects.io',
    options: {
      clientId: `mqtt_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      username: '193006f7395541fc',
      password: '193006f7396ceeea'
    }
  };