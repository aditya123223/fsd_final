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
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/hospital_test_concurrency';

let patient1Token, patient2Token;
let doctorUser;
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

  // 1. Create Patient 1
  await request(app).post('/api/auth/register/patient').send({
    name: 'Patient One',
    email: 'patient1@test.com',
    password: 'Password123!',
    phone: '1111111111',
  });
  const p1Login = await request(app).post('/api/auth/login').send({
    email: 'patient1@test.com',
    password: 'Password123!',
  });
  patient1Token = p1Login.body.data.accessToken;

  // 2. Create Patient 2
  await request(app).post('/api/auth/register/patient').send({
    name: 'Patient Two',
    email: 'patient2@test.com',
    password: 'Password123!',
    phone: '2222222222',
  });
  const p2Login = await request(app).post('/api/auth/login').send({
    email: 'patient2@test.com',
    password: 'Password123!',
  });
  patient2Token = p2Login.body.data.accessToken;

  // 3. Create Doctor
  await request(app).post('/api/auth/register/doctor').send({
    name: 'Dr. Concurrency Doctor',
    email: 'doctor.conc@test.com',
    password: 'Password123!',
    phone: '9999999999',
    specialization: 'Orthopedics',
    qualifications: ['MBBS', 'MS'],
    experience: 12,
    consultationFee: 200,
    registrationNumber: 'MED-77777',
    consultationDuration: 30,
  });
  const dLogin = await request(app).post('/api/auth/login').send({
    email: 'doctor.conc@test.com',
    password: 'Password123!',
  });
  const doctorToken = dLogin.body.data.accessToken;
  doctorUser = dLogin.body.data.user;

  // Set Doctor Schedule for all days
  const scheduleDays = [];
  for (let d = 0; d < 7; d++) {
    scheduleDays.push({
      dayOfWeek: d,
      isAvailable: true,
      workingIntervals: [{ start: '09:00', end: '17:00' }],
      breakIntervals: [],
    });
  }

  await request(app)
    .put('/api/doctor/schedule')
    .set('Authorization', `Bearer ${doctorToken}`)
    .send({ schedule: scheduleDays });

  futureDateStr = dayjs().add(7, 'day').format('YYYY-MM-DD');
});

describe('Concurrent Slot Reservation Safety', () => {
  test('Two patients simultaneously booking the exact same slot: exactly 1 succeeds (201), 1 fails (409)', async () => {
    const slotToRace = '10:00';

    const req1 = request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patient1Token}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: slotToRace,
        reason: 'Patient 1 concurrent booking',
      });

    const req2 = request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patient2Token}`)
      .send({
        doctorId: doctorUser._id,
        date: futureDateStr,
        startTime: slotToRace,
        reason: 'Patient 2 concurrent booking',
      });

    // Execute both concurrently
    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status].sort();

    // Exactly one must be 201 Created and one must be 409 Conflict
    expect(statuses).toEqual([201, 409]);

    // Check database to ensure exactly ONE appointment and ONE reservation was created
    const appointmentsInDb = await Appointment.find({
      doctorId: doctorUser._id,
      startTime: slotToRace,
      status: 'scheduled',
    });
    expect(appointmentsInDb.length).toBe(1);

    const reservationsInDb = await SlotReservation.find({
      doctorId: doctorUser._id,
      startTime: slotToRace,
    });
    expect(reservationsInDb.length).toBe(1);
  });
});
