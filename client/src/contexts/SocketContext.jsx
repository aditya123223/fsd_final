import { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../socket/socket.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(() => getSocket());

  useEffect(() => {
    if (user) {
      const s = getSocket();
      setSocket(s);
    } else {
      setSocket(null);
    }
  }, [user]);

  return <SocketContext.Provider value={socket || getSocket()}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
