import * as appointmentService from '../services/appointment.service.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';

export const bookAppointment = async (req, res, next) => {
  try {
    const patientId = req.user.userId;
    const { doctorId, date, startTime, reason } = req.body;
    const appointment = await appointmentService.bookAppointment(patientId, {
      doctorId,
      date,
      startTime,
      reason,
    });
    return sendSuccess(res, { appointment }, 'Appointment booked successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.getAppointmentById(id, req.user.userId, req.user.role);
    return sendSuccess(res, { appointment }, 'Appointment fetched');
  } catch (err) {
    next(err);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentService.cancelAppointment(id, req.user.userId);
    return sendSuccess(res, { appointment }, 'Appointment cancelled');
  } catch (err) {
    next(err);
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, newStartTime } = req.body;
    const appointment = await appointmentService.rescheduleAppointment(id, req.user.userId, {
      newDate,
      newStartTime,
    });
    return sendSuccess(res, { appointment }, 'Appointment rescheduled');
  } catch (err) {
    next(err);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return sendError(res, 'Status is required', 400);
    const appointment = await appointmentService.updateAppointmentStatus(id, req.user.userId, status);
    return sendSuccess(res, { appointment }, 'Appointment status updated');
  } catch (err) {
    next(err);
  }
};
