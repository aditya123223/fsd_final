import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { v4 as uuidv4 } from 'uuid';
import Appointment from '../models/Appointment.model.js';
import SlotReservation from '../models/SlotReservation.model.js';
import DoctorProfile from '../models/DoctorProfile.model.js';
import DoctorSchedule from '../models/DoctorSchedule.model.js';
import ScheduleException from '../models/ScheduleException.model.js';
import { createNotification } from './notification.service.js';
import { generateSlots } from '../utils/slot.utils.js';
import { BOOKING_REF_PREFIX } from '../config/constants.js';
import {
  emitAppointmentCreated,
  emitAppointmentCancelled,
  emitStatusUpdated,
  emitAppointmentRescheduled,
} from '../sockets/index.js';

dayjs.extend(utc);
dayjs.extend(timezone);

let _io = null;
export const setIo = (io) => { _io = io; };

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Generate booking reference: APT-YYYYMMDD-XXXXX
 */
const generateBookingRef = (date) => {
  const datePart = dayjs(date).utc().format('YYYYMMDD');
  const randPart = uuidv4().replace(/-/g, '').slice(0, 5).toUpperCase();
  return `${BOOKING_REF_PREFIX}-${datePart}-${randPart}`;
};

/**
 * Calculate end time given start and duration
 */
const calcEndTime = (startTime, durationMins) => {
  const [h, m] = startTime.split(':').map(Number);
  const totalMins = h * 60 + m + durationMins;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

/**
 * Validate that the requested slot is available
 */
const validateSlotAvailability = async (doctorId, date, startTime) => {
  const targetDate = dayjs.utc(date).startOf('day');
  const dayOfWeek = targetDate.day();

  const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
  if (!doctorProfile) throw new AppError('Doctor not found', 404);

  const timezoneStr = doctorProfile.timezone || 'UTC';
  const schedule = await DoctorSchedule.findOne({ doctorId, dayOfWeek }).lean();
  const exception = await ScheduleException.findOne({ doctorId, date: targetDate.toDate() }).lean();

  const appointments = await Appointment.find({
    doctorId,
    appointmentDate: targetDate.toDate(),
    status: 'scheduled',
  }).lean();

  const bookedSlots = appointments.map((a) => a.startTime);
  const slots = generateSlots(
    schedule,
    exception,
    bookedSlots,
    targetDate.toDate(),
    doctorProfile.consultationDuration,
    timezoneStr
  );

  const targetSlot = slots.find((s) => s.start === startTime);
  if (!targetSlot) throw new AppError('Slot not available in schedule', 400);
  if (!targetSlot.available) throw new AppError('Slot is already booked or not available', 409);

  return { doctorProfile, targetSlot };
};

/**
 * Book an appointment
 */
export const bookAppointment = async (patientId, { doctorId, date, startTime, reason }) => {
  // Validate slot availability in doctor's schedule
  const { doctorProfile } = await validateSlotAvailability(doctorId, date, startTime);

  const tz = doctorProfile.timezone || 'UTC';
  const dateStr = dayjs.utc(date).format('YYYY-MM-DD');
  const targetDate = dayjs.utc(date).startOf('day');

  const nowInTz = dayjs().tz(tz);
  const todayInTz = nowInTz.format('YYYY-MM-DD');

  if (dateStr < todayInTz) {
    throw new AppError('Cannot book appointments in the past', 400);
  }

  if (dateStr === todayInTz) {
    const [h, m] = startTime.split(':').map(Number);
    const slotMins = h * 60 + m;
    const nowMins = nowInTz.hour() * 60 + nowInTz.minute();
    if (slotMins < nowMins) {
      throw new AppError('Cannot book a slot that has already passed', 400);
    }
  }

  const endTime = calcEndTime(startTime, doctorProfile.consultationDuration);

  // Atomic reservation — unique index prevents double booking
  let reservation;
  try {
    reservation = await SlotReservation.findOneAndUpdate(
      { doctorId, appointmentDate: targetDate.toDate(), startTime },
      { $setOnInsert: { doctorId, appointmentDate: targetDate.toDate(), startTime } },
      { upsert: true, new: false, runValidators: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('This slot has just been booked by another user', 409);
    }
    throw err;
  }

  // If document already existed (findOneAndUpdate returned old doc with _id), it's a conflict
  if (reservation !== null) {
    throw new AppError('This slot is already reserved', 409);
  }

  // Create appointment
  const bookingReference = generateBookingRef(targetDate.toDate());
  const appointment = await Appointment.create({
    doctorId,
    patientId,
    appointmentDate: targetDate.toDate(),
    startTime,
    endTime,
    status: 'scheduled',
    reason,
    bookingReference,
  });

  // Update reservation with appointmentId
  await SlotReservation.findOneAndUpdate(
    { doctorId, appointmentDate: targetDate.toDate(), startTime },
    { appointmentId: appointment._id }
  );

  // Create notification for doctor
  await createNotification({
    recipientId: doctorId,
    type: 'appointment_booked',
    title: 'New Appointment Booked',
    message: `A new appointment has been scheduled for ${targetDate.format('YYYY-MM-DD')} at ${startTime}.`,
    appointmentId: appointment._id,
  });

  // Emit socket events
  if (_io) {
    emitAppointmentCreated(_io, doctorId.toString(), appointment);
  }

  return appointment.populate([
    { path: 'doctorId', select: 'name email' },
    { path: 'patientId', select: 'name email' },
  ]);
};

/**
 * Cancel appointment
 */
export const cancelAppointment = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);

  // Only the patient who owns it can cancel
  if (appointment.patientId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to cancel this appointment', 403);
  }

  if (appointment.status !== 'scheduled') {
    throw new AppError('Only scheduled appointments can be cancelled', 400);
  }

  appointment.status = 'cancelled';
  appointment.cancelledBy = userId;
  appointment.cancelledAt = new Date();
  await appointment.save();

  // Release slot reservation
  await SlotReservation.deleteOne({
    doctorId: appointment.doctorId,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
  });

  // Notify doctor
  await createNotification({
    recipientId: appointment.doctorId,
    type: 'appointment_cancelled',
    title: 'Appointment Cancelled',
    message: `Appointment on ${dayjs(appointment.appointmentDate).utc().format('YYYY-MM-DD')} at ${appointment.startTime} has been cancelled.`,
    appointmentId: appointment._id,
  });

  // Emit socket events
  if (_io) {
    emitAppointmentCancelled(_io, {
      doctorId: appointment.doctorId.toString(),
      patientId: appointment.patientId.toString(),
      appointment,
    });
  }

  return appointment;
};

