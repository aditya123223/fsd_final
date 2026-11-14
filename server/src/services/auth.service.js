import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import User from '../models/User.model.js';
import DoctorProfile from '../models/DoctorProfile.model.js';
import PatientProfile from '../models/PatientProfile.model.js';
import RefreshSession from '../models/RefreshSession.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils.js';
import { SALT_ROUNDS } from '../config/constants.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

/**
 * Register a new patient
 */
export const registerPatient = async ({ name, email, password, phone }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: 'patient', phone });
  const profile = await PatientProfile.create({ userId: user._id });

  return { user, profile };
};

/**
 * Register a new doctor
 */
export const registerDoctor = async ({
  name, email, password, phone,
  specialization, qualifications, experience,
  consultationFee, registrationNumber, consultationDuration,
  bio, timezone,
}) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role: 'doctor', phone });
  const profile = await DoctorProfile.create({
    userId: user._id,
    specialization,
    qualifications: qualifications || [],
    experience: experience || 0,
    consultationFee: consultationFee || 0,
    registrationNumber,
    consultationDuration: consultationDuration || 30,
    bio,
    timezone: timezone || 'UTC',
  });

  return { user, profile };
};

/**
 * Login and return access + refresh tokens
 */
export const login = async (email, password, userAgent) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const payload = { userId: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store hashed refresh token in DB
  const tokenHash = await bcrypt.hash(refreshToken, SALT_ROUNDS);
  const expiresAt = dayjs().add(7, 'day').toDate();
  await RefreshSession.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    userAgent: userAgent || 'unknown',
  });

  const userObj = user.toObject();
  delete userObj.passwordHash;

  return { user: userObj, accessToken, refreshToken };
};

/**
 * Rotate refresh tokens
 */
export const refreshTokens = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  // Find all active sessions for this user
  const sessions = await RefreshSession.find({
    userId: decoded.userId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });

  // Find matching session by comparing token
  let matchedSession = null;
  for (const session of sessions) {
    const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
    if (isMatch) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession) throw new AppError('Refresh token not found or revoked', 401);

  // Revoke old session
  matchedSession.revoked = true;
  await matchedSession.save();

  // Generate new tokens
  const user = await User.findById(decoded.userId);
  if (!user) throw new AppError('User not found', 404);

  const payload = { userId: user._id.toString(), role: user.role };
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // Store new session
  const tokenHash = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
  const expiresAt = dayjs().add(7, 'day').toDate();
  await RefreshSession.create({ userId: user._id, tokenHash, expiresAt });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — revoke refresh session
 */
export const logout = async (refreshToken) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    // Token may already be expired — still try to clean up
    return;
  }

  const sessions = await RefreshSession.find({
    userId: decoded.userId,
    revoked: false,
  });

  for (const session of sessions) {
    const isMatch = await bcrypt.compare(refreshToken, session.tokenHash);
    if (isMatch) {
      session.revoked = true;
      await session.save();
      break;
    }
  }
};
