const { subscribeProService, handleStripeWebhook, getSubscriptionService } = require("../services/subscription-service");

async function subscribeProController(req, res, next) {
    try {
        const userId = req.user.userId;
        const url = await subscribeProService(userId);
        res.status(200).json({ url });
    } catch (err) {
        next(err);
    }
}

async function stripeWebhookController(req, res, next) {
    try {
        // rawBody is provided by our special middleware (see next step)
        const response = await handleStripeWebhook(req.rawBody, req.headers['stripe-signature']);
        res.json(response);
    } catch (err) {
        next(err);
    }
}

async function getSubscriptionController(req, res, next) {
    try {
        const userId = req.user.userId;
        const subscription = await getSubscriptionService(userId);
        res.json({ subscription });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    subscribeProController,
    stripeWebhookController,
    getSubscriptionController
};