import User from '../models/User.model.js';
import DoctorProfile from '../models/DoctorProfile.model.js';
import Appointment from '../models/Appointment.model.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

/**
 * Get paginated list of all doctors (public)
 */
export const listDoctors = async ({ page = 1, limit = 10, specialization, search }) => {
  const skip = (page - 1) * limit;

  const userQuery = { role: 'doctor' };
  if (search) {
    userQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(userQuery).lean();
  const userIds = users.map((u) => u._id);

  const profileQuery = { userId: { $in: userIds } };
  if (specialization) {
    profileQuery.specialization = { $regex: specialization, $options: 'i' };
  }

  const [profiles, total] = await Promise.all([
    DoctorProfile.find(profileQuery)
      .populate('userId', 'name email phone')
      .skip(skip)
      .limit(limit)
      .lean(),
    DoctorProfile.countDocuments(profileQuery),
  ]);

  return { profiles, total };
};

/**
 * Get a single doctor by userId
 */
export const getDoctorById = async (doctorId) => {
  const user = await User.findOne({ _id: doctorId, role: 'doctor' }).lean();
  if (!user) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }

  const profile = await DoctorProfile.findOne({ userId: doctorId })
    .populate('userId', 'name email phone')
    .lean();

  return { user, profile };
};

/**
 * Get doctor profile
 */
export const getDoctorProfile = async (doctorId) => {
  const user = await User.findById(doctorId).lean();
  const profile = await DoctorProfile.findOne({ userId: doctorId }).lean();
  return { user, profile };
};

/**
 * Update doctor profile
 */
export const updateDoctorProfile = async (doctorId, updates) => {
  const allowedUserFields = ['name', 'phone'];
  const allowedProfileFields = [
    'specialization', 'qualifications', 'experience', 'consultationFee',
    'registrationNumber', 'consultationDuration', 'bio', 'timezone', 'profileImage',
  ];

  const userUpdates = {};
  const profileUpdates = {};

  for (const key of allowedUserFields) {
    if (updates[key] !== undefined) userUpdates[key] = updates[key];
  }
  for (const key of allowedProfileFields) {
    if (updates[key] !== undefined) profileUpdates[key] = updates[key];
  }

  const [user, profile] = await Promise.all([
    Object.keys(userUpdates).length
      ? User.findByIdAndUpdate(doctorId, userUpdates, { new: true }).lean()
      : User.findById(doctorId).lean(),
    Object.keys(profileUpdates).length
      ? DoctorProfile.findOneAndUpdate({ userId: doctorId }, profileUpdates, { new: true }).lean()
      : DoctorProfile.findOne({ userId: doctorId }).lean(),
  ]);

  return { user, profile };
};

/**
 * Get doctor dashboard stats
 */
export const getDoctorDashboard = async (doctorId) => {
  const todayStart = dayjs().utc().startOf('day').toDate();
  const todayEnd = dayjs().utc().endOf('day').toDate();
  const weekStart = dayjs().utc().startOf('week').toDate();
  const weekEnd = dayjs().utc().endOf('week').toDate();

  const [
    todayCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    todayAppointments,
    distinctPatients,
    weeklyAppointments,
  ] = await Promise.all([
    Appointment.countDocuments({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    }),
    Appointment.countDocuments({
      doctorId,
      appointmentDate: { $gt: todayEnd },
      status: 'scheduled',
    }),
    Appointment.countDocuments({ doctorId, status: 'completed' }),
    Appointment.countDocuments({ doctorId, status: 'cancelled' }),
    Appointment.find({
      doctorId,
      appointmentDate: { $gte: todayStart, $lte: todayEnd },
    })
      .populate('patientId', 'name email phone')
      .sort({ startTime: 1 })
      .lean(),
    Appointment.distinct('patientId', { doctorId, status: 'completed' }),
    Appointment.find({
      doctorId,
      appointmentDate: { $gte: weekStart, $lte: weekEnd },
    })
      .populate('patientId', 'name email')
      .sort({ appointmentDate: 1, startTime: 1 })
      .lean(),
  ]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

  for (const appt of weeklyAppointments) {
    const dName = dayNames[dayjs.utc(appt.appointmentDate).day()];
    if (dayCounts[dName] !== undefined) {
      dayCounts[dName] += 1;
    }
  }

  const weeklyStats = dayNames.map((d) => ({
    day: d,
    count: dayCounts[d],
  }));

  const stats = {
    todayCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    totalPatients: distinctPatients.length,
  };

  return {
    stats,
    todayCount,
    upcomingCount,
    completedCount,
    cancelledCount,
    totalPatients: distinctPatients.length,
    todayAppointments,
    weeklyAppointments,
    weeklyStats,
  };
};

/**
 * Get today's appointments for a doctor
 */
export const getTodayAppointments = async (doctorId) => {
  const todayStart = dayjs().utc().startOf('day').toDate();
  const todayEnd = dayjs().utc().endOf('day').toDate();

  return Appointment.find({
    doctorId,
    appointmentDate: { $gte: todayStart, $lte: todayEnd },
  })
    .populate('patientId', 'name email phone')
    .sort({ startTime: 1 })
    .lean();
};

/**
 * Get paginated doctor appointments with optional status filter
 */
export const getDoctorAppointments = async (doctorId, { page = 1, limit = 10, status }) => {
  const skip = (page - 1) * limit;
  const query = { doctorId };
  if (status) query.status = status;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate('patientId', 'name email phone')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(query),
  ]);

  return { appointments, total };
};
