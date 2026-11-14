import * as patientService from '../services/patient.service.js';
import { sendSuccess, sendPaginated } from '../utils/response.utils.js';

export const getDashboard = async (req, res, next) => {
  try {
    const patientId = req.user.userId;
    const data = await patientService.getPatientDashboard(patientId);
    return sendSuccess(res, data, 'Dashboard fetched');
  } catch (err) {
    next(err);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const patientId = req.user.userId;
    const { tab, status, page = 1, limit = 10 } = req.query;
    const filter = tab || status || 'all';
    const { appointments, total } = await patientService.getPatientAppointments(patientId, {
      tab: filter,
      page: Number(page),
      limit: Number(limit),
    });
    return sendPaginated(res, appointments, total, Number(page), Number(limit));
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const patientId = req.user.userId;
    const data = await patientService.getPatientProfile(patientId);
    return sendSuccess(res, data, 'Profile fetched');
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const patientId = req.user.userId;
    const data = await patientService.updatePatientProfile(patientId, req.body);
    return sendSuccess(res, data, 'Profile updated');
  } catch (err) {
    next(err);
  }
};