/**
 * Reschedule appointment
 */
export const rescheduleAppointment = async (appointmentId, userId, { newDate, newStartTime }) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);

  if (appointment.patientId.toString() !== userId.toString()) {
    throw new AppError('You are not authorized to reschedule this appointment', 403);
  }

  if (appointment.status !== 'scheduled') {
    throw new AppError('Only scheduled appointments can be rescheduled', 400);
  }

  // Validate new slot
  const { doctorProfile } = await validateSlotAvailability(
    appointment.doctorId,
    newDate,
    newStartTime
  );

  const tz = doctorProfile.timezone || 'UTC';
  const dateStr = dayjs.utc(newDate).format('YYYY-MM-DD');
  const targetDate = dayjs.utc(newDate).startOf('day');

  const nowInTz = dayjs().tz(tz);
  const todayInTz = nowInTz.format('YYYY-MM-DD');

  if (dateStr < todayInTz) {
    throw new AppError('Cannot reschedule to a past date', 400);
  }

  if (dateStr === todayInTz) {
    const [h, m] = newStartTime.split(':').map(Number);
    const slotMins = h * 60 + m;
    const nowMins = nowInTz.hour() * 60 + nowInTz.minute();
    if (slotMins < nowMins) {
      throw new AppError('Cannot reschedule to a slot that has already passed', 400);
    }
  }

  const newEndTime = calcEndTime(newStartTime, doctorProfile.consultationDuration);

  // Atomic reserve new slot
  let newReservation;
  try {
    newReservation = await SlotReservation.findOneAndUpdate(
      { doctorId: appointment.doctorId, appointmentDate: targetDate.toDate(), startTime: newStartTime },
      { $setOnInsert: { doctorId: appointment.doctorId, appointmentDate: targetDate.toDate(), startTime: newStartTime } },
      { upsert: true, new: false }
    );
  } catch (err) {
    if (err.code === 11000) throw new AppError('The new slot has just been booked by another user', 409);
    throw err;
  }

  if (newReservation !== null) throw new AppError('The new slot is already reserved', 409);

  // Record reschedule history
  const historyEntry = {
    from: appointment.appointmentDate,
    fromStart: appointment.startTime,
    fromEnd: appointment.endTime,
    at: new Date(),
  };

  // Release old slot reservation
  await SlotReservation.deleteOne({
    doctorId: appointment.doctorId,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
  });

  // Update appointment
  appointment.rescheduleHistory.push(historyEntry);
  appointment.appointmentDate = targetDate.toDate();
  appointment.startTime = newStartTime;
  appointment.endTime = newEndTime;
  await appointment.save();

  // Update new reservation with appointmentId
  await SlotReservation.findOneAndUpdate(
    { doctorId: appointment.doctorId, appointmentDate: targetDate.toDate(), startTime: newStartTime },
    { appointmentId: appointment._id }
  );

  // Notify doctor
  await createNotification({
    recipientId: appointment.doctorId,
    type: 'appointment_rescheduled',
    title: 'Appointment Rescheduled',
    message: `Appointment has been rescheduled to ${targetDate.format('YYYY-MM-DD')} at ${newStartTime}.`,
    appointmentId: appointment._id,
  });

  if (_io) {
    emitAppointmentRescheduled(_io, {
      doctorId: appointment.doctorId.toString(),
      patientId: appointment.patientId.toString(),
      appointment,
    });
  }

  return appointment;
};

