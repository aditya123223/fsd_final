// appointment.socket.js
// Additional appointment-specific socket event handlers if needed.
// Currently all appointment socket logic is centralized in sockets/index.js

export const registerAppointmentSocketHandlers = (io, socket) => {
  // Placeholder for future appointment-specific socket events
  socket.on('appointment:join', ({ appointmentId }) => {
    if (appointmentId) {
      socket.join(`appointment:${appointmentId}`);
    }
  });

  socket.on('appointment:leave', ({ appointmentId }) => {
    if (appointmentId) {
      socket.leave(`appointment:${appointmentId}`);
    }
  });
};
