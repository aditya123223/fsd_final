import React from 'react';
import { formatTime } from '../../utils/dateTime.js';

export default function SlotPicker({
  slots = [],
  selected,
  selectedSlot,
  onSelect,
  onSelectSlot,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <p className="text-sm font-semibold text-gray-600">No consultation slots available</p>
        <p className="text-xs text-gray-400 mt-1">Please select another date on the calendar</p>
      </div>
    );
  }

  const currentSelectedStart =
    selectedSlot?.start ||
    (typeof selectedSlot === 'string' ? selectedSlot : null) ||
    selected?.start ||
    (typeof selected === 'string' ? selected : null);

  const handleSlotClick = (slot) => {
    if (onSelectSlot) onSelectSlot(slot);
    if (onSelect) onSelect(slot.start, slot);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {slots.map((slot, index) => {
        const isSelected = currentSelectedStart === slot.start;
        const isAvailable = slot.available !== false;

        return (
          <button
            key={slot.start || index}
            type="button"
            disabled={!isAvailable}
            onClick={() => isAvailable && handleSlotClick(slot)}
            className={`
              py-2.5 px-3 rounded-xl text-xs font-semibold transition-all duration-150 border text-center
              ${
                !isAvailable
                  ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed line-through'
                  : isSelected
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:bg-blue-50/50'
              }
            `}
          >
            {formatTime(slot.start)}
          </button>
        );
      })}
    </div>
  );
}
