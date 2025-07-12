const authRouter = require('express').Router();
const { sendOtpController, signupController, verifyOtpController, forgotPasswordController, changePasswordController } = require('../controllers/auth-controller');
const authMiddleware = require('../middlwares/auth-middlware');

authRouter.post('/signup', signupController);
authRouter.post('/send-otp', sendOtpController);
authRouter.post('/verify-otp', verifyOtpController);
authRouter.post('/forgot-password', forgotPasswordController);

authRouter.post('/change-password', authMiddleware, changePasswordController);

module.exports = authRouter;