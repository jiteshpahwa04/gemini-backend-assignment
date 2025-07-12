require('dotenv').config();

const serverConfig = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
};

const dbConfig = {
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
};

module.exports = {
  serverConfig,
  dbConfig,
};