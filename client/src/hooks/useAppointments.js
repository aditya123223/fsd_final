import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext.jsx';
import { useEffect } from 'react';
import { fetchPatientAppointments } from '../api/patient.api.js';
import { cancelAppointment, rescheduleAppointment, updateAppointmentStatus } from '../api/appointment.api.js';

export function useAppointments(params = {}) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['appointments', 'patient', params],
    queryFn: () => fetchPatientAppointments(params),
    select: (res) => res.data.data,
  });

  useEffect(() => {
    if (!socket) return;
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    };
    socket.on('appointment:cancelled', invalidate);
    socket.on('appointment:statusUpdated', invalidate);
    socket.on('appointment:created', invalidate);
    return () => {
      socket.off('appointment:cancelled', invalidate);
      socket.off('appointment:statusUpdated', invalidate);
      socket.off('appointment:created', invalidate);
    };
  }, [socket, queryClient]);

  const cancel = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const reschedule = useMutation({
    mutationFn: ({ id, data }) => rescheduleAppointment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => updateAppointmentStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  return {
    ...query,
    cancel: cancel.mutate,
    reschedule: reschedule.mutate,
    updateStatus: updateStatus.mutate,
    isCancelling: cancel.isPending,
    isRescheduling: reschedule.isPending,
  };
}
