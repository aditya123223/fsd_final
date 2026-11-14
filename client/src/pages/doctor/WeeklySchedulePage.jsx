import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDoctorSchedule, updateDoctorSchedule } from '../../api/doctor.api.js';
import ScheduleEditor from '../../components/schedule/ScheduleEditor.jsx';
import Modal from '../../components/common/Modal.jsx';
import LoadingSkeleton from '../../components/common/LoadingSkeleton.jsx';
import toast from 'react-hot-toast';
import { Save, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const DEFAULT_SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  dayOfWeek: day,
  isAvailable: day !== 0, // Sunday unavailable by default
  workingIntervals: day !== 0 ? [{ start: '09:00', end: '17:00' }] : [],
  breakIntervals: day !== 0 ? [{ start: '13:00', end: '14:00', label: 'Lunch' }] : [],
}));

export default function WeeklySchedulePage() {
  const queryClient = useQueryClient();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictAppointments, setConflictAppointments] = useState([]);
  const [pendingSchedule, setPendingSchedule] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['doctor', 'schedule'],
    queryFn: async () => {
      const res = await fetchDoctorSchedule();
      return res.data.data;
    },
  });

  useEffect(() => {
    if (data?.schedule && data.schedule.length > 0) {
      // Merge with 7 days
      const merged = DEFAULT_SCHEDULE.map((defDay) => {
        const found = data.schedule.find((s) => s.dayOfWeek === defDay.dayOfWeek);
        return found
          ? {
              dayOfWeek: found.dayOfWeek,
              isAvailable: found.isAvailable,
              workingIntervals: found.workingIntervals || [],
              breakIntervals: found.breakIntervals || [],
            }
          : defDay;
      });
      setSchedule(merged);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateDoctorSchedule(payload),
    onSuccess: (res) => {
      toast.success('Weekly availability schedule saved successfully');
      queryClient.invalidateQueries({ queryKey: ['doctor', 'schedule'] });
      setConflictModalOpen(false);
      setPendingSchedule(null);
    },
    onError: (err) => {
      // If conflicts returned from server
      if (err.response?.status === 409 && err.response?.data?.data?.conflicts) {
        setConflictAppointments(err.response.data.data.conflicts);
        setConflictModalOpen(true);
      } else {
        toast.error(err.response?.data?.message || 'Failed to update schedule');
      }
    },
  });

  const handleSave = () => {
    setPendingSchedule(schedule);
    updateMutation.mutate({ schedule });
  };

  const handleForceSave = () => {
    // Force save even with conflicts
    updateMutation.mutate({ schedule: pendingSchedule, force: true });
  };

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={2} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure recurring availability intervals and daily break periods
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all self-start sm:self-center disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving Schedule...' : 'Save Weekly Schedule'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <ScheduleEditor schedule={schedule} onChange={(newSched) => setSchedule(newSched)} />
      </div>

      {/* Schedule Conflict Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title="Schedule Conflicts Detected"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Existing Appointments Conflicted</p>
              <p className="mt-0.5">
                The updated schedule modifies or removes hours where patients already have booked consultations.
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl p-2">
            {conflictAppointments.map((c) => (
              <div key={c._id} className="py-2 px-1 text-xs">
                <span className="font-semibold text-gray-900">{c.patientId?.name || 'Patient'}</span>
                <span className="text-gray-500 block">
                  {c.startTime} - {c.endTime} (Ref: {c.bookingReference})
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConflictModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel & Review
            </button>
            <button
              onClick={handleForceSave}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              Update Schedule Regardless
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
