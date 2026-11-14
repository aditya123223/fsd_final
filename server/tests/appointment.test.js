import request from 'supertest';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { createApp } from '../src/app.js';
import User from '../src/models/User.model.js';
import DoctorProfile from '../src/models/DoctorProfile.model.js';
import PatientProfile from '../src/models/PatientProfile.model.js';
import DoctorSchedule from '../src/models/DoctorSchedule.model.js';
import Appointment from '../src/models/Appointment.model.js';
import SlotReservation from '../src/models/SlotReservation.model.js';

dayjs.extend(utc);

const app = createApp(null);
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/hospital_test_appt';

let patientToken, doctorToken;
let patientUser, doctorUser;
let futureDateStr;

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await SlotReservation.syncIndexes();
  await Appointment.syncIndexes();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await DoctorProfile.deleteMany({});
  await PatientProfile.deleteMany({});
  await DoctorSchedule.deleteMany({});
  await Appointment.deleteMany({});
  await SlotReservation.deleteMany({});

  // 1. Create Patient
  const pReg = await request(app).post('/api/auth/register/patient').send({
    name: 'Test Patient',
    email: 'patient@test.com',
    password: 'Password123!',
    phone: '1112223333',
  });
  const pLogin = await request(app).post('/api/auth/login').send({
    email: 'patient@test.com',
    password: 'Password123!',
  });
  patientToken = pLogin.body.data.accessToken;
  patientUser = pLogin.body.data.user;

  // 2. Create Doctor
  const dReg = await request(app).post('/api/auth/register/doctor').send({
    name: 'Dr. Test Doctor',
    email: 'doctor@test.com',
    password: 'Password123!',
    phone: '4445556666',
    specialization: 'Neurology',
    qualifications: ['MBBS', 'MD'],
    experience: 10,
    consultationFee: 150,
    registrationNumber: 'MED-99999',
    consultationDuration: 30,
  });
  const dLogin = await request(app).post('/api/auth/login').send({
    email: 'doctor@test.com',
    password: 'Password123!',
  });
  doctorToken = dLogin.body.data.accessToken;
  doctorUser = dLogin.body.data.user;

  // 3. Set Doctor Schedule for all days 0-6
  const scheduleDays = [];
  for (let d = 0; d < 7; d++) {
    scheduleDays.push({
      dayOfWeek: d,
      isAvailable: true,
      workingIntervals: [{ start: '09:00', end: '17:00' }],
      breakIntervals: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
    });
  }

  await request(app)
    .put('/api/doctor/schedule')
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({ schedule: scheduleDays });

  // Use a date 5 days in the future
  futureDateStr = dayjs().add(5, 'day').format('YYYY-MM-DD');
});

describe('Appointment Booking & Lifecycle', () => {
  test('POST /api/appointments - successfully books an available slot', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: '10:00',
        reason: 'Severe headache and migraines',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const appt = res.body.data.appointment || res.body.data;
    expect(appt.status).toBe('scheduled');
    expect(appt.startTime).toBe('10:00');
    expect(appt.endTime).toBe('10:30');
    expect(appt.bookingReference).toMatch(/^APT-/);

    // Verify reservation in database
    const reservation = await SlotReservation.findOne({
      doctorId: doctorUser._id,
      startTime: '10:00',
    });
    expect(reservation).toBeTruthy();
  });

  test('POST /api/appointments - prevents double booking the same slot', async () => {
    // Book first time
    const res1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: '11:00',
        reason: 'First booking',
      });
    expect(res1.status).toBe(201);

    // Try booking the exact same slot again
    const res2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: '11:00',
        reason: 'Attempted duplicate booking',
      });

    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
  });

  test('POST /api/appointments - prevents booking past dates', async () => {
    const pastDate = dayjs().subtract(2, 'day').format('YYYY-MM-DD');
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUser._id,
        date: pastDate,
        startTime: '10:00',
        reason: 'Past appointment',
      });

    expect(res.status).toBe(400);
  });

  test('PATCH /api/appointments/:id/cancel - allows patient to cancel own appointment', async () => {
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: '14:00',
        reason: 'Follow-up',
      });

    const appointmentId = (bookRes.body.data.appointment || bookRes.body.data)._id;

    const cancelRes = await request(app)
      .patch(`/api/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(cancelRes.status).toBe(200);
    const cancelledAppt = cancelRes.body.data.appointment || cancelRes.body.data;
    expect(cancelledAppt.status).toBe('cancelled');

    // Slot reservation must be released
    const reservation = await SlotReservation.findOne({
      doctorId: doctorUser._id,
      startTime: '14:00',
    });
    expect(reservation).toBeNull();
  });

  test('PATCH /api/appointments/:id/reschedule - safely reschedules to a new slot', async () => {
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: '15:00',
        reason: 'Original slot',
      });

    const appointmentId = (bookRes.body.data.appointment || bookRes.body.data)._id;

    const rescheduleRes = await request(app)
      .patch(`/api/appointments/${appointmentId}/reschedule`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        newDate: futureDateStr,
        newStartTime: '15:30',
      });

    expect(rescheduleRes.status).toBe(200);
    const rescheduledAppt = rescheduleRes.body.data.appointment || rescheduleRes.body.data;
    expect(rescheduledAppt.startTime).toBe('15:30');

    // Old slot is released
    const oldSlot = await SlotReservation.findOne({
      doctorId: doctorUser._id,
      startTime: '15:00',
    });
    expect(oldSlot).toBeNull();

    // New slot is reserved
    const newSlot = await SlotReservation.findOne({
      doctorId: doctorUser._id,
      startTime: '15:30',
    });
    expect(newSlot).toBeTruthy();
  });

  test('PATCH /api/appointments/:id/status - doctor marks completed or no-show', async () => {
    const bookRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: '16:00',
        reason: 'Consultation',
      });

    const appointmentId = (bookRes.body.data.appointment || bookRes.body.data)._id;

    // Patient cannot update status -> 403
    const patientAttempt = await request(app)
      .patch(`/api/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ status: 'completed' });

    expect(patientAttempt.status).toBe(403);

    // Doctor can mark completed
    const doctorComplete = await request(app)
      .patch(`/api/appointments/${appointmentId}/status`)
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ status: 'completed' });

    expect(doctorComplete.status).toBe(200);
    const completedAppt = doctorComplete.body.data.appointment || doctorComplete.body.data;
    expect(completedAppt.status).toBe('completed');
  });
});
