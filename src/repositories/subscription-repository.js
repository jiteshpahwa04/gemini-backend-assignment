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

async function upsertSubscription({
  userId,
  stripeCustomerId,
  stripeSubscriptionId,
  tier,
  status,
}) {
  return prisma.subscription.upsert({
    where: { userId },
    update: {
      stripeCustomerId,
      stripeSubscriptionId,
      tier,
      status,
    },
    create: {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      tier,
      status,
    },
  });
}

async function findSubscriptionByUserId(userId) {
  return prisma.subscription.findUnique({
    where: { userId },
    select: {
      tier: true,
      status: true,
      createdAt: true,
      updatedAt: true
    },
  });
}

module.exports = {
  createSubscription,
  upsertSubscription,
  findSubscriptionByUserId
};