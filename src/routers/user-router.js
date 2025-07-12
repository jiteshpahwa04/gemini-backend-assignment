const userRouter = require('express').Router();
const { getMeController } = require('../controllers/user-controller');
const authMiddleware = require('../middlwares/auth-middlware');

userRouter.get('/me', authMiddleware, getMeController);

module.exports = userRouter;