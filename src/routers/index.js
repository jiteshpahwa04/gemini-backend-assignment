const router = require('express').Router();
const authRouter = require('./auth-router');
const chatroomRouter = require('./chatroom-router');
const subscriptionRouter = require('./subscription-router');
const userRouter = require('./user-router');
const webhookRouter = require('./webhook-router');

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/chatroom', chatroomRouter);
router.use('/subscribe', subscriptionRouter);

// Webhook
router.use('/webhook', webhookRouter);

module.exports = router;