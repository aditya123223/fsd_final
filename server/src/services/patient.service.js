import User from '../models/User.model.js';
import PatientProfile from '../models/PatientProfile.model.js';
import DoctorProfile from '../models/DoctorProfile.model.js';
import Appointment from '../models/Appointment.model.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

/**
 * Get patient profile
 */
export const getPatientProfile = async (patientId) => {
  const user = await User.findById(patientId).lean();
  const profile = await PatientProfile.findOne({ userId: patientId }).lean();
  return { user, profile };
};

/**
 * Update patient profile
 */
export const updatePatientProfile = async (patientId, updates) => {
  const allowedUserFields = ['name', 'phone'];
  const allowedProfileFields = ['dateOfBirth', 'gender', 'bloodGroup', 'profileImage'];

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
      ? User.findByIdAndUpdate(patientId, userUpdates, { new: true }).lean()
      : User.findById(patientId).lean(),
    Object.keys(profileUpdates).length
      ? PatientProfile.findOneAndUpdate({ userId: patientId }, profileUpdates, { new: true }).lean()
      : PatientProfile.findOne({ userId: patientId }).lean(),
  ]);

  return { user, profile };
};

const enrichAppointmentsWithDoctorInfo = async (appointments) => {
  if (!appointments || appointments.length === 0) return [];
  const doctorUserIds = [
    ...new Set(
      appointments
        .map((a) => (a.doctorId?._id ? a.doctorId._id.toString() : a.doctorId?.toString()))
        .filter(Boolean)
    ),
  ];
  const doctorProfiles = await DoctorProfile.find({ userId: { $in: doctorUserIds } }).lean();
  const profileMap = new Map(doctorProfiles.map((p) => [p.userId.toString(), p]));

  return appointments.map((appt) => {
    const docId = appt.doctorId?._id ? appt.doctorId._id.toString() : appt.doctorId?.toString();
    const docProfile = docId ? profileMap.get(docId) : null;
    const docObj =
      appt.doctorId && typeof appt.doctorId === 'object'
        ? {
            ...appt.doctorId,
            specialization: docProfile?.specialization || '',
            profileImage: docProfile?.profileImage || '',
            consultationFee: docProfile?.consultationFee || 0,
          }
        : appt.doctorId;

    return {
      ...appt,
      doctorId: docObj,
      doctor: docObj,
      patient: appt.patientId && typeof appt.patientId === 'object' ? appt.patientId : null,
      scheduledDate: appt.appointmentDate,
    };
  });
};

/**
 * Get patient dashboard
 */
export const getPatientDashboard = async (patientId) => {
  const [upcomingRaw, completedCount, cancelledCount, doctorProfiles] = await Promise.all([
    Appointment.find({
      patientId,
      status: 'scheduled',
      appointmentDate: { $gte: dayjs().utc().startOf('day').toDate() },
    })
      .populate('doctorId', 'name email phone')
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(5)
      .lean(),
    Appointment.countDocuments({ patientId, status: 'completed' }),
    Appointment.countDocuments({ patientId, status: 'cancelled' }),
    DoctorProfile.find({}).populate('userId', 'name email phone').limit(4).lean(),
  ]);

  const upcomingAppointments = await enrichAppointmentsWithDoctorInfo(upcomingRaw);
  const nextAppointment = upcomingAppointments[0] || null;
  const availableDoctors = doctorProfiles.map((dp) => ({
    _id: dp.userId?._id || dp._id,
    name: dp.userId?.name || 'Doctor',
    email: dp.userId?.email,
    profile: dp,
  }));

  const totalCount = upcomingAppointments.length + completedCount + cancelledCount;

  return {
    stats: {
      upcomingCount: upcomingAppointments.length,
      completedCount,
      cancelledCount,
      totalCount,
    },
    upcomingCount: upcomingAppointments.length,
    nextAppointment,
    completedCount,
    cancelledCount,
    upcomingAppointments,
    recentAppointments: upcomingAppointments,
    availableDoctors,
  };
};

/**
 * Get paginated patient appointments with tab filtering
 */
export const getPatientAppointments = async (patientId, { tab = 'all', page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const query = { patientId };

  const tabStatusMap = {
    upcoming: 'scheduled',
    scheduled: 'scheduled',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no_show',
  };

  if (tab && tab !== 'all' && tabStatusMap[tab]) {
    query.status = tabStatusMap[tab];
    if (tab === 'upcoming') {
      query.appointmentDate = { $gte: dayjs().utc().startOf('day').toDate() };
    }
  }

  const [rawAppointments, total] = await Promise.all([
    Appointment.find(query)
      .populate('doctorId', 'name email phone')
      .populate('patientId', 'name email phone')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(query),
  ]);

  const appointments = await enrichAppointmentsWithDoctorInfo(rawAppointments);

  return { appointments, total };
};
