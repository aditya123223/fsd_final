import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

export default function DatePicker({ value, onChange, minDate, disabledDates = [] }) {
  const today = dayjs();
  const min = minDate && dayjs(minDate).isValid() ? dayjs(minDate) : today;
  const current = value && dayjs(value).isValid() ? dayjs(value) : today;
  const [viewMonth, setViewMonth] = useState(current.startOf('month'));

  useEffect(() => {
    if (value && dayjs(value).isValid()) {
      setViewMonth(dayjs(value).startOf('month'));
    }
  }, [value]);

  const daysInMonth = viewMonth.daysInMonth();
  const firstDayOfMonth = viewMonth.day(); // 0=Sun
  const monthLabel = viewMonth.format('MMMM YYYY');

  const prevMonth = () => setViewMonth(viewMonth.subtract(1, 'month'));
  const nextMonth = () => setViewMonth(viewMonth.add(1, 'month'));

  const isDisabled = (day) => {
    const date = viewMonth.date(day);
    if (date.isBefore(min.startOf('day'))) return true;
    return disabledDates.some((d) => dayjs(d).isSame(date, 'day'));
  };

  const isSelected = (day) => {
    if (!value || !dayjs(value).isValid()) return false;
    return dayjs(value).isSame(viewMonth.date(day), 'day');
  };

  const isToday = (day) => {
    return today.isSame(viewMonth.date(day), 'day');
  };

  const handleSelect = (day) => {
    if (isDisabled(day)) return;
    const selected = viewMonth.date(day);
    onChange(selected.format('YYYY-MM-DD'));
  };

  const blanks = Array.from({ length: firstDayOfMonth });
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 max-w-sm shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <span className="font-bold text-gray-900 text-sm">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-1 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((day) => {
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          const todayMark = isToday(day);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleSelect(day)}
              disabled={disabled}
              className={`
                aspect-square w-full flex items-center justify-center rounded-xl text-xs font-semibold
                transition-all duration-150
                ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer'}
                ${
                  selected
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : todayMark
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                    : disabled
                    ? ''
                    : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
