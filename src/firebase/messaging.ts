import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { messaging, isFirebaseConfigured } from './config';

/**
 * Request browser notification permission and retrieve the FCM device token.
 *
 * @param vapidKey Public VAPID Key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
 */
export async function getFcmToken(vapidKey?: string): Promise<string | null> {
  if (!isFirebaseConfigured || !messaging) {
    console.info('[Firebase FCM] Messaging is not enabled or not supported in this client environment.');
    return null;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('[Firebase FCM] Notification permission was denied by the user.');
    return null;
  }

  try {
    const key = vapidKey || import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, { vapidKey: key });
    return token;
  } catch (error) {
    console.error('[Firebase FCM] Failed to get device token:', error);
    return null;
  }
}

/**
 * Register a foreground message handler.
 */
export function onMessageListener(
  callback: (payload: MessagePayload) => void
): () => void {
  if (!isFirebaseConfigured || !messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}
