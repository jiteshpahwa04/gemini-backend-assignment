require('dotenv').config();

const serverConfig = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  JWT_SECRET: process.env.JWT_SECRET,
  DOMAIN: process.env.DOMAIN || 'http://localhost:3000',
};

const dbConfig = {
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
};

const stripeConfig = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
};

module.exports = {
  serverConfig,
  dbConfig,
  stripeConfig
};