const { config } = require('dotenv');
const { Sequelize } = require('sequelize');

config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 5432,
  DB_NAME = 'go-body',
  DB_USER = 'postgres',
  DB_PASSWORD = 'adminadmin',
  DB_LOGGING = 'false',
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: DB_LOGGING === 'true' ? console.log : false,
  define: {
    freezeTableName: true,
  },
  timezone: 'UTC',
  dialectOptions: {
    useUTC: true,
  },
});

module.exports = sequelize;

