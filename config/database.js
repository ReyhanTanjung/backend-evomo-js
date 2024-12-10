// config/database.js
const dotenv = require("dotenv")
dotenv.config();

module.exports = {
  user: 'postgres',
  host: 'localhost',
  database: 'metrics_data',
  password: 'keren123',
  port: 5432
};
