import { apiClient, parseApiError, type ApiResponse } from '@lovebook/api';

// Minimal ky request-options shape we actually use (avoids a direct ky dep here;
// ky belongs to @lovebook/api). Widened to unknown-friendly.
type Options = { searchParams?: Record<string, string | number> };

// Thin wrappers around the ky client that unwrap the `{ data }` envelope so
// queryFns/mutationFns return the payload directly. Errors are normalised to an
// ApiError ({ code, message, field_errors? }) and thrown, so react-query's
// error state always carries the backend `code` to branch on.

export class RequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

async function toRequestError(err: unknown): Promise<RequestError> {
  // ky throws HTTPError with a .response we can read the envelope from.
  const httpErr = err as { response?: Response };
  if (httpErr.response) {
    const status = httpErr.response.status;
    const body = await httpErr.response.json().catch(() => ({}));
    const apiErr = parseApiError(body);
    return new RequestError(apiErr.code, apiErr.message, status, apiErr.field_errors);
  }
  return new RequestError('network', 'Network error — check your connection', 0);
}

export async function getData<T>(path: string, options?: Options): Promise<T> {
  try {
    const res = await apiClient.get(path, options).json<ApiResponse<T>>();
    return res.data;
  } catch (err) {
    throw await toRequestError(err);
  }
}

export async function postData<T>(path: string, body?: unknown): Promise<T> {
  try {
    const res = await apiClient.post(path, body ? { json: body } : undefined).json<ApiResponse<T>>();
    return res.data;
  } catch (err) {
    throw await toRequestError(err);
  }
}

export async function patchData<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await apiClient.patch(path, { json: body }).json<ApiResponse<T>>();
    return res.data;
  } catch (err) {
    throw await toRequestError(err);
  }
}

export async function putData<T>(path: string, body: unknown): Promise<T> {
  try {
    const res = await apiClient.put(path, { json: body }).json<ApiResponse<T>>();
    return res.data;
  } catch (err) {
    throw await toRequestError(err);
  }
}

/** For 204 / no-body responses (logout, delete, clear reaction). */
export async function sendNoContent(
  method: 'post' | 'delete',
  path: string,
  body?: unknown,
): Promise<void> {
  try {
    if (method === 'delete') await apiClient.delete(path);
    else await apiClient.post(path, body ? { json: body } : undefined);
  } catch (err) {
    throw await toRequestError(err);
  }
}
