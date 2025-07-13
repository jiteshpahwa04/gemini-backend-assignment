const { stripeWebhookController } = require('../controllers/subscription-controller');
const webhookRouter = require('express').Router();

webhookRouter.post('/stripe', stripeWebhookController);

module.exports = webhookRouter;