import type { AppError } from './errors.js';

// Services return ServiceResult<T> — never throw, never touch HTTP. Controllers
// unwrap: on failure they throw `result.error` so the central errorHandler
// middleware translates it into the response envelope. This keeps business
// logic HTTP-free and error propagation predictable + testable.
export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: AppError };

export const Ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data });
export const Err = (error: AppError): ServiceResult<never> => ({ ok: false, error });

/** Unwrap a result in a controller: returns data, or throws the AppError. */
export function unwrap<T>(result: ServiceResult<T>): T {
  if (result.ok) return result.data;
  throw result.error;
}
