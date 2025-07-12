const { sendOtpService, signupService, verifyOtpService, changePasswordService, forgotPasswordService } = require('../services/auth-service');

async function signupController(req, res, next) {
  try {
    const { phone, name } = req.body;
    const user = await signupService(phone, name);
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (err) {
    next(err);
  }
}

async function sendOtpController(req, res, next) {
  try {
    const { phone } = req.body;
    const otp = await sendOtpService(phone);
    res.json({ message: 'OTP sent', otp });
  } catch (err) {
    next(err);
  }
}

async function verifyOtpController(req, res, next) {
  try {
    const { phone, otp } = req.body;
    const token = await verifyOtpService(phone, otp);
    res.json({ message: 'OTP verified', token });
  } catch (err) {
    next(err);
  }
}

async function forgotPasswordController(req, res, next) {
  try {
    const { phone } = req.body;
    const otp = await forgotPasswordService(phone);
    res.json({ message: 'Password reset OTP sent', otp });
  } catch (err) {
    next(err);
  }
}

async function changePasswordController(req, res, next) {
  try {
    const { newPassword } = req.body;
    const { userId } = req.user;
    await changePasswordService(userId, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  sendOtpController,
  signupController,
  verifyOtpController,
  forgotPasswordController,
  changePasswordController
};