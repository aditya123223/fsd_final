import api from './axios.js';

export const fetchDoctors = (params) => api.get('/doctors', { params });
export const fetchDoctorById = (id) => api.get(`/doctors/${id}`);
export const fetchDoctorAvailability = (id, date) => api.get(`/doctors/${id}/availability`, { params: { date } });
export const fetchDoctorDashboard = () => api.get('/doctor/dashboard');
export const fetchTodayAppointments = () => api.get('/doctor/appointments/today');
export const fetchDoctorAppointments = (params) => api.get('/doctor/appointments', { params });
export const fetchDoctorSchedule = () => api.get('/doctor/schedule');
export const updateDoctorSchedule = (data) => api.put('/doctor/schedule', data);
export const addScheduleException = (data) => api.post('/doctor/schedule/exceptions', data);
export const fetchScheduleExceptions = () => api.get('/doctor/schedule/exceptions');
export const deleteScheduleException = (id) => api.delete(`/doctor/schedule/exceptions/${id}`);
export const fetchDoctorProfile = () => api.get('/doctor/profile');
export const updateDoctorProfile = (data) => api.put('/doctor/profile', data);
