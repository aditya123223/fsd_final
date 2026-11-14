import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { initializeSockets } from './sockets/index.js';
import { setIo as setNotificationIo } from './services/notification.service.js';
import { setIo as setAppointmentIo } from './services/appointment.service.js';

const PORT = process.env.PORT || 5000;
const rawOrigins = process.env.FRONTEND_URL || '*';
const allowedOrigins = rawOrigins
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const start = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create Express app
    const app = createApp(null);

    // Create HTTP server with express app
    const httpServer = createServer(app);

    // Initialize Socket.IO on the HTTP server
    // Engine.io intercepts /socket.io requests and delegates rest to express
    const io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          const cleanOrigin = origin.replace(/\/$/, '');
          if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
            return callback(null, true);
          }
          return callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Inject io into services
    setNotificationIo(io);
    setAppointmentIo(io);

    // Initialize socket handlers
    initializeSockets(io);

    // Start listening on all network interfaces for Docker/Render
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Socket.IO enabled`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Hospital Appointment System ready`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
