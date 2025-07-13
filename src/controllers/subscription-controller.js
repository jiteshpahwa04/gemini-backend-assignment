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
        const rawBody = req.body;
        const sigHeader = req.headers['stripe-signature'];

        console.log("raw body: ", rawBody);
        console.log("sigHeader: ", sigHeader);

        const result = await handleStripeWebhook(rawBody, sigHeader);
        res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

async function getSubscriptionController(req, res, next) {
    try {
        const userId = req.user.userId;
        const subscription = await getSubscriptionService(userId);
        res.status(200).json({ subscription });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    subscribeProController,
    stripeWebhookController,
    getSubscriptionController
};