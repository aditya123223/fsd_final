import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  UserCheck,
  CalendarCheck,
} from 'lucide-react';
import { fetchPatientDashboard } from '../../api/patient.api.js';
import { useSocket } from '../../hooks/useSocket.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import dayjs from 'dayjs';

export default function PatientDashboard() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['patient', 'dashboard'],
    queryFn: async () => {
      const res = await fetchPatientDashboard();
      return res.data.data;
    },
  });

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
    };

    socket.on('appointment:statusUpdated', handleUpdate);
    socket.on('appointment:cancelled', handleUpdate);
    socket.on('appointment:rescheduled', handleUpdate);
    socket.on('appointment:created', handleUpdate);

    return () => {
      socket.off('appointment:statusUpdated', handleUpdate);
      socket.off('appointment:cancelled', handleUpdate);
      socket.off('appointment:rescheduled', handleUpdate);
      socket.off('appointment:created', handleUpdate);
    };
  }, [socket, queryClient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LoadingSkeleton variant="stat-card" count={4} />
        </div>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  const stats = data?.stats || {
    upcomingCount: 0,
    completedCount: 0,
    cancelledCount: 0,
    totalCount: 0,
  };

  const nextAppointment = data?.nextAppointment;
  const recentAppointments = data?.recentAppointments || [];
  const availableDoctors = data?.availableDoctors || [];

  return (
    <div className="space-y-8">
      {/* Top Banner / Next Appointment Highlight */}
      {nextAppointment ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              <CalendarCheck className="w-3.5 h-3.5" /> Next Scheduled Consultation
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">
              {nextAppointment.doctorId?.name || 'Your Doctor'}
            </h3>
            <p className="text-blue-100 text-sm flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {dayjs(nextAppointment.appointmentDate).format('dddd, MMMM D, YYYY')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {nextAppointment.startTime} - {nextAppointment.endTime}
              </span>
              <span className="bg-blue-800/60 px-2.5 py-0.5 rounded text-xs">
                Ref: {nextAppointment.bookingReference}
              </span>
            </p>
          </div>
          <Link
            to="/patient/appointments"
            className="self-start md:self-center px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold text-sm transition-colors shadow-sm shrink-0 flex items-center gap-2"
          >
            Manage Booking <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Need to see a doctor?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Find verified specialists and book appointments with real-time slot availability.
            </p>
          </div>
          <Link
            to="/patient/doctors"
            className="self-start sm:self-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-2"
          >
            Book Appointment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Upcoming"
          value={stats.upcomingCount}
          icon={Calendar}
          color="blue"
          subtitle="Scheduled visits"
        />
        <StatCard
          title="Completed"
          value={stats.completedCount}
          icon={CheckCircle2}
          color="green"
          subtitle="Consultations attended"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelledCount}
          icon={XCircle}
          color="red"
          subtitle="Released slots"
        />
        <StatCard
          title="Total Appointments"
          value={stats.totalCount}
          icon={Clock}
          color="purple"
          subtitle="Lifetime bookings"
        />
      </div>

      {/* Available Doctors Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Available Doctors</h3>
            <p className="text-xs text-gray-500">Specialists ready for consultations</p>
          </div>
          <Link
            to="/patient/doctors"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableDoctors.slice(0, 3).map((doc) => (
            <div
              key={doc._id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-base border border-teal-100">
                    {doc.name?.charAt(0) || 'D'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{doc.name}</h4>
                    <p className="text-xs text-teal-600 font-medium truncate">
                      {doc.profile?.specialization || 'General Specialist'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <p>Experience: {doc.profile?.experience || 0} years</p>
                  <p>Consultation Fee: ${doc.profile?.consultationFee || 0}</p>
                </div>
              </div>
              <Link
                to={`/patient/book/${doc._id}`}
                className="w-full text-center py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Book Consultation
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Recent Appointments</h3>
            <p className="text-xs text-gray-500">Your latest appointments and activity</p>
          </div>
          <Link
            to="/patient/appointments"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            All Appointments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentAppointments.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-sm text-gray-400">
            No recent appointments found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentAppointments.slice(0, 4).map((appt) => (
              <AppointmentCard key={appt._id} appointment={appt} role="patient" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
