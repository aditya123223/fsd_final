import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import doctorPublicRoutes, { doctorPrivateRouter } from './routes/doctor.routes.js';
import patientRoutes from './routes/patient.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import notificationRoutes from './routes/notification.routes.js';

import { errorHandler, notFound } from './middleware/error.middleware.js';
import { setIo as setNotificationIo } from './services/notification.service.js';
import { setIo as setAppointmentIo } from './services/appointment.service.js';

export const createApp = (io) => {
  const app = express();

  // Trust reverse proxy for deployment on Render, Heroku, Nginx, etc.
  app.set('trust proxy', 1);

  // Inject io into services
  if (io) {
    setNotificationIo(io);
    setAppointmentIo(io);
  }

  // Security headers
  app.use(helmet());

  // Allowed origins helper
  const rawOrigins = process.env.FRONTEND_URL || '*';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/$/, '');
        if (allowedOrigins.includes(cleanOrigin) || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Cookie parser
  app.use(cookieParser());

  // Body parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Global rate limiter (100 req / 15 min)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
  });
  app.use(globalLimiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/doctors', doctorPublicRoutes);
  app.use('/api/doctor', doctorPrivateRouter);
  app.use('/api/patient', patientRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/notifications', notificationRoutes);

  // 404 handler
  app.use(notFound);

  // Centralized error handler
  app.use(errorHandler);

  return app;
};
