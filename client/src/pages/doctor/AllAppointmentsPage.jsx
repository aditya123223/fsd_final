import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDoctorAppointments } from '../../api/doctor.api.js';
import { useSocket } from '../../hooks/useSocket.js';
import AppointmentStatusBadge from '../../components/appointments/AppointmentStatusBadge.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { Calendar, Search, Filter } from 'lucide-react';
import dayjs from 'dayjs';

export default function AllAppointmentsPage() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', 'appointments', { status, page, limit }],
    queryFn: async () => {
      const res = await fetchDoctorAppointments({
        status: status || undefined,
        page,
        limit,
      });
      return res.data;
    },
  });

  // Listen to live updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] });
    };

    socket.on('doctor:queueUpdated', handleUpdate);
    socket.on('appointment:statusUpdated', handleUpdate);
    socket.on('appointment:created', handleUpdate);
    socket.on('appointment:cancelled', handleUpdate);

    return () => {
      socket.off('doctor:queueUpdated', handleUpdate);
      socket.off('appointment:statusUpdated', handleUpdate);
      socket.off('appointment:created', handleUpdate);
      socket.off('appointment:cancelled', handleUpdate);
    };
  }, [socket, queryClient]);

  const appointments = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : (data?.appointments || []);
  const total = data?.pagination?.total ?? (Array.isArray(appointments) ? appointments.length : 0);
  const totalPages = data?.pagination?.totalPages || Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Appointments</h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete historical and upcoming consultation records
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments found"
          description="There are no consultations matching your current filters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-semibold text-gray-900 block">
                        {dayjs(appt.appointmentDate).format('MMM D, YYYY')}
                      </span>
                      <span className="text-gray-400 text-[11px]">
                        {appt.startTime} - {appt.endTime}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      {appt.patientId?.name || 'Patient'}
                    </td>
                    <td className="py-4 px-4 text-gray-500">
                      <p>{appt.patientId?.phone || '—'}</p>
                      <p className="text-[11px] text-gray-400">{appt.patientId?.email}</p>
                    </td>
                    <td className="py-4 px-4 text-gray-600 max-w-xs truncate">
                      {appt.reason || 'General checkup'}
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-gray-500">
                      {appt.bookingReference}
                    </td>
                    <td className="py-4 px-4">
                      <AppointmentStatusBadge status={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Showing {appointments.length} of {total} appointments
            </span>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
