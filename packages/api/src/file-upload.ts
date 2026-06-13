// Direct-to-storage upload helper.
//
// The privacy model (PRD §10): our backend is the access-control gate. The
// client asks OUR backend for an upload target (EP.MEDIA_UPLOAD_URI), then PUTs
// the bytes straight to storage using the returned presigned `uri`. The client
// then persists the `key` by creating a post; viewing media always goes back
// through our backend (EP.POST_MEDIA), which verifies pair membership before
// minting a signed view URL. The raw storage URL is never long-lived in the
// client and never crosses pairs.
//
// This module only performs the raw PUT — fetching the target is a normal
// react-query call against our backend. The file-service base URL is never
// referenced here; the presigned `uri` is fully-qualified.

/**
 * PUT a Blob/File directly to a presigned storage URL.
 * Per the file-service contract: PUT (not POST), Content-Type recommended, no
 * request body to our service. The `uri` expires ~15 minutes after it is minted,
 * so call this promptly after fetching the target.
 */
export async function uploadToStorage(uri: string, file: Blob): Promise<void> {
  const res = await fetch(uri, {
    method: 'PUT',
    body: file,
    headers: file.type ? { 'Content-Type': file.type } : {},
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }
}
