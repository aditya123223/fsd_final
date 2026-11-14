import React from 'react';
import DayScheduleRow from './DayScheduleRow.jsx';

export default function ScheduleEditor({ schedule, onChange }) {
  const handleDayChange = (dayIndex, updatedDay) => {
    const updated = [...schedule];
    updated[dayIndex] = updatedDay;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {schedule.map((dayConfig, idx) => (
        <DayScheduleRow
          key={dayConfig.dayOfWeek ?? idx}
          dayConfig={dayConfig}
          onChange={(newVal) => handleDayChange(idx, newVal)}
        />
      ))}
    </div>
  );
}
