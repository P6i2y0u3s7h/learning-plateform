import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { studentService } from '../services/studentService';
import { getFcmToken, onMessageListener } from '../firebase/messaging';
import type { Notification, NotificationPreferences } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences | null;
  pushPermission: NotificationPermission;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return window.Notification.permission;
    }
    return 'default';
  });

  const loadData = useCallback(async () => {
    const userId = user?.uid || 'student_123';
    const userRole = role || 'student';

    try {
      setLoading(true);
      // Fetch student enrolled course IDs if student
      let courseIds: string[] = [];
      if (userRole === 'student') {
        try {
          const enrollments = await studentService.getStudentEnrollments(userId);
          courseIds = enrollments.map((e) => e.courseId);
        } catch (e) {
          // ignore
        }
      }

      const [list, prefs] = await Promise.all([
        notificationService.getUserNotifications(userId, userRole, courseIds),
        notificationService.getUserPreferences(userId),
      ]);

      setNotifications(list);
      setPreferences(prefs);
    } catch (err) {
      console.warn('[NotificationContext] Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup foreground FCM listener if configured
  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      console.info('[NotificationContext] Push notification received in foreground:', payload);
      // Refresh notifications when message arrives
      loadData();
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const markAsRead = useCallback(async (id: string) => {
    const userId = user?.uid || 'student_123';
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await notificationService.markAsRead(id, userId);
  }, [user?.uid]);

  const markAllAsRead = useCallback(async () => {
    const userId = user?.uid || 'student_123';
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await notificationService.markAllAsRead(userId, notifications);
  }, [user?.uid, notifications]);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    const userId = user?.uid || 'student_123';
    const updated = await notificationService.updateUserPreferences(userId, updates);
    setPreferences(updated);
    loadData();
  }, [user?.uid, loadData]);

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const token = await getFcmToken();
      const currentPerm = window.Notification.permission;
      setPushPermission(currentPerm);

      if (currentPerm === 'granted') {
        const userId = user?.uid || 'student_123';
        await updatePreferences({
          pushEnabled: true,
          fcmToken: token || undefined,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('[NotificationContext] Error requesting push permission:', err);
      return false;
    }
  }, [user?.uid, updatePreferences]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      preferences,
      pushPermission,
      markAsRead,
      markAllAsRead,
      refreshNotifications: loadData,
      updatePreferences,
      requestPushPermission,
    }),
    [
      notifications,
      unreadCount,
      loading,
      preferences,
      pushPermission,
      markAsRead,
      markAllAsRead,
      loadData,
      updatePreferences,
      requestPushPermission,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
