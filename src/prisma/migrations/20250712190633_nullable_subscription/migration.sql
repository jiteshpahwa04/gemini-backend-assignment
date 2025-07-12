/*
  Warnings:

  - The values [user,bot] on the enum `Sender` will be removed. If these variants are still used in the database, this will fail.
  - The values [basic,pro] on the enum `SubscriptionTier` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Sender_new" AS ENUM ('USER', 'BOT');
ALTER TABLE "Message" ALTER COLUMN "sender" TYPE "Sender_new" USING ("sender"::text::"Sender_new");
ALTER TYPE "Sender" RENAME TO "Sender_old";
ALTER TYPE "Sender_new" RENAME TO "Sender";
DROP TYPE "Sender_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionTier_new" AS ENUM ('BASIC', 'PRO');
ALTER TABLE "Subscription" ALTER COLUMN "tier" TYPE "SubscriptionTier_new" USING ("tier"::text::"SubscriptionTier_new");
ALTER TYPE "SubscriptionTier" RENAME TO "SubscriptionTier_old";
ALTER TYPE "SubscriptionTier_new" RENAME TO "SubscriptionTier";
DROP TYPE "SubscriptionTier_old";
COMMIT;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "stripeCustomerId" DROP NOT NULL,
ALTER COLUMN "stripeSubscriptionId" DROP NOT NULL;
