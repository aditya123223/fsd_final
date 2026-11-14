import { Router } from 'express';
import * as patientController from '../controllers/patient.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, requireRole('patient'));

router.get('/dashboard', patientController.getDashboard);
router.get('/appointments', patientController.getAppointments);
router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);

export default router;
