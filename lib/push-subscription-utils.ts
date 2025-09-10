// Push Subscription Utilities for Sunrise PWA

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Utility function to convert base64 to Uint8Array (for client-side)
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Utility function to convert ArrayBuffer to base64 (for client-side)
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Utility function to validate push subscription data
export function validatePushSubscription(subscription: PushSubscriptionData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!subscription.endpoint) {
    errors.push('Missing endpoint');
  }

  if (!subscription.keys) {
    errors.push('Missing keys object');
  } else {
    if (!subscription.keys.p256dh) {
      errors.push('Missing p256dh key');
    } else {
      try {
        const p256dhBuffer = Buffer.from(subscription.keys.p256dh, 'base64');
        if (p256dhBuffer.length !== 65) {
          errors.push(`Invalid p256dh key length: ${p256dhBuffer.length}, expected 65`);
        }
      } catch (error) {
        errors.push('Invalid p256dh key format');
      }
    }

    if (!subscription.keys.auth) {
      errors.push('Missing auth key');
    } else {
      try {
        const authBuffer = Buffer.from(subscription.keys.auth, 'base64');
        if (authBuffer.length !== 16) {
          errors.push(`Invalid auth key length: ${authBuffer.length}, expected 16`);
        }
      } catch (error) {
        errors.push('Invalid auth key format');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Utility function to create a proper push subscription object for webpush
export function createWebPushSubscription(subscription: PushSubscriptionData) {
  const validation = validatePushSubscription(subscription);
  
  if (!validation.isValid) {
    throw new Error(`Invalid push subscription: ${validation.errors.join(', ')}`);
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: Buffer.from(subscription.keys.p256dh, 'base64'),
      auth: Buffer.from(subscription.keys.auth, 'base64')
    }
  };
}

// Utility function to check if push notifications are supported
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Utility function to check if notifications are granted
export function isNotificationPermissionGranted(): boolean {
  return Notification.permission === 'granted';
}

// Utility function to request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }

  return await Notification.requestPermission();
}
