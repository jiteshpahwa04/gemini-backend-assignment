const prisma = require('../utils/prismaClient');

async function createSubscription({ userId, tier, status, stripeCustomerId = null, stripeSubscriptionId = null }) {
  return prisma.subscription.create({
    data: {
      userId,
      tier,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
    },
  });
}

module.exports = {
  createSubscription,
};