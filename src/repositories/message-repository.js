const prisma = require('../utils/prismaClient');

async function createMessage({ chatroomId, sender, content }) {
  return prisma.message.create({
    data: { chatroomId, sender, content },
  });
}

module.exports = {
  createMessage,
};