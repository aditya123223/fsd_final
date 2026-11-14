import { Router } from 'express';
import * as doctorController from '../controllers/doctor.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { handleValidationErrors } from '../middleware/error.middleware.js';
import { upsertScheduleValidator, addExceptionValidator } from '../validators/schedule.validator.js';

const router = Router();

// Public routes
router.get('/', doctorController.listDoctors);
router.get('/:id', doctorController.getDoctorById);
router.get('/:id/availability', doctorController.getDoctorAvailability);

// Doctor-only routes (use /doctor prefix, mounted separately)
export const doctorPrivateRouter = Router();
doctorPrivateRouter.use(authenticate, requireRole('doctor'));

doctorPrivateRouter.get('/dashboard', doctorController.getDashboard);
doctorPrivateRouter.get('/appointments/today', doctorController.getTodayAppointments);
doctorPrivateRouter.get('/appointments', doctorController.getAllAppointments);
doctorPrivateRouter.get('/schedule', doctorController.getSchedule);
doctorPrivateRouter.put(
  '/schedule',
  upsertScheduleValidator,
  handleValidationErrors,
  doctorController.updateSchedule
);
doctorPrivateRouter.post(
  '/schedule/exceptions',
  addExceptionValidator,
  handleValidationErrors,
  doctorController.addException
);
doctorPrivateRouter.get('/profile', doctorController.getProfile);
doctorPrivateRouter.put('/profile', doctorController.updateProfile);

export default router;
