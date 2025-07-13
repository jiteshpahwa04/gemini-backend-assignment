const router = require('express').Router();
const authRouter = require('./auth-router');
const chatroomRouter = require('./chatroom-router');
const subscriptionRouter = require('./subscription-router');
const userRouter = require('./user-router');

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/chatroom', chatroomRouter);
router.use('/subscribe', subscriptionRouter);

module.exports = router;