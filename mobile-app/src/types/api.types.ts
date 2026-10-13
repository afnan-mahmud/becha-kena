// Standard API envelope + error types (see "API Contract" in docs/mobile-app-prompts.md)
import type { User } from './user.types';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: string;
  code: string;
  details?: string[];
}

/** @deprecated use ApiErrorBody */
export type ApiErrorResponse = ApiErrorBody;

/** Normalised error thrown by every service call (see services/api.ts) */
export class ApiError extends Error {
  code: string;
  status: number;
  details?: string[];

  constructor({
    message,
    code,
    status,
    details,
  }: {
    message: string;
    code: string;
    status: number;
    details?: string[];
  }) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** `data` of POST /auth/verify-otp */
export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}
