import jwt from 'jsonwebtoken';
import { Role, UserStatus } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  status: UserStatus;
}

const accessSecret = process.env.JWT_ACCESS_SECRET!;
const refreshSecret = process.env.JWT_REFRESH_SECRET!;
const accessExpires = process.env.JWT_ACCESS_EXPIRES || '15m';
const refreshExpires = process.env.JWT_REFRESH_EXPIRES || '7d';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, accessSecret, { expiresIn: accessExpires as jwt.SignOptions['expiresIn'] });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, refreshSecret, { expiresIn: refreshExpires as jwt.SignOptions['expiresIn'] });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, refreshSecret) as TokenPayload;
}
