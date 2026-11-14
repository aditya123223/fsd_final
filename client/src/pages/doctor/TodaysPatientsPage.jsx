import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTodayAppointments } from '../../api/doctor.api.js';
import { updateAppointmentStatus } from '../../api/appointment.api.js';
import { useSocket } from '../../hooks/useSocket.js';
import AppointmentStatusBadge from '../../components/appointments/AppointmentStatusBadge.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { CheckCircle2, UserX, Clock, Users, Phone, Mail, Calendar } from 'lucide-react';
import dayjs from 'dayjs';

export default function TodaysPatientsPage() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const [confirmAction, setConfirmAction] = useState(null); // { appt, status: 'completed' | 'no_show' }
  const [updating, setUpdating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', 'today'],
    queryFn: async () => {
      const res = await fetchTodayAppointments();
      return res.data?.data || res.data;
    },
  });

  // Listen to queue updates from socket
  useEffect(() => {
    if (!socket) return;
    const handleQueueUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'today'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] });
    };

    socket.on('doctor:queueUpdated', handleQueueUpdate);
    socket.on('appointment:statusUpdated', handleQueueUpdate);
    socket.on('appointment:created', handleQueueUpdate);
    socket.on('appointment:cancelled', handleQueueUpdate);

    return () => {
      socket.off('doctor:queueUpdated', handleQueueUpdate);
      socket.off('appointment:statusUpdated', handleQueueUpdate);
      socket.off('appointment:created', handleQueueUpdate);
      socket.off('appointment:cancelled', handleQueueUpdate);
    };
  }, [socket, queryClient]);

  const handleStatusChange = async () => {
    if (!confirmAction) return;
    setUpdating(true);
    try {
      await updateAppointmentStatus(confirmAction.appt._id, confirmAction.status);
      toast.success(
        confirmAction.status === 'completed'
          ? 'Patient consultation completed & approved!'
          : 'Appointment marked as No Show'
      );
      setConfirmAction(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctor', 'today'] }),
        queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] }),
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const appointments = Array.isArray(data)
    ? data
    : Array.isArray(data?.appointments)
    ? data.appointments
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Patient Queue</h1>
          <p className="text-xs text-gray-500 mt-1">
            {dayjs().format('dddd, MMMM D, YYYY')} • Sorted chronologically
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" /> Live Doctor Queue
          </span>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients scheduled for today"
          description="When patients book slots for today, they will appear here in real-time."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
          {appointments.map((appt, idx) => {
            const isScheduled = appt.status === 'scheduled';
            return (
              <div
                key={appt._id}
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isScheduled ? 'hover:bg-slate-50/50' : 'bg-gray-50/40 opacity-80'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 font-bold flex flex-col items-center justify-center border border-teal-100 shrink-0">
                    <span className="text-[10px] uppercase font-semibold text-teal-500">Slot</span>
                    <span className="text-xs font-bold leading-none">{appt.startTime}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900 text-base">
                        {appt.patientId?.name || 'Patient'}
                      </h3>
                      <AppointmentStatusBadge status={appt.status} />
                      <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {appt.bookingReference}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {appt.startTime} - {appt.endTime}
                      </span>
                      {appt.patientId?.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {appt.patientId.phone}
                        </span>
                      )}
                      {appt.patientId?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {appt.patientId.email}
                        </span>
                      )}
                    </div>

                    {appt.reason && (
                      <p className="text-xs text-gray-700 bg-slate-50 p-2 rounded-lg border border-slate-200/60 inline-block">
                        <span className="font-medium text-gray-500 mr-1">Reason:</span>
                        {appt.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Queue Actions */}
                {isScheduled && (
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => setConfirmAction({ appt, status: 'completed' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                      title="Approve and mark consultation as completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Complete
                    </button>
                    <button
                      onClick={() => setConfirmAction({ appt, status: 'no_show' })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl border border-amber-200 transition-colors"
                    >
                      <UserX className="w-4 h-4 text-amber-600" />
                      No Show
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Status Update Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleStatusChange}
        title={
          confirmAction?.status === 'completed'
            ? 'Approve & Complete Consultation'
            : 'Mark Patient as No Show'
        }
        message={
          confirmAction?.status === 'completed'
            ? `Approve and mark consultation for ${confirmAction?.appt?.patientId?.name} at ${confirmAction?.appt?.startTime} as completed? The patient will be notified in real-time.`
            : `Mark ${confirmAction?.appt?.patientId?.name} as a no-show for the ${confirmAction?.appt?.startTime} slot?`
        }
        confirmLabel={
          confirmAction?.status === 'completed' ? 'Approve & Complete' : 'Confirm No Show'
        }
        variant={confirmAction?.status === 'completed' ? 'primary' : 'danger'}
      />
    </div>
  );
}
