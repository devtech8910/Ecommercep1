import { Router } from 'express';
import * as controller from '../controller/auth.controller.js';

const router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/check-phone', controller.checkPhone);
router.get('/check-email', controller.checkEmail);
router.get('/profile', controller.getProfile);
router.put('/update-profile', controller.updateProfile);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);
router.post('/send-verification-otp', controller.sendVerificationOtp);
router.post('/verify-and-update-profile', controller.verifyAndUpdateProfile);
router.post('/request-delete-account', controller.requestDeleteAccount);
router.post('/confirm-delete-account', controller.confirmDeleteAccount);

export default router;
