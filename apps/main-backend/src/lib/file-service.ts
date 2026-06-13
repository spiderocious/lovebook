import { env } from '../env.js';
import { AppError } from './errors.js';

// Server-side client for the external file-service proxy. The frontend never
// calls the file-service directly for keys/URIs — it goes through our backend,
// which is the access-control gate (verifies pair membership before minting a
// view URL). See docs/lovebook-plan.md §6.
//
// Contract (file-service-doc.md): query-string params only, no request body.
// `prefix`/`suffix` must be EXACTLY 5 chars. `ext` is alphanumeric, no dot.

const PREFIX = 'lovef'; // exactly 5 chars

export interface UploadTarget {
  key: string;
  uri: string;
  expiresIn: string;
}

export interface ViewUri {
  uri: string;
  expiresIn: string;
}

async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.FILE_SERVICE_BASE_URL}${path}`);
  } catch {
    throw new AppError('internal', 'File service unreachable', 502);
  }
  if (!res.ok) {
    throw new AppError('internal', `File service error (${res.status})`, 502);
  }
  return (await res.json()) as T;
}

/** Mint a presigned upload target. `ext` must be alphanumeric (no dot). */
export async function getUploadTarget(ext: string): Promise<UploadTarget> {
  const safeExt = ext.replace(/[^a-z0-9]/gi, '');
  const qs = new URLSearchParams({ prefix: PREFIX });
  if (safeExt) qs.set('ext', safeExt);
  const out = await getJson<{ key: string; uri: string; expires_in: string }>(
    `/get-upload-uri?${qs.toString()}`,
  );
  return { key: out.key, uri: out.uri, expiresIn: out.expires_in };
}

/** Mint a short-lived signed view URL for a stored key. */
export async function getViewUri(key: string): Promise<ViewUri> {
  const out = await getJson<{ uri: string; expires_in: string }>(
    `/get-file-uri?key=${encodeURIComponent(key)}`,
  );
  return { uri: out.uri, expiresIn: out.expires_in };
}
