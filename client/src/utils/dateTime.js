import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export const formatDate = (date) => {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('MMM D, YYYY') : String(date);
};

export const formatTime = (time) => {
  if (!time) return '';
  // If in HH:mm string format like "09:00", "14:30"
  if (typeof time === 'string' && /^\d{1,2}:\d{2}$/.test(time.trim())) {
    const [h, m] = time.trim().split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  }
  const d = dayjs(time);
  return d.isValid() ? d.format('h:mm A') : String(time);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('MMM D, YYYY h:mm A') : String(date);
};

export const formatRelative = (date) => {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.fromNow() : '';
};

export const formatDayOfWeek = (date) => {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('dddd') : '';
};

export const isToday = (date) => {
  if (!date) return false;
  const d = dayjs(date);
  return d.isValid() ? d.isSame(dayjs(), 'day') : false;
};

export const isFuture = (date) => {
  if (!date) return false;
  const d = dayjs(date);
  return d.isValid() ? d.isAfter(dayjs()) : false;
};

export const isPast = (date) => {
  if (!date) return false;
  const d = dayjs(date);
  return d.isValid() ? d.isBefore(dayjs()) : false;
};

export const startOfDay = (date) => dayjs(date).startOf('day');
export const endOfDay = (date) => dayjs(date).endOf('day');
export const addDays = (date, n) => dayjs(date).add(n, 'day');
export const daysInMonth = (year, month) => dayjs(`${year}-${month}-01`).daysInMonth();
export const startOfMonth = (year, month) => dayjs(`${year}-${month}-01`).startOf('month');
export const toISODate = (date) => {
  if (!date) return '';
  const d = dayjs(date);
  return d.isValid() ? d.format('YYYY-MM-DD') : '';
};

export default dayjs;
