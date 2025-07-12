const { createChatroom, findChatroomsByUserId, findChatroomWithMessages, findChatroomById } = require('../repositories/chatroom-repository');
const { createMessage } = require('../repositories/message-repository');
const { findUserById } = require('../repositories/user-repository');
const { NotFound, Forbidden, BadRequest } = require('../utils/error');
const redis = require('../utils/redisClient');
const { v4: uuidv4 } = require('uuid');

const CACHE_TTL_SECONDS = 300;        // 5 minutes
const REQUEST_STREAM = 'gemini:requests';
const DAILY_LIMIT = 5;
const TIMEOUT_MS = 30_000;  // 30 seconds

async function createChatroomService(userId) {
    const chatroom = await createChatroom({ userId });

    // Invalidate cache so next GET /chatroom fetches fresh data
    const cacheKey = `user:${userId}:chatrooms`;
    await redis.del(cacheKey);

    return chatroom;
}

async function listChatroomsService(userId) {
    const cacheKey = `user:${userId}:chatrooms`;

    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    // Fallback to database
    const chatrooms = await findChatroomsByUserId(userId);

    // Store in cache with TTL
    await redis.set(cacheKey, JSON.stringify(chatrooms), 'EX', CACHE_TTL_SECONDS);

    return chatrooms;
}

async function getChatroomService(userId, chatroomId) {
    const chatroom = await findChatroomWithMessages({ chatroomId, userId });
    if (!chatroom || chatroom.userId !== userId) {
        throw new NotFound('Chatroom not found');
    }
    return chatroom;
}

async function sendMessageService(userId, chatroomId, content) {
  // 1️⃣ Validate chatroom ownership
  const chatroom = await findChatroomById(chatroomId);
  if (!chatroom || chatroom.userId !== userId) {
    throw new NotFound('Chatroom not found');
  }

  // 2️⃣ Rate-limit for Basic users
  const user = await findUserById(userId);
  if (user.subscription?.tier === 'BASIC') {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const usageKey = `user:${userId}:messages:${today}`;
    const count = await redis.incr(usageKey);
    if (count === 1) {
      // expire at next midnight
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const secondsUntilMidnight = Math.ceil((tomorrow - now) / 1000);
      await redis.expire(usageKey, secondsUntilMidnight);
    }
    if (count > DAILY_LIMIT) {
      throw new Forbidden('Daily message limit reached for Basic tier');
    }
  }

  // 3️⃣ Persist the user’s message
  const userMessage = await createMessage({
    chatroomId,
    sender: 'USER',
    content,
  });

  // 4️⃣ Enqueue into Redis Stream with a correlationId
  const correlationId = uuidv4();
  await redis.xAdd(
    REQUEST_STREAM,
    '*',
    {
        correlationId,
        chatroomId: String(chatroomId),
        content
    }
  );

  // 5️⃣ Subscribe to the one-off Pub/Sub channel and wait
  const responseChannel = `gemini:response:${correlationId}`;
  const subscriber = redis.duplicate();
  await subscriber.connect();

  const aiText = await new Promise((resolve, reject) => {
    // Timeout handler
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for AI response'));
      subscriber.unsubscribe(responseChannel).finally(() => subscriber.quit());
    }, TIMEOUT_MS);

    // Subscribe with listener
    subscriber.subscribe(responseChannel, (message) => {
      clearTimeout(timer);
      subscriber.unsubscribe(responseChannel)
        .catch(() => {})
        .finally(() => subscriber.quit());
      const { text } = JSON.parse(message);
      resolve(text);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
      subscriber.quit();
    });
  });

  // 6️⃣ Persist the bot’s reply
  const botMessage = await createMessage({
    chatroomId,
    sender: 'BOT',
    content: aiText,
  });

  // 7️⃣ Return both messages
  return { userMessage, botMessage };
}

module.exports = {
    createChatroomService,
    listChatroomsService,
    getChatroomService,
    sendMessageService
};