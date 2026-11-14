import { Calendar, Clock, User } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/dateTime.js';
import AppointmentStatusBadge from './AppointmentStatusBadge.jsx';
import Avatar from '../common/Avatar.jsx';

export default function AppointmentCard({ appointment, actions }) {
  const { doctor, patient, scheduledDate, startTime, reason, status } = appointment;
  const person = doctor || patient;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Avatar
          src={person?.profileImage}
          name={person?.name || 'Unknown'}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 truncate">
                {person?.name || 'Unknown'}
              </h3>
              {doctor?.specialization && (
                <p className="text-sm text-gray-500">{doctor.specialization}</p>
              )}
              {patient && (
                <p className="text-sm text-gray-500">Patient</p>
              )}
            </div>
            <AppointmentStatusBadge status={status} />
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(scheduledDate || startTime)}
            </span>
            {startTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(startTime)}
              </span>
            )}
            {reason && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {reason}
              </span>
            )}
          </div>

          {actions && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
