const { PrismaClient } = require('@prisma/client');
const { dbConfig } = require('../config');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbConfig.DATABASE_URL,
    },
  },
});

module.exports = prisma;