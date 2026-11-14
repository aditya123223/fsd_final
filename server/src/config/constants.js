export const ROLES = {
  DOCTOR: 'doctor',
  PATIENT: 'patient',
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'appointment_booked',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  STATUS_CHANGED: 'status_changed',
  SCHEDULE_UPDATED: 'schedule_updated',
};

export const SLOT_DURATIONS = [15, 20, 30, 60];

export const SALT_ROUNDS = 12;

export const BOOKING_REF_PREFIX = 'APT';
