import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe, login as apiLogin, logout as apiLogout, refreshTokens } from '../api/auth.api.js';
import { setAccessToken, clearAccessToken } from '../api/axios.js';
import { initSocket, disconnectSocket } from '../socket/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const initialize = useCallback(async () => {
    try {
      const { data } = await refreshTokens();
      const token = data.data?.accessToken || data.accessToken;
      if (token) setAccessToken(token);

      const meRes = await getMe();
      const userData = meRes.data?.data?.user || meRes.data?.user || meRes.data?.data;
      setUser(userData);

      if (token) initSocket(token);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    const userData = res.data?.data?.user || res.data?.user || res.user || res;
    const token = res.data?.data?.accessToken || res.data?.accessToken || res.accessToken;

    if (token) {
      setAccessToken(token);
      initSocket(token);
    }
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {}
    clearAccessToken();
    disconnectSocket();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
