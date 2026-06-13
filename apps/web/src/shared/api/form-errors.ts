import { RequestError } from './unwrap.ts';

/** First field error for a given key, if the error is a validation RequestError. */
export function fieldError(err: unknown, field: string): string | undefined {
  if (err instanceof RequestError && err.fieldErrors?.[field]?.length) {
    return err.fieldErrors[field][0];
  }
  return undefined;
}

/** A human top-level message for an error, branching on the backend `code`. */
export function topLevelError(err: unknown): string | undefined {
  if (!(err instanceof RequestError)) return undefined;
  // Field errors render inline next to their field, so don't repeat them up top.
  if (err.code === 'validation_error' && err.fieldErrors) return undefined;
  return err.message;
}
