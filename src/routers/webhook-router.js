const bodyParser = require('body-parser');
const { stripeWebhookController } = require('../controllers/subscription-controller');
const webhookRouter = require('express').Router();

webhookRouter.post('/stripe', bodyParser.raw({ type: 'application/json' }), stripeWebhookController);

module.exports = webhookRouter;