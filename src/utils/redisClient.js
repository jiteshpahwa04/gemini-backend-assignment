const { createClient } = require('redis');
const { dbConfig } = require('../config');

const redis = createClient({ url: dbConfig.REDIS_URL });
redis.connect().catch(console.error);

module.exports = redis;