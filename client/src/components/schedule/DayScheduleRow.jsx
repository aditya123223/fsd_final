import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DayScheduleRow({ dayConfig, onChange }) {
  const dayName = DAYS[dayConfig.dayOfWeek];

  const handleToggleAvailable = (e) => {
    onChange({
      ...dayConfig,
      isAvailable: e.target.checked,
    });
  };

  const handleWorkingIntervalChange = (idx, field, value) => {
    const updated = [...dayConfig.workingIntervals];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...dayConfig, workingIntervals: updated });
  };

  const addWorkingInterval = () => {
    onChange({
      ...dayConfig,
      workingIntervals: [...dayConfig.workingIntervals, { start: '09:00', end: '17:00' }],
    });
  };

  const removeWorkingInterval = (idx) => {
    const updated = dayConfig.workingIntervals.filter((_, i) => i !== idx);
    onChange({ ...dayConfig, workingIntervals: updated });
  };

  const handleBreakChange = (idx, field, value) => {
    const updated = [...dayConfig.breakIntervals];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...dayConfig, breakIntervals: updated });
  };

  const addBreakInterval = () => {
    onChange({
      ...dayConfig,
      breakIntervals: [...dayConfig.breakIntervals, { start: '13:00', end: '14:00', label: 'Lunch' }],
    });
  };

  const removeBreakInterval = (idx) => {
    const updated = dayConfig.breakIntervals.filter((_, i) => i !== idx);
    onChange({ ...dayConfig, breakIntervals: updated });
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${dayConfig.isAvailable ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={dayConfig.isAvailable}
              onChange={handleToggleAvailable}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
          </label>
          <span className="font-semibold text-gray-800 w-28">{dayName}</span>
        </div>

        {dayConfig.isAvailable && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addWorkingInterval}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Hours
            </button>
            <button
              type="button"
              onClick={addBreakInterval}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Break
            </button>
          </div>
        )}
      </div>

      {dayConfig.isAvailable && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          {/* Working hours */}
          <div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">
              Working Intervals
            </span>
            {dayConfig.workingIntervals.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No working intervals specified</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {dayConfig.workingIntervals.map((interval, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <input
                      type="time"
                      value={interval.start}
                      onChange={(e) => handleWorkingIntervalChange(idx, 'start', e.target.value)}
                      className="px-2 py-1 text-xs border rounded bg-white"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      type="time"
                      value={interval.end}
                      onChange={(e) => handleWorkingIntervalChange(idx, 'end', e.target.value)}
                      className="px-2 py-1 text-xs border rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeWorkingInterval(idx)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breaks */}
          {dayConfig.breakIntervals?.length > 0 && (
            <div>
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wider block mb-1.5">
                Break Periods
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {dayConfig.breakIntervals.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-amber-50/60 p-2 rounded-lg border border-amber-200">
                    <input
                      type="text"
                      placeholder="Label"
                      value={b.label || ''}
                      onChange={(e) => handleBreakChange(idx, 'label', e.target.value)}
                      className="w-16 px-1.5 py-1 text-xs border border-amber-300 rounded bg-white"
                    />
                    <input
                      type="time"
                      value={b.start}
                      onChange={(e) => handleBreakChange(idx, 'start', e.target.value)}
                      className="px-2 py-1 text-xs border border-amber-300 rounded bg-white"
                    />
                    <span className="text-xs text-amber-500">to</span>
                    <input
                      type="time"
                      value={b.end}
                      onChange={(e) => handleBreakChange(idx, 'end', e.target.value)}
                      className="px-2 py-1 text-xs border border-amber-300 rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeBreakInterval(idx)}
                      className="p-1 text-amber-600 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
