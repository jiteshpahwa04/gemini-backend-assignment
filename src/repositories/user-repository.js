const prisma = require('../utils/prismaClient');

async function findUserByPhone(phone) {
  return prisma.user.findUnique({ where: { phone } });
}

async function createUser(phone, name) {
  return prisma.user.create({
    data: { phone, name }
  });
}

async function markUserVerified(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: { isVerified: true }
  });
}

async function updatePassword(userId, passwordHash) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      phone: true,
      isVerified: true,
      createdAt: true,
      subscription: {
        select: {
          tier: true,
          status: true,
        },
      },
    },
  });
}

module.exports = {
  findUserByPhone,
  createUser,
  markUserVerified,
  updatePassword,
  findUserById
};