import { body } from 'express-validator';

const timeFormatRegex = /^\d{2}:\d{2}$/;

const validateInterval = (fieldName) =>
  body(fieldName).optional().isArray().withMessage(`${fieldName} must be an array`);

export const upsertScheduleValidator = [
  body('schedule').isArray({ min: 1 }).withMessage('schedule must be a non-empty array'),
  body('schedule.*.dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('dayOfWeek must be 0-6'),
  body('schedule.*.isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
  body('schedule.*.workingIntervals').optional().isArray(),
  body('schedule.*.workingIntervals.*.start')
    .optional()
    .matches(timeFormatRegex)
    .withMessage('interval start must be HH:mm'),
  body('schedule.*.workingIntervals.*.end')
    .optional()
    .matches(timeFormatRegex)
    .withMessage('interval end must be HH:mm'),
];

export const addExceptionValidator = [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('type')
    .isIn(['leave', 'blocked', 'custom-hours'])
    .withMessage("type must be 'leave', 'blocked', or 'custom-hours'"),
  body('customIntervals')
    .optional()
    .isArray()
    .withMessage('customIntervals must be an array'),
  body('reason').optional().trim().isLength({ max: 300 }),
];
