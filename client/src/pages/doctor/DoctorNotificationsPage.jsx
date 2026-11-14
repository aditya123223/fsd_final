import React from 'react';
import { useNotifications } from '../../hooks/useNotifications.js';
import { Bell, Check, Calendar, AlertCircle, Clock } from 'lucide-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(relativeTime);

export default function DoctorNotificationsPage() {
  const { notifications, unreadCount, isLoading, markRead, markAll } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'appointment_booked':
        return <Calendar className="w-5 h-5 text-teal-600" />;
      case 'appointment_cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'status_changed':
        return <Check className="w-5 h-5 text-green-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinical Notifications</h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time alerts for incoming patient bookings, cancellations, and schedule updates
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAll()}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 transition-colors"
          >
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No alerts at this time"
          description="Whenever a patient books or modifies an appointment with you, you'll be notified here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 shadow-sm overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                !n.isRead ? 'bg-teal-50/40' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                  <span className="text-xs text-gray-400 shrink-0">
                    {dayjs(n.createdAt).fromNow()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
              </div>
              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 mt-2 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
