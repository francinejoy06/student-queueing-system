const mysql = require('mysql2/promise');
const path = require('path');
const dotenvResult = require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});
const fileConfig = dotenvResult.parsed || {};
const databaseConfig = {
  host: process.env.DB_HOST || fileConfig.DB_HOST || 'localhost',
  user: process.env.DB_USER || fileConfig.DB_USER || 'root',
  password: process.env.DB_PASSWORD || fileConfig.DB_PASSWORD || '',
  database: process.env.DB_NAME || fileConfig.DB_NAME || 'queueing_system',
};

const requiredConfig = {
  DB_HOST: databaseConfig.host,
  DB_USER: databaseConfig.user,
  DB_NAME: databaseConfig.database,
};
const missingConfig = Object.keys(requiredConfig).filter((key) => !requiredConfig[key]);
if (missingConfig.length) {
  throw new Error(
    `Missing database configuration: ${missingConfig.join(', ')}. ` +
    'Set these values in the project .env file.'
  );
}

const pool = mysql.createPool({
  ...databaseConfig,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;