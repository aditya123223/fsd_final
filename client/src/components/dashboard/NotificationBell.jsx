import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications.js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';

dayjs.extend(relativeTime);

export default function NotificationBell({ role = 'patient' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markRead, markAll } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'appointment_booked':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'appointment_cancelled':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'status_changed':
        return <Check className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-teal-600" />;
    }
  };

  const notificationsLink = role === 'doctor' ? '/doctor/notifications' : '/patient/notifications';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAll()}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  onClick={() => !item.isRead && markRead(item._id)}
                  className={`p-3.5 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${
                    !item.isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-full bg-white shadow-sm border border-gray-100 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {dayjs(item.createdAt).fromNow()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{item.message}</p>
                  </div>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary-600 mt-2 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 text-center">
            <Link
              to={notificationsLink}
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
