import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import DoctorSchedule from '../models/DoctorSchedule.model.js';
import ScheduleException from '../models/ScheduleException.model.js';
import DoctorProfile from '../models/DoctorProfile.model.js';
import Appointment from '../models/Appointment.model.js';
import { generateSlots } from '../utils/slot.utils.js';

dayjs.extend(utc);

const DEFAULT_DAYS = Array.from({ length: 7 }, (_, i) => i);

/**
 * Get full 7-day schedule for a doctor (fill missing days with defaults)
 */
export const getDoctorSchedule = async (doctorId) => {
  const existing = await DoctorSchedule.find({ doctorId }).lean();
  const scheduleMap = {};
  for (const day of existing) {
    scheduleMap[day.dayOfWeek] = day;
  }

  return DEFAULT_DAYS.map((dow) => {
    if (scheduleMap[dow]) return scheduleMap[dow];
    return {
      doctorId,
      dayOfWeek: dow,
      isAvailable: false,
      workingIntervals: [],
      breakIntervals: [],
    };
  });
};

/**
 * Validate no overlapping intervals within a list
 */
const hasOverlap = (intervals) => {
  const times = intervals.map((iv) => ({
    start: iv.start.split(':').map(Number).reduce((h, m) => h * 60 + m),
    end: iv.end.split(':').map(Number).reduce((h, m) => h * 60 + m),
  }));
  for (let i = 0; i < times.length; i++) {
    for (let j = i + 1; j < times.length; j++) {
      if (times[i].start < times[j].end && times[j].start < times[i].end) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Upsert doctor schedule (all 7 days or partial)
 */
export const upsertSchedule = async (doctorId, scheduleData) => {
  // scheduleData: Array of { dayOfWeek, isAvailable, workingIntervals, breakIntervals }
  const results = [];

  for (const dayData of scheduleData) {
    const { dayOfWeek, isAvailable, workingIntervals = [], breakIntervals = [] } = dayData;

    // Validate no overlapping working intervals
    if (workingIntervals.length > 1 && hasOverlap(workingIntervals)) {
      const err = new Error(`Overlapping working intervals for day ${dayOfWeek}`);
      err.statusCode = 400;
      throw err;
    }

    const doc = await DoctorSchedule.findOneAndUpdate(
      { doctorId, dayOfWeek },
      { isAvailable, workingIntervals, breakIntervals, effectiveFrom: new Date() },
      { upsert: true, new: true, runValidators: true }
    );
    results.push(doc);
  }

  return results;
};

/**
 * Add or update a schedule exception for a specific date
 */
export const addException = async (doctorId, { date, type, customIntervals, reason }) => {
  const exceptionDate = dayjs(date).utc().startOf('day').toDate();

  if (dayjs(exceptionDate).isBefore(dayjs().utc().startOf('day'))) {
    const err = new Error('Cannot add exception for a past date');
    err.statusCode = 400;
    throw err;
  }

  const exception = await ScheduleException.findOneAndUpdate(
    { doctorId, date: exceptionDate },
    { type, customIntervals: customIntervals || [], reason },
    { upsert: true, new: true, runValidators: true }
  );

  return exception;
};

/**
 * Get available slots for a doctor on a given date
 */
export const getAvailableSlots = async (doctorId, date) => {
  const targetDate = dayjs.utc(date).startOf('day');
  const dayOfWeek = targetDate.day();

  // Get doctor profile for consultation duration and timezone
  const doctorProfile = await DoctorProfile.findOne({ userId: doctorId });
  const consultationDuration = doctorProfile?.consultationDuration || 30;
  const timezoneStr = doctorProfile?.timezone || 'UTC';

  // Get the schedule for that day of week
  const schedule = await DoctorSchedule.findOne({ doctorId, dayOfWeek }).lean();

  // Get exception for the specific date
  const exception = await ScheduleException.findOne({
    doctorId,
    date: targetDate.toDate(),
  }).lean();

  // Get booked slots for that date
  const appointments = await Appointment.find({
    doctorId,
    appointmentDate: targetDate.toDate(),
    status: { $in: ['scheduled'] },
  }).lean();

  const bookedSlots = appointments.map((a) => a.startTime);

  const slots = generateSlots(
    schedule,
    exception,
    bookedSlots,
    targetDate.toDate(),
    consultationDuration,
    timezoneStr
  );

  return slots;
};
