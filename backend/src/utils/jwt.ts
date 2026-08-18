import jwt, { JwtPayload } from 'jsonwebtoken';

interface AccessTokenPayload {
  userId: string;
  role: string;
  tokenVersion: number;
}

interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
  const expiresIn = process.env.JWT_ACCESS_EXPIRY || '15m';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRY || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
  return jwt.verify(token, secret) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
  return jwt.verify(token, secret) as JwtPayload;
};
