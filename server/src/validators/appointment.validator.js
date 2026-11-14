import { body, query } from 'express-validator';

export const bookAppointmentValidator = [
  body('doctorId').isMongoId().withMessage('Valid doctorId is required'),
  body('date').isISO8601().withMessage('Valid date (ISO8601) is required'),
  body('startTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('startTime must be in HH:mm format'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason too long'),
];

export const rescheduleValidator = [
  body('newDate').isISO8601().withMessage('Valid newDate is required'),
  body('newStartTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('newStartTime must be in HH:mm format'),
];

export const updateStatusValidator = [
  body('status')
    .isIn(['completed', 'cancelled', 'no_show'])
    .withMessage('Status must be completed, cancelled, or no_show'),
];
