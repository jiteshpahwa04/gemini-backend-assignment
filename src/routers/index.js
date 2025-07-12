const router = require('express').Router();
const authRouter = require('./auth-router');
const chatroomRouter = require('./chatroom-router');
const userRouter = require('./user-router');

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/chatroom', chatroomRouter);

module.exports = router;