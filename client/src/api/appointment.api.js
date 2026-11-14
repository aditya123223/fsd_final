import api from './axios.js';

export const bookAppointment = (data) => api.post('/appointments', data);
export const getAppointmentById = (id) => api.get(`/appointments/${id}`);
export const cancelAppointment = (id) => api.patch(`/appointments/${id}/cancel`);
export const rescheduleAppointment = (id, data) => api.patch(`/appointments/${id}/reschedule`, data);
export const updateAppointmentStatus = (id, status) => api.patch(`/appointments/${id}/status`, { status });
