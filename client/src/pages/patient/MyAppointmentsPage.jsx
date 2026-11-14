import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPatientAppointments } from '../../api/patient.api.js';
import { cancelAppointment, rescheduleAppointment } from '../../api/appointment.api.js';
import { fetchDoctorAvailability } from '../../api/doctor.api.js';
import { useSocket } from '../../hooks/useSocket.js';
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx';
import Modal from '../../components/common/Modal.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import DatePicker from '../../components/appointments/DatePicker.jsx';
import SlotPicker from '../../components/appointments/SlotPicker.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import toast from 'react-hot-toast';
import { Calendar, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

export default function MyAppointmentsPage() {
  const queryClient = useQueryClient();
  const socket = useSocket();

  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, completed, cancelled, all
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [reschedulingAppt, setReschedulingAppt] = useState(null);

  // Reschedule state
  const [newDate, setNewDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [newSlot, setNewSlot] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['patient', 'appointments', activeTab],
    queryFn: async () => {
      const statusParam = activeTab === 'all' ? undefined : activeTab;
      const res = await fetchPatientAppointments({ tab: activeTab, status: statusParam });
      return res.data;
    },
  });

  // Fetch slots for rescheduling doctor & date
  const doctorId = reschedulingAppt?.doctorId?._id || reschedulingAppt?.doctorId;
  const { data: rescheduleAvailability, isLoading: loadingRescheduleSlots } = useQuery({
    queryKey: ['doctor', doctorId, 'availability', newDate],
    queryFn: async () => {
      const res = await fetchDoctorAvailability(doctorId, newDate);
      return res.data?.data || res.data;
    },
    enabled: !!doctorId && !!newDate && !!reschedulingAppt,
  });

  // Socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'dashboard'] });
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

  const handleCancelConfirm = async () => {
    if (!cancellingAppt) return;
    try {
      await cancelAppointment(cancellingAppt._id);
      toast.success('Appointment cancelled successfully');
      setCancellingAppt(null);
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingAppt || !newSlot) {
      toast.error('Please select an available slot');
      return;
    }
    setRescheduleLoading(true);
    try {
      await rescheduleAppointment(reschedulingAppt._id, {
        newDate,
        newStartTime: newSlot.start,
      });
      toast.success('Appointment rescheduled successfully');
      setReschedulingAppt(null);
      setNewSlot(null);
      queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const appointments = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : (data?.appointments || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review, reschedule, or cancel your consultations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6">
        {[
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
          { key: 'cancelled', label: 'Cancelled' },
          { key: 'all', label: 'All Appointments' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-semibold transition-colors relative ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LoadingSkeleton variant="card" count={4} />
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No ${activeTab} appointments`}
          description="Your scheduled appointments will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <AppointmentCard
              key={appt._id}
              appointment={appt}
              role="patient"
              onCancel={(a) => setCancellingAppt(a)}
              onReschedule={(a) => {
                setReschedulingAppt(a);
                setNewDate(dayjs(a.appointmentDate).format('YYYY-MM-DD'));
                setNewSlot(null);
              }}
            />
          ))}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancellingAppt}
        onClose={() => setCancellingAppt(null)}
        onConfirm={handleCancelConfirm}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel your consultation with ${cancellingAppt?.doctorId?.name} on ${dayjs(cancellingAppt?.appointmentDate).format('MMMM D, YYYY')} at ${cancellingAppt?.startTime}? The reserved slot will be released.`}
        confirmLabel="Yes, Cancel Booking"
        variant="danger"
      />

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!reschedulingAppt}
        onClose={() => setReschedulingAppt(null)}
        title="Reschedule Appointment"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Rescheduling with <span className="font-semibold text-gray-800">{reschedulingAppt?.doctorId?.name}</span>. Choose a new date and available slot.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Select Date</label>
              <DatePicker
                value={newDate}
                onChange={(d) => {
                  setNewDate(d);
                  setNewSlot(null);
                }}
                minDate={dayjs().format('YYYY-MM-DD')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Available Slots ({dayjs(newDate).format('MMM D')})
              </label>
              <SlotPicker
                slots={rescheduleAvailability?.slots || []}
                selectedSlot={newSlot}
                onSelectSlot={(s) => setNewSlot(s)}
                loading={loadingRescheduleSlots}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setReschedulingAppt(null)}
              className="px-4 py-2 border border-gray-200 text-xs font-semibold text-gray-600 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRescheduleSubmit}
              disabled={!newSlot || rescheduleLoading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {rescheduleLoading ? 'Updating Slot...' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
