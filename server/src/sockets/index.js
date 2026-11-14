import { verifyAccessToken } from '../utils/jwt.utils.js';

/**
 * Emit when a new appointment is created
 */
export const emitAppointmentCreated = (io, doctorId, appointment) => {
  io.to(`user:${doctorId}`).emit('appointment:created', appointment);
  io.to(`doctor:${doctorId}:availability`).emit('slot:taken', {
    startTime: appointment.startTime,
    date: appointment.appointmentDate,
  });
};

/**
 * Emit when an appointment is cancelled
 */
export const emitAppointmentCancelled = (io, { doctorId, patientId, appointment }) => {
  io.to(`user:${doctorId}`).emit('appointment:cancelled', appointment);
  io.to(`user:${patientId}`).emit('appointment:cancelled', appointment);
  io.to(`doctor:${doctorId}:availability`).emit('slot:released', {
    startTime: appointment.startTime,
    date: appointment.appointmentDate,
  });
};

/**
 * Emit when appointment status is updated
 */
export const emitStatusUpdated = (io, { patientId, doctorId, appointment }) => {
  io.to(`user:${patientId}`).emit('appointment:statusUpdated', appointment);
  io.to(`user:${doctorId}`).emit('appointment:statusUpdated', appointment);
  io.to(`user:${doctorId}`).emit('doctor:queueUpdated', appointment);
  io.to(`doctor:${doctorId}`).emit('doctor:queueUpdated', appointment);
  io.to(`doctor:${doctorId}`).emit('appointment:statusUpdated', appointment);
};

/**
 * Emit when appointment is rescheduled
 */
export const emitAppointmentRescheduled = (io, { doctorId, patientId, appointment }) => {
  io.to(`user:${doctorId}`).emit('appointment:rescheduled', appointment);
  io.to(`user:${patientId}`).emit('appointment:rescheduled', appointment);
  io.to(`doctor:${doctorId}:availability`).emit('slot:updated', {
    appointment,
  });
};

/**
 * Emit a notification to a specific user
 */
export const emitNotification = (io, recipientId, notification) => {
  io.to(`user:${recipientId}`).emit('notification:new', notification);
};

/**
 * Initialize Socket.IO handlers
 */
export const initializeSockets = (io) => {
  // Authenticate every socket connection
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role } = socket.user;

    console.log(`Socket connected: ${socket.id} | user: ${userId} | role: ${role}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // If doctor, also join doctor room
    if (role === 'doctor') {
      socket.join(`doctor:${userId}`);
    }

    // Patient joins availability room for a specific doctor
    socket.on('availability:join', ({ doctorId }) => {
      if (!doctorId) return;
      const room = `doctor:${doctorId}:availability`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined availability room: ${room}`);
    });

    // Patient leaves availability room
    socket.on('availability:leave', ({ doctorId }) => {
      if (!doctorId) return;
      const room = `doctor:${doctorId}:availability`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left availability room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} | reason: ${reason}`);
    });
  });
};