/**
 * Update appointment status (doctor only)
 */
export const updateAppointmentStatus = async (appointmentId, userId, status) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new AppError('Appointment not found', 404);

  if (appointment.doctorId.toString() !== userId.toString()) {
    throw new AppError('Only the assigned doctor can update the status', 403);
  }

  const validTransitions = {
    scheduled: ['completed', 'no_show', 'cancelled'],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  if (!validTransitions[appointment.status].includes(status)) {
    throw new AppError(`Cannot transition from '${appointment.status}' to '${status}'`, 400);
  }

  appointment.status = status;
  if (status === 'cancelled') {
    appointment.cancelledBy = userId;
    appointment.cancelledAt = new Date();
  }
  await appointment.save();

  await appointment.populate([
    { path: 'doctorId', select: 'name email phone' },
    { path: 'patientId', select: 'name email phone' },
  ]);

  const patientIdStr = appointment.patientId?._id?.toString() || appointment.patientId?.toString();
  const doctorIdStr = appointment.doctorId?._id?.toString() || appointment.doctorId?.toString();

  // Notify patient
  await createNotification({
    recipientId: patientIdStr,
    type: 'status_changed',
    title: 'Appointment Status Updated',
    message: `Your appointment status has been updated to '${status}'.`,
    appointmentId: appointment._id,
  });

  if (_io) {
    emitStatusUpdated(_io, {
      patientId: patientIdStr,
      doctorId: doctorIdStr,
      appointment,
    });
  }

  return appointment;
};

/**
 * Get appointment by ID with ownership check
 */
export const getAppointmentById = async (appointmentId, userId, role) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate('doctorId', 'name email phone')
    .populate('patientId', 'name email phone');

  if (!appointment) throw new AppError('Appointment not found', 404);

  const isOwner =
    appointment.patientId._id.toString() === userId.toString() ||
    appointment.doctorId._id.toString() === userId.toString();

  if (!isOwner) throw new AppError('You are not authorized to view this appointment', 403);

  return appointment;
};
