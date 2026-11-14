import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Parse HH:mm string to dayjs object on a given date reference (UTC).
 */
const parseTime = (dateRef, timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return dayjs.utc(dateRef).hour(hours).minute(minutes).second(0).millisecond(0);
};

/**
 * Check if two intervals [aStart, aEnd) and [bStart, bEnd) overlap.
 */
const intervalsOverlap = (aStart, aEnd, bStart, bEnd) => {
  return aStart < bEnd && bStart < aEnd;
};

/**
 * Split a working interval into consultation slots.
 */
const splitInterval = (intervalStart, intervalEnd, durationMins, dateRef) => {
  const slots = [];
  let current = parseTime(dateRef, intervalStart);
  const end = parseTime(dateRef, intervalEnd);

  while (current.isBefore(end)) {
    const slotEnd = current.add(durationMins, 'minute');
    if (slotEnd.isAfter(end)) break;
    slots.push({
      start: current.format('HH:mm'),
      end: slotEnd.format('HH:mm'),
    });
    current = slotEnd;
  }
  return slots;
};

/**
 * Check if a slot falls within any break interval.
 */
const isInBreak = (slotStart, slotEnd, breakIntervals, dateRef) => {
  for (const brk of breakIntervals) {
    const bStart = parseTime(dateRef, brk.start);
    const bEnd = parseTime(dateRef, brk.end);
    const sStart = parseTime(dateRef, slotStart);
    const sEnd = parseTime(dateRef, slotEnd);
    if (intervalsOverlap(sStart, sEnd, bStart, bEnd)) return true;
  }
  return false;
};

/**
 * generateSlots - main utility function
 *
 * @param {Object} schedule         - DoctorSchedule document for the given dayOfWeek
 * @param {Object|null} exception   - ScheduleException document for the given date (or null)
 * @param {string[]} bookedSlots    - array of startTime strings that are already booked
 * @param {Date|string} date        - the date for which slots are generated
 * @param {number} consultationDuration - minutes per slot (from DoctorProfile)
 * @param {string} timezoneStr      - timezone identifier (e.g. 'Asia/Kolkata', 'UTC')
 * @returns {Array<{start: string, end: string, available: boolean}>}
 */
export const generateSlots = (
  schedule,
  exception,
  bookedSlots = [],
  date,
  consultationDuration = 30,
  timezoneStr = 'UTC'
) => {
  const dateStr = dayjs.utc(date).format('YYYY-MM-DD');
  const dateRef = dayjs.utc(date).startOf('day');

  const nowInTz = dayjs().tz(timezoneStr || 'UTC');
  const todayInTz = nowInTz.format('YYYY-MM-DD');
  const isToday = dateStr === todayInTz;
  const currentMinsInTz = nowInTz.hour() * 60 + nowInTz.minute();

  // Determine working intervals
  let workingIntervals = [];
  let breakIntervals = schedule ? (schedule.breakIntervals || []) : [];

  if (exception) {
    if (exception.type === 'leave' || exception.type === 'blocked') {
      return [];
    }
    if (exception.type === 'custom-hours') {
      workingIntervals = exception.customIntervals || [];
      breakIntervals = [];
    }
  } else {
    if (!schedule || !schedule.isAvailable) return [];
    workingIntervals = schedule.workingIntervals || [];
  }

  if (!workingIntervals.length) return [];

  const duration = consultationDuration || 30;
  const bookedSet = new Set(bookedSlots);
  const slots = [];

  for (const interval of workingIntervals) {
    const intervalSlots = splitInterval(interval.start, interval.end, duration, dateRef);
    for (const slot of intervalSlots) {
      // Skip if in break
      if (isInBreak(slot.start, slot.end, breakIntervals, dateRef)) continue;

      let available = true;

      // Mark unavailable if in past (for today)
      if (isToday) {
        const [h, m] = slot.start.split(':').map(Number);
        const slotMins = h * 60 + m;
        if (slotMins < currentMinsInTz) {
          available = false;
        }
      }

      // Mark unavailable if booked
      if (bookedSet.has(slot.start)) {
        available = false;
      }

      slots.push({ ...slot, available });
    }
  }

  return slots;
};
