import * as authService from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';
import User from '../models/User.model.js';
import DoctorProfile from '../models/DoctorProfile.model.js';
import PatientProfile from '../models/PatientProfile.model.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const registerPatient = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const { user, profile } = await authService.registerPatient({ name, email, password, phone });

    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;

    return sendSuccess(res, { user: userObj, profile }, 'Patient registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const registerDoctor = async (req, res, next) => {
  try {
    const data = req.body;
    const { user, profile } = await authService.registerDoctor(data);

    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.passwordHash;

    return sendSuccess(res, { user: userObj, profile }, 'Doctor registered successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers['user-agent'];
    const { user, accessToken, refreshToken } = await authService.login(email, password, userAgent);

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    return sendSuccess(res, { user, accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) return sendError(res, 'Refresh token is required', 400);

    const tokens = await authService.refreshTokens(refreshToken);
    if (tokens.refreshToken) {
      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    }

    return sendSuccess(res, tokens, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).lean();
    if (!user) return sendError(res, 'User not found', 404);

    let profile = null;
    if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id }).lean();
    } else if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id }).lean();
    }

    return sendSuccess(res, { user, profile }, 'User fetched');
  } catch (err) {
    next(err);
  }
};
