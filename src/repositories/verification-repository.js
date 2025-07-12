const prisma = require('../utils/prismaClient');

async function createVerification({ userId, codeHash, expiresAt }) {
  return prisma.verification.create({
    data: { userId, codeHash, expiresAt }
  });
}

async function findValidVerification({ userId }) {
  return prisma.verification.findFirst({
    where: {
      userId,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function markVerificationUsed(id) {
  return prisma.verification.update({
    where: { id },
    data: { used: true },
  });
}

module.exports = {
  createVerification,
  findValidVerification,
  markVerificationUsed
};