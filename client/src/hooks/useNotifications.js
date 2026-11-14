import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext.jsx';
import { useEffect } from 'react';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notification.api.js';

export function useNotifications() {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetchNotifications({ limit: 20 }),
    select: (res) => res.data.data,
  });

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  }, [socket, queryClient]);

  const unreadCount = data?.unreadCount ?? data?.notifications?.filter(n => !n.isRead).length ?? 0;

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount,
    isLoading,
    markRead: markRead.mutate,
    markAll: markAll.mutate,
  };
}
