import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import User from '../src/models/User.model.js';
import DoctorProfile from '../src/models/DoctorProfile.model.js';
import PatientProfile from '../src/models/PatientProfile.model.js';
import RefreshSession from '../src/models/RefreshSession.model.js';

const app = createApp(null);

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/hospital_test_auth';

beforeAll(async () => {
  await mongoose.connect(TEST_DB_URI);
  await User.syncIndexes();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await User.deleteMany({});
  await DoctorProfile.deleteMany({});
  await PatientProfile.deleteMany({});
  await RefreshSession.deleteMany({});
});

describe('Authentication & Authorization Flow', () => {
  const patientData = {
    name: 'John Patient',
    email: 'john.patient@test.com',
    password: 'Password123!',
    phone: '1234567890',
  };

  const doctorData = {
    name: 'Dr. Jane Doctor',
    email: 'jane.doctor@test.com',
    password: 'Password123!',
    phone: '9876543210',
    specialization: 'Cardiology',
    qualifications: ['MBBS', 'MD'],
    experience: 8,
    consultationFee: 100,
    registrationNumber: 'MED-12345',
    consultationDuration: 30,
  };

  test('POST /api/auth/register/patient - successfully registers patient', async () => {
    const res = await request(app)
      .post('/api/auth/register/patient')
      .send(patientData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('patient');
    expect(res.body.data.user.email).toBe(patientData.email);

    const dbUser = await User.findOne({ email: patientData.email });
    expect(dbUser).toBeTruthy();
    expect(dbUser.role).toBe('patient');

    const dbProfile = await PatientProfile.findOne({ userId: dbUser._id });
    expect(dbProfile).toBeTruthy();
  });

  test('POST /api/auth/register/patient - fails with duplicate email', async () => {
    await request(app).post('/api/auth/register/patient').send(patientData);
    const res = await request(app).post('/api/auth/register/patient').send(patientData);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/register/doctor - successfully registers doctor with profile', async () => {
    const res = await request(app)
      .post('/api/auth/register/doctor')
      .send(doctorData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('doctor');

    const dbProfile = await DoctorProfile.findOne({ specialization: 'Cardiology' });
    expect(dbProfile).toBeTruthy();
    expect(dbProfile.registrationNumber).toBe('MED-12345');
  });

  test('POST /api/auth/login - authenticates and issues access & refresh tokens', async () => {
    await request(app).post('/api/auth/register/patient').send(patientData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: patientData.email, password: patientData.password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(patientData.email);

    // Refresh token should be in Set-Cookie header
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.includes('refreshToken='))).toBe(true);
  });

  test('POST /api/auth/login - rejects invalid credentials', async () => {
    await request(app).post('/api/auth/register/patient').send(patientData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: patientData.email, password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  test('Role-Based Access Control (RBAC)', async () => {
    // Register patient and doctor
    await request(app).post('/api/auth/register/patient').send(patientData);
    await request(app).post('/api/auth/register/doctor').send(doctorData);

    // Login patient and doctor
    const pLogin = await request(app).post('/api/auth/login').send({
      email: patientData.email,
      password: patientData.password,
    });
    const dLogin = await request(app).post('/api/auth/login').send({
      email: doctorData.email,
      password: doctorData.password,
    });

    const patientToken = pLogin.body.data.accessToken;
    const doctorToken = dLogin.body.data.accessToken;

    expect(patientToken).toBeDefined();
    expect(doctorToken).toBeDefined();

    // Patient trying to access doctor dashboard -> 403
    const forbiddenRes = await request(app)
      .get('/api/doctor/dashboard')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(forbiddenRes.status).toBe(403);

    // Doctor trying to access patient dashboard -> 403
    const forbiddenDocRes = await request(app)
      .get('/api/patient/dashboard')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(forbiddenDocRes.status).toBe(403);

    // Doctor accessing doctor dashboard -> 200
    const allowedDocRes = await request(app)
      .get('/api/doctor/dashboard')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(allowedDocRes.status).toBe(200);
  });
});
