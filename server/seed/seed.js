import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { v4 as uuidv4 } from 'uuid';

import User from '../src/models/User.model.js';
import DoctorProfile from '../src/models/DoctorProfile.model.js';
import PatientProfile from '../src/models/PatientProfile.model.js';
import DoctorSchedule from '../src/models/DoctorSchedule.model.js';
import Appointment from '../src/models/Appointment.model.js';
import Notification from '../src/models/Notification.model.js';
import SlotReservation from '../src/models/SlotReservation.model.js';

dayjs.extend(utc);

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'Password123!';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_db';

const hash = (pw) => bcrypt.hash(pw, SALT_ROUNDS);
const genRef = (date) => {
  const datePart = dayjs(date).utc().format('YYYYMMDD');
  const randPart = uuidv4().replace(/-/g, '').slice(0, 5).toUpperCase();
  return `APT-${datePart}-${randPart}`;
};

const workingDay = (start = '09:00', end = '17:00') => ({
  isAvailable: true,
  workingIntervals: [{ start, end }],
  breakIntervals: [{ start: '13:00', end: '14:00', label: 'Lunch' }],
});

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    DoctorProfile.deleteMany({}),
    PatientProfile.deleteMany({}),
    DoctorSchedule.deleteMany({}),
    Appointment.deleteMany({}),
    Notification.deleteMany({}),
    SlotReservation.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  // ---- CREATE DOCTORS ----
  const doctorData = [
    {
      name: 'Dr. Aisha Patel',
      email: 'aisha.patel@hospital.com',
      specialization: 'Cardiology',
      qualifications: ['MBBS', 'MD (Cardiology)', 'FESC'],
      experience: 12,
      consultationFee: 800,
      registrationNumber: 'MCI-12345',
      consultationDuration: 30,
      bio: 'Expert cardiologist with 12 years of experience.',
    },
    {
      name: 'Dr. Rahul Sharma',
      email: 'rahul.sharma@hospital.com',
      specialization: 'Orthopedics',
      qualifications: ['MBBS', 'MS (Orthopedics)'],
      experience: 8,
      consultationFee: 600,
      registrationNumber: 'MCI-23456',
      consultationDuration: 20,
      bio: 'Specialist in joint replacement and sports medicine.',
    },
    {
      name: 'Dr. Priya Nair',
      email: 'priya.nair@hospital.com',
      specialization: 'Dermatology',
      qualifications: ['MBBS', 'MD (Dermatology)'],
      experience: 6,
      consultationFee: 500,
      registrationNumber: 'MCI-34567',
      consultationDuration: 15,
      bio: 'Dermatologist specializing in skin care and cosmetic procedures.',
    },
  ];

  const doctors = [];
  const doctorProfiles = [];
  const credentials = [];

  for (const d of doctorData) {
    const passwordHash = await hash(DEFAULT_PASSWORD);
    const user = await User.create({
      name: d.name,
      email: d.email,
      passwordHash,
      role: 'doctor',
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    const profile = await DoctorProfile.create({
      userId: user._id,
      specialization: d.specialization,
      qualifications: d.qualifications,
      experience: d.experience,
      consultationFee: d.consultationFee,
      registrationNumber: d.registrationNumber,
      consultationDuration: d.consultationDuration,
      bio: d.bio,
      timezone: 'Asia/Kolkata',
    });
    doctors.push(user);
    doctorProfiles.push(profile);
    credentials.push({ role: 'doctor', name: d.name, email: d.email, password: DEFAULT_PASSWORD });

    // Create 7-day schedule (Mon-Fri available, Sat half-day, Sun off)
    const schedules = [
      { dayOfWeek: 0, isAvailable: false, workingIntervals: [], breakIntervals: [] }, // Sunday
      { dayOfWeek: 1, ...workingDay() },
      { dayOfWeek: 2, ...workingDay() },
      { dayOfWeek: 3, ...workingDay() },
      { dayOfWeek: 4, ...workingDay() },
      { dayOfWeek: 5, ...workingDay() },
      { dayOfWeek: 6, ...workingDay('09:00', '13:00') }, // Saturday half-day
    ];
    schedules[6].breakIntervals = []; // No lunch on Saturday

    for (const s of schedules) {
      await DoctorSchedule.create({ doctorId: user._id, ...s });
    }
  }

  // ---- CREATE PATIENTS ----
  const patientData = [
    { name: 'Amit Kumar', email: 'amit.kumar@gmail.com', gender: 'male', bloodGroup: 'A+' },
    { name: 'Sneha Gupta', email: 'sneha.gupta@gmail.com', gender: 'female', bloodGroup: 'B+' },
    { name: 'Rohit Verma', email: 'rohit.verma@gmail.com', gender: 'male', bloodGroup: 'O+' },
    { name: 'Meera Joshi', email: 'meera.joshi@gmail.com', gender: 'female', bloodGroup: 'AB+' },
    { name: 'Vikram Singh', email: 'vikram.singh@gmail.com', gender: 'male', bloodGroup: 'O-' },
  ];

  const patients = [];

  for (const p of patientData) {
    const passwordHash = await hash(DEFAULT_PASSWORD);
    const user = await User.create({
      name: p.name,
      email: p.email,
      passwordHash,
      role: 'patient',
      phone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    await PatientProfile.create({
      userId: user._id,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      dateOfBirth: dayjs().subtract(Math.floor(25 + Math.random() * 20), 'year').toDate(),
    });
    patients.push(user);
    credentials.push({ role: 'patient', name: p.name, email: p.email, password: DEFAULT_PASSWORD });
  }

  // ---- CREATE APPOINTMENTS ----
  const appointmentConfigs = [
    { doctorIdx: 0, patientIdx: 0, daysFromNow: 1, startTime: '09:00', status: 'scheduled', reason: 'Chest pain evaluation' },
    { doctorIdx: 0, patientIdx: 1, daysFromNow: 2, startTime: '09:30', status: 'scheduled', reason: 'Follow-up after ECG' },
    { doctorIdx: 0, patientIdx: 2, daysFromNow: -5, startTime: '10:00', status: 'completed', reason: 'Annual cardiac checkup' },
    { doctorIdx: 1, patientIdx: 0, daysFromNow: 3, startTime: '09:00', status: 'scheduled', reason: 'Knee pain' },
    { doctorIdx: 1, patientIdx: 3, daysFromNow: -3, startTime: '11:00', status: 'completed', reason: 'Post-surgery follow-up' },
    { doctorIdx: 1, patientIdx: 4, daysFromNow: -1, startTime: '14:00', status: 'cancelled', reason: 'Back pain consultation' },
    { doctorIdx: 2, patientIdx: 1, daysFromNow: 4, startTime: '09:15', status: 'scheduled', reason: 'Skin rash evaluation' },
    { doctorIdx: 2, patientIdx: 2, daysFromNow: -7, startTime: '10:30', status: 'completed', reason: 'Acne treatment' },
    { doctorIdx: 2, patientIdx: 4, daysFromNow: -2, startTime: '11:00', status: 'no_show', reason: 'Eczema follow-up' },
    { doctorIdx: 0, patientIdx: 3, daysFromNow: 5, startTime: '15:00', status: 'scheduled', reason: 'Blood pressure check' },
  ];

  for (const cfg of appointmentConfigs) {
    const doctor = doctors[cfg.doctorIdx];
    const patient = patients[cfg.patientIdx];
    const profile = doctorProfiles[cfg.doctorIdx];
    const duration = profile.consultationDuration;
    const [h, m] = cfg.startTime.split(':').map(Number);
    const totalMins = h * 60 + m + duration;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const appointmentDate = dayjs().utc().startOf('day').add(cfg.daysFromNow, 'day').toDate();
    const ref = genRef(appointmentDate);

    const appt = await Appointment.create({
      doctorId: doctor._id,
      patientId: patient._id,
      appointmentDate,
      startTime: cfg.startTime,
      endTime,
      status: cfg.status,
      reason: cfg.reason,
      bookingReference: ref,
      cancelledBy: cfg.status === 'cancelled' ? patient._id : undefined,
      cancelledAt: cfg.status === 'cancelled' ? new Date() : undefined,
    });

    // Create slot reservations for active appointments
    if (cfg.status === 'scheduled') {
      await SlotReservation.create({
        doctorId: doctor._id,
        appointmentDate,
        startTime: cfg.startTime,
        appointmentId: appt._id,
      });
    }

    // Create notifications
    await Notification.create({
      recipientId: doctor._id,
      type: 'appointment_booked',
      title: 'Appointment Booked',
      message: `New appointment from ${patient.name} on ${dayjs(appointmentDate).format('YYYY-MM-DD')} at ${cfg.startTime}`,
      appointmentId: appt._id,
      isRead: cfg.daysFromNow < 0,
    });
  }

  // Print credentials
  console.log('\n========================================');
  console.log('SEED DATA CREATED SUCCESSFULLY');
  console.log('========================================');
  console.log('\nLOGIN CREDENTIALS (all use password: Password123!)\n');
  console.log('--- DOCTORS ---');
  credentials.filter((c) => c.role === 'doctor').forEach((c) => {
    console.log(`  ${c.name}`);
    console.log(`    Email   : ${c.email}`);
    console.log(`    Password: ${c.password}\n`);
  });
  console.log('--- PATIENTS ---');
  credentials.filter((c) => c.role === 'patient').forEach((c) => {
    console.log(`  ${c.name}`);
    console.log(`    Email   : ${c.email}`);
    console.log(`    Password: ${c.password}\n`);
  });
  console.log('========================================\n');

  await mongoose.disconnect();
  console.log('Seed complete. MongoDB disconnected.');
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
