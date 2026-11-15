import { useMemo } from 'react';
import dayjs from 'dayjs';
import { formatDate, formatTime } from '../utils/dateTime.js';

/**
 * Custom Hook: useAppointmentDetails
 * 
 * Encapsulates:
 * - Participant extraction (doctor vs patient based on role)
 * - Safe fallback handling for names and specializations
 * - Formatted date, time, and human-friendly countdown/timing badge
 * - Action eligibility checks (cancellation / reschedule)
 */
export function useAppointmentDetails(appointment, role = 'patient') {
  return useMemo(() => {
    if (!appointment) return {};

    const doctor =
      appointment.doctor ||
      (typeof appointment.doctorId === 'object' && appointment.doctorId !== null
        ? appointment.doctorId
        : null);

    const patient =
      appointment.patient ||
      (typeof appointment.patientId === 'object' && appointment.patientId !== null
        ? appointment.patientId
        : null);

    const person = role === 'doctor' ? (patient || doctor) : (doctor || patient);
    const personName =
      person?.name ||
      (role === 'doctor'
        ? (typeof appointment.patientId === 'string' ? 'Patient' : 'Unknown Patient')
        : (typeof appointment.doctorId === 'string' ? 'Doctor' : 'Unknown Doctor'));

    const specialization = doctor?.specialization;
    const scheduledDate = appointment.appointmentDate || appointment.scheduledDate;
    const formattedDate = formatDate(scheduledDate);
    const formattedTime = formatTime(appointment.startTime);
    const isScheduled = appointment.status === 'scheduled';

    // Calculate a relative countdown badge (e.g., "Today", "Tomorrow", "In 2 days")
    let timeBadge = null;
    if (scheduledDate && isScheduled) {
      const apptDay = dayjs(scheduledDate).startOf('day');
      const today = dayjs().startOf('day');
      const diffDays = apptDay.diff(today, 'day');

      if (diffDays === 0) {
        timeBadge = { label: 'Today', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      } else if (diffDays === 1) {
        timeBadge = { label: 'Tomorrow', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      } else if (diffDays > 1) {
        timeBadge = { label: `In ${diffDays} days`, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      } else {
        timeBadge = { label: 'Past date', className: 'bg-gray-100 text-gray-600 border-gray-200' };
      }
    }

    return {
      person,
      personName,
      doctor,
      patient,
      specialization,
      scheduledDate,
      formattedDate,
      formattedTime,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      reason: appointment.reason,
      status: appointment.status,
      isScheduled,
      canCancel: isScheduled,
      canReschedule: isScheduled,
      timeBadge,
    };
  }, [appointment, role]);
}
