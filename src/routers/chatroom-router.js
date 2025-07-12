const chatroomRouter = require('express').Router();
const { createChatroomController, listChatroomsController, getChatroomController, sendMessageController } = require('../controllers/chatroom-controller');
const authMiddleware = require('../middlwares/auth-middlware');

chatroomRouter.post('/', authMiddleware, createChatroomController);
chatroomRouter.get('/', authMiddleware, listChatroomsController);

chatroomRouter.get('/:id', authMiddleware, getChatroomController);
chatroomRouter.post('/:id/message', authMiddleware, sendMessageController);

module.exports = chatroomRouter;