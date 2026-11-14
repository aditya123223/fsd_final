import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { fetchDoctorDashboard } from '../../api/doctor.api.js';
import { useSocket } from '../../hooks/useSocket.js';
import StatCard from '../../components/dashboard/StatCard.jsx';
import WeeklyChart from '../../components/dashboard/WeeklyChart.jsx';
import AppointmentStatusBadge from '../../components/appointments/AppointmentStatusBadge.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import dayjs from 'dayjs';

export default function DoctorDashboard() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', 'dashboard'],
    queryFn: async () => {
      const res = await fetchDoctorDashboard();
      return res.data?.data || res.data;
    },
  });

  // Listen to live booking and queue updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] });
    };

    socket.on('appointment:created', handleUpdate);
    socket.on('doctor:queueUpdated', handleUpdate);
    socket.on('appointment:statusUpdated', handleUpdate);
    socket.on('appointment:cancelled', handleUpdate);

    return () => {
      socket.off('appointment:created', handleUpdate);
      socket.off('doctor:queueUpdated', handleUpdate);
      socket.off('appointment:statusUpdated', handleUpdate);
      socket.off('appointment:cancelled', handleUpdate);
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
    todayCount: data?.todayCount ?? 0,
    upcomingCount: data?.upcomingCount ?? 0,
    completedCount: data?.completedCount ?? 0,
    cancelledCount: data?.cancelledCount ?? 0,
    totalPatients: data?.totalPatients ?? 0,
  };

  const todayAppointments = Array.isArray(data?.todayAppointments) ? data.todayAppointments : [];
  const weeklyStats = Array.isArray(data?.weeklyStats) ? data.weeklyStats : [];

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Patients"
          value={stats.todayCount}
          icon={Users}
          color="teal"
          subtitle="Scheduled for today"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingCount}
          icon={Calendar}
          color="blue"
          subtitle="Future consultations"
        />
        <StatCard
          title="Completed"
          value={stats.completedCount}
          icon={CheckCircle2}
          color="green"
          subtitle="Successfully consulted"
        />
        <StatCard
          title="Total Patients Seen"
          value={stats.totalPatients}
          icon={TrendingUp}
          color="purple"
          subtitle="Unique patient visits"
        />
      </div>

      {/* Analytics Chart & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Weekly Appointment Volume</h3>
              <p className="text-xs text-gray-500">Completed and scheduled visits this week</p>
            </div>
            <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
              This Week
            </span>
          </div>
          <WeeklyChart data={weeklyStats} />
        </div>

        {/* Quick Management Actions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Quick Clinical Actions</h3>
            <p className="text-xs text-gray-500 mb-4">Fast shortcuts for daily tasks</p>
            <div className="space-y-2.5">
              <Link
                to="/doctor/today"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-teal-50 hover:bg-teal-100/70 text-teal-900 font-semibold text-xs transition-colors border border-teal-100"
              >
                <span>Manage Today's Live Queue</span>
                <ArrowRight className="w-4 h-4 text-teal-600" />
              </Link>
              <Link
                to="/doctor/schedule"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors border border-slate-200"
              >
                <span>Edit Weekly Schedule</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
              <Link
                to="/doctor/schedule/exceptions"
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors border border-slate-200"
              >
                <span>Block Leave / Exceptions</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 mt-4">
            <span className="font-semibold block mb-0.5">Real-time sync active</span>
            Socket events automatically notify you when patients book or cancel slots.
          </div>
        </div>
      </div>

      {/* Today's Queue Preview */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Today's Scheduled Consultations</h3>
            <p className="text-xs text-gray-500">Patients booked for today in chronological order</p>
          </div>
          <Link
            to="/doctor/today"
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            Open Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            No consultations scheduled for today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-100 text-gray-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {todayAppointments.slice(0, 5).map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-gray-800">
                      {appt.startTime} - {appt.endTime}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      {appt.patientId?.name || 'Patient'}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate">
                      {appt.reason || 'General checkup'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-gray-500">
                      {appt.bookingReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <AppointmentStatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
