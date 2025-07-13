const { stripeConfig, serverConfig } = require("../config");
const { findSubscriptionByUserId, upsertSubscription } = require("../repositories/subscription-repository");
const { BadRequest } = require("../utils/error");

const Stripe = require('stripe');
const stripe = new Stripe(stripeConfig.STRIPE_SECRET_KEY);

async function subscribeProService(userId) {
    if (!stripeConfig.STRIPE_PRO_PRICE_ID) {
        throw new BadRequest('Pro Price ID not configured');
    }

    const existingSub = await findSubscriptionByUserId(userId);
    if (existingSub?.tier === 'PRO' && existingSub.status === 'ACTIVE') {
        throw new BadRequest('You already have an active Pro subscription');
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
            price: stripeConfig.STRIPE_PRO_PRICE_ID,
            quantity: 1,
        }],
        customer_email: undefined,
        success_url: `${serverConfig.DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${serverConfig.DOMAIN}/cancel`,
        metadata: { userId: String(userId) },
    });

    return session.url;
}

async function handleStripeWebhook(rawBody, sigHeader) {
    let event;

    console.log("webhook called!");
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            sigHeader,
            stripeConfig.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.log("Got an error while processing the webhook");
        console.error(err);
        throw new BadRequest(`Webhook Error: ${err.message}`);
    }

    console.log("Event is: ", event);
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;

            const userId = parseInt(session.metadata.userId, 10);
            const stripeCustomerId = session.customer;
            const stripeSubscriptionId = session.subscription;

            // When a user completes Checkout, promote them to Pro
            await upsertSubscription({
                userId,
                stripeCustomerId,
                stripeSubscriptionId,
                tier: 'PRO',
                status: 'ACTIVE',
            });
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object;
            // The subscription has gone past due
            const stripeSubscriptionId = invoice.subscription;
            const sub = await prisma.subscription.findUnique({
                where: { stripeSubscriptionId }
            });
            if (sub) {
                await upsertSubscription({
                    userId: sub.userId,
                    stripeCustomerId: sub.stripeCustomerId,
                    stripeSubscriptionId,
                    tier: sub.tier,
                    status: 'past_due',
                });
            }
            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
}

async function getSubscriptionService(userId) {
    const sub = await findSubscriptionByUserId(userId);
    if (!sub) {
        throw new NotFound('No subscription found for this user');
    }
    return sub;
}

module.exports = {
    subscribeProService,
    handleStripeWebhook,
    getSubscriptionService
};