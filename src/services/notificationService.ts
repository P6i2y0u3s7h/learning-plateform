import {
  getDocData,
  setDocData,
  updateDocData,
  queryCollection,
} from '../firebase/firestore';
import { where, orderBy, limit } from 'firebase/firestore';
import type {
  Notification,
  NotificationType,
  NotificationTargetRole,
  NotificationPriority,
  NotificationPreferences,
} from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';
const PREFERENCES_COLLECTION = 'notificationPreferences';

// In-memory fallback caches for reliable offline & test-mode state consistency
const inMemoryNotifications = new Map<string, Notification>();
const inMemoryPreferences = new Map<string, NotificationPreferences>();

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_init_001',
    userId: 'broadcast-all',
    targetRole: 'all',
    type: 'announcement',
    title: 'Admissions Open: Board & Entrance Batches 2026',
    body: 'Registrations are now active for Class 10/12 CBSE Boards, BPSC TRE 4.0, and AMU/Jamia Entrance batches.',
    read: false,
    readBy: [],
    priority: 'high',
    actionUrl: '/school-courses',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'notif_init_002',
    userId: 'student_123',
    courseId: 'course-class-11-pcm',
    courseTitle: 'Class 11 Science PCM — Board & JEE Foundation',
    type: 'new_lesson',
    title: 'New Video Lecture Available: Newton\'s Laws of Motion',
    body: 'Chapter 4 — Laws of Motion, Part 2 (Friction & Tension Forces) has been published by Er. R.K. Sharma.',
    read: false,
    readBy: [],
    priority: 'normal',
    actionUrl: '/dashboard/student/classroom/course-class-11-pcm',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'notif_init_003',
    userId: 'student_123',
    courseId: 'course-class-11-pcm',
    courseTitle: 'Class 11 Science PCM',
    type: 'material_uploaded',
    title: 'New Study Notes: Thermodynamics Quick Formula Sheet',
    body: 'Comprehensive handwritten revision notes and derivation cheat sheets are now accessible in Study Materials.',
    read: true,
    readBy: ['student_123'],
    priority: 'normal',
    actionUrl: '/dashboard/student/materials',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'notif_init_004',
    userId: 'broadcast-student',
    targetRole: 'student',
    courseId: 'course-bpsc-tre',
    type: 'upcoming_test',
    title: 'Upcoming Mock Test: BPSC TRE Full Length Simulation #3',
    body: 'Scheduled for this Sunday at 10:00 AM IST. 150 questions covering General Studies and Educational Pedagogy.',
    read: false,
    readBy: [],
    priority: 'high',
    actionUrl: '/dashboard/student/tests',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'notif_init_005',
    userId: 'student_123',
    type: 'test_result',
    title: 'Test Result Published: Physics Chapter 3 Quiz',
    body: 'You scored 88% (22/25 marks). Detailed answer explanations and rank analysis are available for review.',
    read: false,
    readBy: [],
    priority: 'normal',
    actionUrl: '/dashboard/student/results',
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'notif_init_006',
    userId: 'student_123',
    type: 'doubt_reply',
    title: 'Teacher Replied to Your Doubt on Integration by Parts',
    body: 'Dr. Sarah Khan provided a step-by-step solution to your query regarding definite integrals.',
    read: false,
    readBy: [],
    priority: 'normal',
    actionUrl: '/dashboard/student/doubts',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 'notif_init_007',
    userId: 'student_123',
    type: 'payment_success',
    title: 'Fee Receipt Generated: Class 11 Science PCM',
    body: 'Your course payment of ₹1,499 was verified. Invoice INV-784910 has been generated with active 365-day access.',
    read: true,
    readBy: ['student_123'],
    priority: 'normal',
    actionUrl: '/dashboard/student/payments',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

// Populate seed into in-memory store
INITIAL_NOTIFICATIONS.forEach((n) => inMemoryNotifications.set(n.id, n));

export interface CreateNotificationParams {
  userId?: string;
  targetRole?: NotificationTargetRole;
  courseId?: string;
  courseTitle?: string;
  title: string;
  body: string;
  type: NotificationType;
  actionUrl?: string;
  priority?: NotificationPriority;
  senderId?: string;
  senderName?: string;
  senderRole?: 'admin' | 'teacher' | 'system';
  data?: Record<string, string>;
}

