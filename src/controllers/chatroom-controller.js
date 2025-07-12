const { createChatroomService, listChatroomsService, getChatroomService, sendMessageService } = require("../services/chatroom-service");

async function createChatroomController(req, res, next) {
  try {
    const { userId } = req.user;
    const chatroom = await createChatroomService(userId);
    res.status(201).json({ chatroom });
  } catch (err) {
    next(err);
  }
}

async function listChatroomsController(req, res, next) {
  try {
    const { userId } = req.user;
    const chatrooms = await listChatroomsService(userId);
    res.json({ chatrooms });
  } catch (err) {
    next(err);
  }
}

async function getChatroomController(req, res, next) {
  try {
    const { userId } = req.user;
    const chatroomId = parseInt(req.params.id, 10);
    const chatroom = await getChatroomService(userId, chatroomId);
    res.json({ chatroom });
  } catch (err) {
    next(err);
  }
}

async function sendMessageController(req, res, next) {
  try {
    const userId = req.user.userId;
    const chatroomId = parseInt(req.params.id, 10);
    const { content } = req.body;

    const { userMessage, botMessage } = await sendMessageService(
      userId,
      chatroomId,
      content
    );

    res.json({ userMessage, botMessage });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createChatroomController,
  listChatroomsController,
  getChatroomController,
  sendMessageController
};