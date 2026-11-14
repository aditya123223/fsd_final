import * as doctorService from '../services/doctor.service.js';
import * as scheduleService from '../services/schedule.service.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.utils.js';

export const listDoctors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, specialization, search } = req.query;
    const { profiles, total } = await doctorService.listDoctors({
      page: Number(page),
      limit: Number(limit),
      specialization,
      search,
    });
    return sendPaginated(res, profiles, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
};

export const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await doctorService.getDoctorById(id);
    return sendSuccess(res, data, 'Doctor fetched');
  } catch (err) {
    next(err);
  }
};

export const getDoctorAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return sendError(res, 'Date query parameter is required', 400);
    const slots = await scheduleService.getAvailableSlots(id, date);
    return sendSuccess(res, { slots, date }, 'Availability fetched');
  } catch (err) {
    next(err);
  }
};

export const getDashboard = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const data = await doctorService.getDoctorDashboard(doctorId);
    return sendSuccess(res, data, 'Dashboard fetched');
  } catch (err) {
    next(err);
  }
};

export const getTodayAppointments = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const appointments = await doctorService.getTodayAppointments(doctorId);
    return sendSuccess(res, { appointments }, 'Today\'s appointments fetched');
  } catch (err) {
    next(err);
  }
};

export const getAllAppointments = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    const { appointments, total } = await doctorService.getDoctorAppointments(doctorId, {
      page: Number(page),
      limit: Number(limit),
      status,
    });
    return sendPaginated(res, appointments, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
};

export const getSchedule = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const schedule = await scheduleService.getDoctorSchedule(doctorId);
    return sendSuccess(res, { schedule }, 'Schedule fetched');
  } catch (err) {
    next(err);
  }
};

export const updateSchedule = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const { schedule } = req.body;
    if (!Array.isArray(schedule)) return sendError(res, 'schedule must be an array', 400);
    const result = await scheduleService.upsertSchedule(doctorId, schedule);
    return sendSuccess(res, { schedule: result }, 'Schedule updated');
  } catch (err) {
    next(err);
  }
};

export const addException = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const exceptionData = req.body;
    const exception = await scheduleService.addException(doctorId, exceptionData);
    return sendSuccess(res, { exception }, 'Exception added', 201);
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const data = await doctorService.getDoctorProfile(doctorId);
    return sendSuccess(res, data, 'Profile fetched');
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const doctorId = req.user.userId;
    const data = await doctorService.updateDoctorProfile(doctorId, req.body);
    return sendSuccess(res, data, 'Profile updated');
  } catch (err) {
    next(err);
  }
};