export const notificationService = {
  /**
   * Helper: Check if a notification is read by the specified user
   */
  isRead(notif: Notification, userId: string): boolean {
    if (notif.userId === userId) {
      return !!notif.read;
    }
    return !!(notif.readBy && notif.readBy.includes(userId));
  },

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    if (!userId) {
      return this.getDefaultPreferences('anonymous');
    }

    if (inMemoryPreferences.has(userId)) {
      return inMemoryPreferences.get(userId)!;
    }

    try {
      const data = await getDocData<NotificationPreferences>(PREFERENCES_COLLECTION, userId);
      if (data) {
        inMemoryPreferences.set(userId, data);
        return data;
      }
    } catch (e) {
      // fallback
    }

    const defaultPrefs = this.getDefaultPreferences(userId);
    inMemoryPreferences.set(userId, defaultPrefs);
    return defaultPrefs;
  },

  getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      inAppEnabled: true,
      emailEnabled: true,
      pushEnabled: false,
      courses: true,
      tests: true,
      doubts: true,
      assignments: true,
      announcements: true,
      payments: true,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Update notification preferences for a user
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const current = await this.getUserPreferences(userId);
    const updated: NotificationPreferences = {
      ...current,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };

    inMemoryPreferences.set(userId, updated);

    try {
      await setDocData(PREFERENCES_COLLECTION, userId, updated, true);
    } catch (err) {
      console.warn('[notificationService] Failed to persist preferences to Firestore:', err);
    }

    return updated;
  },

  /**
   * Fetch all notifications relevant to a user based on their ID, role, and enrolled courses.
   * Respects user category preferences.
   */
  async getUserNotifications(
    userId: string,
    userRole: string = 'student',
    userCourseIds: string[] = []
  ): Promise<Notification[]> {
    if (!userId) return [];

    const preferences = await this.getUserPreferences(userId);
    if (!preferences.inAppEnabled) {
      return [];
    }

    // 1. Gather all candidate notifications from database & in-memory cache
    const candidatesMap = new Map<string, Notification>();

    // Seed/memory candidates
    inMemoryNotifications.forEach((n) => candidatesMap.set(n.id, n));

    try {
      // Fetch Firestore records:
      // 1. User direct notifications (indexed by userId ASC, createdAt DESC)
      const userNotifsPromise = queryCollection<Notification>(
        NOTIFICATIONS_COLLECTION,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      ).catch(() => []);

      // 2. Global/recent notifications (single field orderBy('createdAt', 'desc') requires no composite index)
      const recentGeneralPromise = queryCollection<Notification>(
        NOTIFICATIONS_COLLECTION,
        orderBy('createdAt', 'desc'),
        limit(100)
      ).catch(() => []);

      // 3. If teacher/faculty, also load notifications they created
      const senderNotifsPromise =
        userRole === 'teacher' || userRole === 'admin'
          ? queryCollection<Notification>(
              NOTIFICATIONS_COLLECTION,
              where('senderId', '==', userId),
              limit(50)
            ).catch(() => [])
          : Promise.resolve([]);

      const [userNotifs, recentNotifs, senderNotifs] = await Promise.all([
        userNotifsPromise,
        recentGeneralPromise,
        senderNotifsPromise,
      ]);

      userNotifs.forEach((n) => candidatesMap.set(n.id, n));
      recentNotifs.forEach((n) => candidatesMap.set(n.id, n));
      senderNotifs.forEach((n) => candidatesMap.set(n.id, n));
    } catch (err) {
      // Offline fallback already populated from candidatesMap
    }

    // 2. Filter candidate notifications by targeting rules and user preferences
    const result: Notification[] = [];

    for (const notif of candidatesMap.values()) {
      // Check Targeting:
      const isDirectRecipient = notif.userId === userId;
      const isSender = notif.senderId === userId;

      // Role Broadcast (applies when not restricted to a specific course)
      const isRoleBroadcast =
        !notif.courseId &&
        (notif.targetRole === 'all' ||
          notif.targetRole === userRole ||
          notif.userId === 'broadcast-all' ||
          notif.userId === `broadcast-${userRole}`);

      // Course-targeted notification (only delivered if student is enrolled in the course, or is faculty/admin/sender)
      const isCourseTargeted =
        !!notif.courseId &&
        (userCourseIds.includes(notif.courseId) ||
          userRole === 'admin' ||
          userRole === 'teacher' ||
          isSender ||
          notif.userId === `course:${notif.courseId}`);

      const isTargeted = isDirectRecipient || isSender || isRoleBroadcast || isCourseTargeted;
      if (!isTargeted) continue;

      // Check Preferences Category Filters:
      if (!this.matchesCategoryPreference(notif.type, preferences)) {
        continue;
      }

      // Compute display read status for this specific user
      const isReadByUser = this.isRead(notif, userId);
      result.push({
        ...notif,
        read: isReadByUser,
      });
    }

    // Sort descending by creation date
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  matchesCategoryPreference(type: NotificationType, prefs: NotificationPreferences): boolean {
    switch (type) {
      case 'course_published':
      case 'new_lesson':
      case 'material_uploaded':
      case 'upcoming_class':
        return prefs.courses;
      case 'upcoming_test':
      case 'test_result':
        return prefs.tests;
      case 'doubt_reply':
        return prefs.doubts;
      case 'assignment_due':
        return prefs.assignments;
      case 'announcement':
      case 'system':
        return prefs.announcements;
      case 'payment_success':
        return prefs.payments;
      default:
        return true;
    }
  },

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(
    userId: string,
    userRole: string = 'student',
    userCourseIds: string[] = []
  ): Promise<number> {
    const list = await this.getUserNotifications(userId, userRole, userCourseIds);
    return list.filter((n) => !n.read).length;
  },

  /**
   * Mark a single notification as read by the user
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    if (!notificationId || !userId) return;

    let notif = inMemoryNotifications.get(notificationId);
    if (!notif) {
      try {
        notif = await getDocData<Notification>(NOTIFICATIONS_COLLECTION, notificationId);
      } catch (e) {
        // fallback
      }
    }

    if (!notif) return;

    const now = new Date().toISOString();
    let updatedNotif: Notification;

    if (notif.userId === userId) {
      // Direct recipient
      updatedNotif = {
        ...notif,
        read: true,
        updatedAt: now,
      };
    } else {
      // Broadcast or course-targeted recipient
      const existingReadBy = notif.readBy || [];
      const updatedReadBy = existingReadBy.includes(userId)
        ? existingReadBy
        : [...existingReadBy, userId];

      updatedNotif = {
        ...notif,
        readBy: updatedReadBy,
        updatedAt: now,
      };
    }

    inMemoryNotifications.set(notificationId, updatedNotif);

    try {
      await updateDocData(NOTIFICATIONS_COLLECTION, notificationId, updatedNotif);
    } catch (err) {
      // offline fallback
    }
  },

  /**
   * Mark all unread notifications as read for a user
   */
  async markAllAsRead(userId: string, notifications: Notification[]): Promise<void> {
    if (!userId || !notifications.length) return;

    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => this.markAsRead(n.id, userId)));
  },

  /**
   * Create and dispatch a new notification with deduplication safeguard.
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const {
      userId,
      targetRole = 'all',
      courseId,
      courseTitle,
      title,
      body,
      type,
      actionUrl,
      priority = 'normal',
      senderId = 'system',
      senderName = 'Brainstorm Academy',
      senderRole = 'system',
      data = {},
    } = params;

    if (!title || !body) {
      throw new Error('Notification title and body are required.');
    }

    const computedUserId = userId || (courseId ? `course:${courseId}` : `broadcast-${targetRole}`);

    // Deduplication Shield: Prevent creating duplicate notifications within a 10-minute window
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const existing of inMemoryNotifications.values()) {
      if (
        existing.type === type &&
        existing.title === title &&
        existing.courseId === courseId &&
        existing.userId === computedUserId &&
        new Date(existing.createdAt).getTime() > tenMinutesAgo
      ) {
        console.info('[notificationService] Duplicate notification absorbed:', title);
        return existing;
      }
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newNotif: Notification = {
      id,
      userId: computedUserId,
      targetRole: userId ? undefined : targetRole,
      courseId,
      courseTitle,
      title,
      body,
      type,
      read: false,
      readBy: [],
      actionUrl,
      priority,
      senderId,
      senderName,
      senderRole,
      data,
      createdAt: now,
      updatedAt: now,
    };

    inMemoryNotifications.set(id, newNotif);

    try {
      await setDocData(NOTIFICATIONS_COLLECTION, id, newNotif);
    } catch (err) {
      console.warn('[notificationService] Firestore create notification fallback:', err);
    }

    // Trigger Browser Notification if granted and supported
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
      try {
        new window.Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (e) {
        // ignore push error
      }
    }

    return newNotif;
  },

  // ==============================================================
  // SPECIALIZED EVENT DISPATCHERS (Zero Fake Data)
  // ==============================================================

  async notifyCoursePublished(courseId: string, courseTitle: string) {
    return this.createNotification({
      targetRole: 'all',
      courseId,
      courseTitle,
      type: 'course_published',
      title: `New Course Launched: ${courseTitle}`,
      body: `Explore the comprehensive curriculum, video lectures, and practice modules now live on Brainstorm Academy.`,
      actionUrl: `/courses/${courseId}`,
      priority: 'high',
    });
  },

  async notifyNewLesson(courseId: string, courseTitle: string, lessonId: string, lessonTitle: string) {
    return this.createNotification({
      courseId,
      courseTitle,
      type: 'new_lesson',
      title: `New Lesson: ${lessonTitle}`,
      body: `A new video lecture has been added to ${courseTitle}. Watch it now in your classroom!`,
      actionUrl: `/dashboard/student/classroom/${courseId}/${lessonId}`,
      priority: 'normal',
    });
  },

  async notifyStudyMaterialUploaded(courseId: string, courseTitle: string, materialTitle: string) {
    return this.createNotification({
      courseId,
      courseTitle,
      type: 'material_uploaded',
      title: `Study Material Uploaded: ${materialTitle}`,
      body: `New chapter notes and downloadable PDF resources have been added to ${courseTitle}.`,
      actionUrl: '/dashboard/student/materials',
      priority: 'normal',
    });
  },

  async notifyUpcomingClass(courseId: string, courseTitle: string, classTitle: string, startTime: string) {
    return this.createNotification({
      courseId,
      courseTitle,
      type: 'upcoming_class',
      title: `Live Class Scheduled: ${classTitle}`,
      body: `Live interactive lecture on ${courseTitle} begins on ${new Date(startTime).toLocaleString()}.`,
      actionUrl: '/dashboard/student/classes',
      priority: 'high',
    });
  },

  async notifyUpcomingTest(courseId: string, courseTitle: string, testId: string, testTitle: string) {
    return this.createNotification({
      courseId,
      courseTitle,
      type: 'upcoming_test',
      title: `Upcoming Examination: ${testTitle}`,
      body: `A scheduled examination has been configured for ${courseTitle}. Review instructions and test syllabus.`,
      actionUrl: `/dashboard/student/tests`,
      priority: 'high',
    });
  },

  async notifyAssignmentDeadline(courseId: string, courseTitle: string, assignmentId: string, assignmentTitle: string, dueDate: string) {
    return this.createNotification({
      courseId,
      courseTitle,
      type: 'assignment_due',
      title: `Assignment Deadline Approaching: ${assignmentTitle}`,
      body: `Submission window for ${assignmentTitle} in ${courseTitle} closes on ${new Date(dueDate).toLocaleDateString()}.`,
      actionUrl: '/dashboard/student/assignments',
      priority: 'high',
    });
  },

  async notifyTestResultPublished(userId: string, testTitle: string, score: number, percentage: number, attemptId: string) {
    return this.createNotification({
      userId,
      type: 'test_result',
      title: `Test Evaluated: ${testTitle}`,
      body: `Your score: ${score} marks (${percentage}%). Review question-by-question breakdown and solutions.`,
      actionUrl: `/dashboard/student/test-results/${attemptId}`,
      priority: 'normal',
    });
  },

  async notifyDoubtReply(studentId: string, doubtTitle: string, teacherName: string, doubtId: string) {
    return this.createNotification({
      userId: studentId,
      type: 'doubt_reply',
      title: `${teacherName} Answered Your Doubt`,
      body: `Faculty responded to: "${doubtTitle}". Open your ticket to see the complete explanation.`,
      actionUrl: '/dashboard/student/doubts',
      priority: 'normal',
    });
  },

  async notifyPaymentSuccess(userId: string, courseTitle: string, invoiceNumber: string, amount: number) {
    return this.createNotification({
      userId,
      type: 'payment_success',
      title: `Payment Confirmed: ₹${amount.toLocaleString('en-IN')}`,
      body: `Your enrollment fee for ${courseTitle} was verified. Invoice #${invoiceNumber} is ready.`,
      actionUrl: '/dashboard/student/payments',
      priority: 'high',
    });
  },

  async notifyCourseAnnouncement(
    courseId: string,
    courseTitle: string,
    title: string,
    body: string,
    senderName: string,
    senderRole: 'admin' | 'teacher' = 'teacher',
    senderId?: string
  ) {
    return this.createNotification({
      courseId,
      courseTitle,
      type: 'announcement',
      targetRole: 'all',
      title,
      body,
      senderId,
      senderName,
      senderRole,
      actionUrl: `/dashboard/student/classroom/${courseId}`,
      priority: 'high',
    });
  },
};

export default notificationService;
