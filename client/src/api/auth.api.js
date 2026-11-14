import api, { setAccessToken } from './axios.js';

export const registerPatient = (data) => api.post('/auth/register/patient', data);
export const registerDoctor = (data) => api.post('/auth/register/doctor', data);
export const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  if (res.data.data?.accessToken) setAccessToken(res.data.data.accessToken);
  return res.data;
};
export const logout = () => api.post('/auth/logout');
export const getMe = () => api.get('/auth/me');
export const refreshTokens = () => api.post('/auth/refresh');
