const prisma = require('../utils/prismaClient');

async function createChatroom({ userId, name }) {
  return prisma.chatroom.create({
    data: {
      userId,
      name: 'Chatroom' // We can update this when the user types the first prompt
    }
  });
}

async function findChatroomsByUserId(userId) {
  return prisma.chatroom.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

async function findChatroomWithMessages({ chatroomId, userId }) {
  return prisma.chatroom.findUnique({
    where: { id: chatroomId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

async function findChatroomById(chatroomId) {
  return prisma.chatroom.findUnique({
    where: { id: chatroomId },
    select: { id: true, userId: true }
  });
}

module.exports = {
  createChatroom,
  findChatroomsByUserId,
  findChatroomWithMessages,
  findChatroomById
};