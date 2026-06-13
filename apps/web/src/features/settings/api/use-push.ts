import { useMutation, useQuery } from '@tanstack/react-query';

import { EP } from '@lovebook/api';

import { getData, postData } from '@shared/api/unwrap.ts';

interface VapidKey {
  key: string | null;
}

export function usePushKey() {
  return useQuery({
    queryKey: ['push', 'key'],
    queryFn: () => getData<VapidKey>(EP.PUSH_KEY),
    staleTime: Infinity,
  });
}

/** Whether the browser can do Web Push at all (SW + PushManager + Notification). */
export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function urlBase64ToBytes(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

/** Request permission, subscribe via the SW, and register the subscription. */
export function useEnablePush() {
  const keyQuery = usePushKey();
  return useMutation({
    mutationFn: async () => {
      if (!pushSupported()) throw new Error('Push is not supported on this device.');
      const vapid = keyQuery.data?.key;
      if (!vapid) throw new Error('Push is not configured on the server yet.');

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notifications were not allowed.');

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBytes(vapid),
        }));

      const json = sub.toJSON();
      await postData(EP.PUSH_SUBSCRIBE, {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      });
    },
  });
}
