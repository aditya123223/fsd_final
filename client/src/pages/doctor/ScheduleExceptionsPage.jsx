import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addScheduleException } from '../../api/doctor.api.js';
import DatePicker from '../../components/appointments/DatePicker.jsx';
import toast from 'react-hot-toast';
import { CalendarX, Plus, AlertCircle, Trash2, ShieldCheck } from 'lucide-react';
import dayjs from 'dayjs';

export default function ScheduleExceptionsPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [type, setType] = useState('leave'); // 'leave', 'blocked', 'custom-hours'
  const [reason, setReason] = useState('');
  const [customIntervals, setCustomIntervals] = useState([{ start: '10:00', end: '14:00' }]);

  const exceptionMutation = useMutation({
    mutationFn: (data) => addScheduleException(data),
    onSuccess: () => {
      toast.success('Schedule exception / block added successfully');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['doctor', 'schedule'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add exception');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    exceptionMutation.mutate({
      date: selectedDate,
      type,
      reason: reason.trim() || undefined,
      customIntervals: type === 'custom-hours' ? customIntervals : undefined,
    });
  };

  const addInterval = () => {
    setCustomIntervals([...customIntervals, { start: '09:00', end: '12:00' }]);
  };

  const removeInterval = (index) => {
    setCustomIntervals(customIntervals.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedule Exceptions & Leaves</h1>
        <p className="text-xs text-gray-500 mt-1">
          Block dates for medical leave, vacations, or define custom hours on specific days
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Select Date</label>
              <DatePicker
                value={selectedDate}
                onChange={(d) => setSelectedDate(d)}
                minDate={dayjs().format('YYYY-MM-DD')}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Exception Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'leave', label: 'Full Leave' },
                    { id: 'blocked', label: 'Blocked' },
                    { id: 'custom-hours', label: 'Custom' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setType(t.id)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all ${
                        type === t.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Annual Medical Conference or Personal Leave..."
                  className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {type === 'custom-hours' && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">Custom Hours</span>
                    <button
                      type="button"
                      onClick={addInterval}
                      className="text-[11px] font-semibold text-teal-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Interval
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customIntervals.map((interval, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                        <input
                          type="time"
                          value={interval.start}
                          onChange={(e) => {
                            const updated = [...customIntervals];
                            updated[idx].start = e.target.value;
                            setCustomIntervals(updated);
                          }}
                          className="px-2 py-1 text-xs border rounded bg-white"
                        />
                        <span className="text-xs text-gray-400">to</span>
                        <input
                          type="time"
                          value={interval.end}
                          onChange={(e) => {
                            const updated = [...customIntervals];
                            updated[idx].end = e.target.value;
                            setCustomIntervals(updated);
                          }}
                          className="px-2 py-1 text-xs border rounded bg-white"
                        />
                        {customIntervals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeInterval(idx)}
                            className="p-1 text-gray-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={exceptionMutation.isPending}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-teal-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CalendarX className="w-4 h-4" />
                  {exceptionMutation.isPending ? 'Applying Block...' : 'Save Exception'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
