const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  findUserByPhone,
  createUser,
  markUserVerified,
  updatePassword,
} = require('../repositories/user-repository');
const { createVerification, markVerificationUsed, findValidVerification } = require('../repositories/verification-repository');
const { BadRequest, NotFound } = require('../utils/error/index.js');
const { serverConfig } = require('../config/index.js');
const { createSubscription } = require('../repositories/subscription-repository.js');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

function generateOtp() {
  return Math.floor(10 ** (OTP_LENGTH - 1) + Math.random() * 9 * 10 ** (OTP_LENGTH - 1))
    .toString();
}

async function signupService(phone, name) {
  if (!phone) throw new BadRequest('Phone number is required');
  const existing = await findUserByPhone(phone);
  if (existing) {
    throw new BadRequest('Phone number already registered');
  }

  const user = await createUser(phone, name);

  await createSubscription({
    userId: user.id,
    tier: 'BASIC',
    status: 'ACTIVE',
  });

  return user;
}

async function sendOtpService(phone) {
  if (!phone) {
    throw new BadRequest('Phone number is required');
  }

  // Ensure user exists
  let user = await findUserByPhone(phone);
  if (!user) {
    throw new NotFound('User not found');
  }

  // Generate & hash OTP
  const otp = generateOtp();
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

  // Persist the verification record
  await createVerification({
    userId: user.id,
    codeHash,
    expiresAt,
  });

  // Return the raw OTP so controller can “send” it (or return for dev)
  return otp;
}

async function verifyOtpService(phone, otp) {
  if (!phone || !otp) {
    throw new BadRequest('Phone and OTP are required');
  }

  const user = await findUserByPhone(phone);
  if (!user) {
    throw new Unauthorized('User not found');
  }

  const verification = await findValidVerification({ userId: user.id });
  if (!verification) {
    throw new BadRequest('No valid OTP found or OTP expired');
  }

  const match = await bcrypt.compare(otp, verification.codeHash);
  if (!match) {
    throw new BadRequest('Invalid OTP');
  }

  // mark this OTP as used & flag the user
  await markVerificationUsed(verification.id);
  await markUserVerified(user.id);

  // sign a JWT for the now-verified user
  const token = jwt.sign(
    { userId: user.id, phone: user.phone },
    serverConfig.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return token;
}

async function forgotPasswordService(phone) {
  if (!phone) throw new BadRequest('Phone number is required');
  const user = await findUserByPhone(phone);
  if (!user) throw new BadRequest('User not found');

  const otp = generateOtp();
  const codeHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

  await createVerification({ userId: user.id, codeHash, expiresAt });
  return otp;
}

async function changePasswordService(userId, newPassword) {
  if (!newPassword) {
    throw new BadRequest('New password is required');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await updatePassword(userId, passwordHash);
}

module.exports = {
  sendOtpService,
  signupService,
  verifyOtpService,
  forgotPasswordService,
  changePasswordService
};