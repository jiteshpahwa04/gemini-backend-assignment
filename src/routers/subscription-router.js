const subscriptionRouter = require('express').Router();
const { subscribeProController, getSubscriptionController } = require('../controllers/subscription-controller');
const authMiddleware = require('../middlwares/auth-middlware');

subscriptionRouter.post('/pro', authMiddleware, subscribeProController);
subscriptionRouter.get('/status', authMiddleware, getSubscriptionController);

module.exports = subscriptionRouter;