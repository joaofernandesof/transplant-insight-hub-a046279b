import { useEffect, useState, useCallback } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface UsePushNotificationsReturn {
  token: string | null;
  notification: PushNotificationSchema | null;
  isSupported: boolean;
  isRegistered: boolean;
  error: string | null;
  register: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [token, setToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<PushNotificationSchema | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isSupported = Capacitor.isNativePlatform();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('Push notifications not supported on web');
      return false;
    }

    try {
      const permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        const result = await PushNotifications.requestPermissions();
        return result.receive === 'granted';
      }
      
      return permStatus.receive === 'granted';
    } catch (err) {
      console.error('Error requesting push permission:', err);
      setError('Failed to request push notification permission');
      return false;
    }
  }, [isSupported]);

  const register = useCallback(async () => {
    if (!isSupported) {
      console.log('Push notifications not supported on web');
      return;
    }

    try {
      const hasPermission = await requestPermission();
      
      if (!hasPermission) {
        setError('Push notification permission denied');
        return;
      }

      await PushNotifications.register();
      setIsRegistered(true);
    } catch (err) {
      console.error('Error registering push notifications:', err);
      setError('Failed to register for push notifications');
    }
  }, [isSupported, requestPermission]);

  useEffect(() => {
    if (!isSupported) return;

    // Listen for registration success
    const registrationListener = PushNotifications.addListener(
      'registration',
      (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setToken(token.value);
        setError(null);
      }
    );

    // Listen for registration errors
    const registrationErrorListener = PushNotifications.addListener(
      'registrationError',
      (err) => {
        console.error('Push registration error:', err);
        setError('Push registration failed');
      }
    );

    // Listen for incoming push notifications
    const pushReceivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        setNotification(notification);
      }
    );

    // Listen for push notification actions
    const pushActionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Push action performed:', action);
        // Handle navigation based on notification data
        if (action.notification.data?.route) {
          window.location.href = action.notification.data.route;
        }
      }
    );

    return () => {
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
      pushReceivedListener.then(l => l.remove());
      pushActionListener.then(l => l.remove());
    };
  }, [isSupported]);

  return {
    token,
    notification,
    isSupported,
    isRegistered,
    error,
    register,
    requestPermission,
  };
}
