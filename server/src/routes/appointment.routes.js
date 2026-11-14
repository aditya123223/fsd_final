import { Router } from 'express';
import * as appointmentController from '../controllers/appointment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { handleValidationErrors } from '../middleware/error.middleware.js';
import {
  bookAppointmentValidator,
  rescheduleValidator,
  updateStatusValidator,
} from '../validators/appointment.validator.js';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

// Book appointment — patient only
router.post(
  '/',
  requireRole('patient'),
  bookAppointmentValidator,
  handleValidationErrors,
  appointmentController.bookAppointment
);

// Get appointment by ID — authenticated user (owner check inside service)
router.get('/:id', appointmentController.getAppointmentById);

// Cancel — patient only (owner check inside service)
router.patch(
  '/:id/cancel',
  requireRole('patient'),
  appointmentController.cancelAppointment
);

// Reschedule — patient only
router.patch(
  '/:id/reschedule',
  requireRole('patient'),
  rescheduleValidator,
  handleValidationErrors,
  appointmentController.rescheduleAppointment
);

// Update status — doctor only
router.patch(
  '/:id/status',
  requireRole('doctor'),
  updateStatusValidator,
  handleValidationErrors,
  appointmentController.updateAppointmentStatus
);

export default router;
