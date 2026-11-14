import jwt from 'jsonwebtoken';

const ACCESS_SECRET = () => process.env.JWT_ACCESS_SECRET || 'access_secret_fallback';
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET || 'refresh_secret_fallback';
const ACCESS_EXPIRES = () => process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = () => process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET(), { expiresIn: ACCESS_EXPIRES() });
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET(), { expiresIn: REFRESH_EXPIRES() });
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET());
  } catch (error) {
    throw error;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET());
  } catch (error) {
    throw error;
  }
};
