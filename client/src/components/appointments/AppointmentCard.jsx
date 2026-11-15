import React from 'react';
import { Calendar, Clock, FileText } from 'lucide-react';
import AppointmentStatusBadge from './AppointmentStatusBadge.jsx';
import Avatar from '../common/Avatar.jsx';
import { useAppointmentDetails } from '../../hooks/useAppointmentDetails.js';

export default function AppointmentCard({
  appointment,
  role = 'patient',
  actions,
  onCancel,
  onReschedule,
}) {
  const {
    person,
    personName,
    doctor,
    specialization,
    formattedDate,
    formattedTime,
    reason,
    status,
    isScheduled,
    canCancel,
    canReschedule,
    timeBadge,
  } = useAppointmentDetails(appointment, role);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div className="flex items-start gap-4">
        <Avatar
          src={person?.profileImage}
          name={personName}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {personName}
                </h3>
                {timeBadge && (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${timeBadge.className}`}>
                    {timeBadge.label}
                  </span>
                )}
              </div>
              {role === 'patient' && specialization && (
                <p className="text-sm text-teal-600 font-medium">{specialization}</p>
              )}
              {role === 'patient' && !specialization && doctor && (
                <p className="text-sm text-gray-500">Doctor</p>
              )}
              {role === 'doctor' && (
                <p className="text-sm text-gray-500">Patient</p>
              )}
            </div>
            <AppointmentStatusBadge status={status} />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
            {formattedDate && (
              <span className="flex items-center gap-1 font-medium text-gray-700">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {formattedDate}
              </span>
            )}
            {formattedTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {formattedTime}
              </span>
            )}
            {reason && (
              <span className="flex items-center gap-1 text-gray-600">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                {reason}
              </span>
            )}
          </div>
        </div>
      </div>

      {actions ? (
        <div className="mt-4 flex gap-2 flex-wrap pt-3 border-t border-gray-100">
          {actions}
        </div>
      ) : (
        isScheduled && (onReschedule || onCancel) && (
          <div className="mt-4 flex gap-2 flex-wrap justify-end pt-3 border-t border-gray-100">
            {onReschedule && canReschedule && (
              <button
                type="button"
                onClick={() => onReschedule(appointment)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
              >
                Reschedule
              </button>
            )}
            {onCancel && canCancel && (
              <button
                type="button"
                onClick={() => onCancel(appointment)}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
