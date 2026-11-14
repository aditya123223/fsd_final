import api from './axios.js';

export const fetchPatientDashboard = () => api.get('/patient/dashboard');
export const fetchPatientAppointments = (params) => api.get('/patient/appointments', { params });
export const fetchPatientProfile = () => api.get('/patient/profile');
export const updatePatientProfile = (data) => api.put('/patient/profile', data);
