// config/database.js
const dotenv = require("dotenv")
dotenv.config();

module.exports = {
  user: 'postgres',
  host: '34.123.56.222',
  database: 'metrics_data',
  password: 'keren123',
  port: 5432
};
