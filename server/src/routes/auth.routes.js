import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { handleValidationErrors } from '../middleware/error.middleware.js';
import {
  registerPatientValidator,
  registerDoctorValidator,
  loginValidator,
} from '../validators/auth.validator.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many requests, please try again later.' },
});

router.post(
  '/register/patient',
  authLimiter,
  registerPatientValidator,
  handleValidationErrors,
  authController.registerPatient
);

router.post(
  '/register/doctor',
  authLimiter,
  registerDoctorValidator,
  handleValidationErrors,
  authController.registerDoctor
);

router.post('/login', authLimiter, loginValidator, handleValidationErrors, authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
