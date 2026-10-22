import { BaseEntity } from './common';

export type NotificationType =
  | 'course_published'
  | 'new_lesson'
  | 'material_uploaded'
  | 'upcoming_class'
  | 'upcoming_test'
  | 'assignment_due'
  | 'test_result'
  | 'doubt_reply'
  | 'announcement'
  | 'payment_success'
  | 'system';

export type NotificationTargetRole = 'all' | 'student' | 'teacher' | 'admin';
export type NotificationPriority = 'low' | 'normal' | 'high';

export interface Notification extends BaseEntity {
  userId: string; // Specific student/teacher ID, or 'broadcast-all', or 'broadcast-student', or 'course:${courseId}'
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  readBy?: string[]; // IDs of users who have read this broadcast/course notification
  actionUrl?: string; // Direct link (e.g. /dashboard/student/classroom/..., /dashboard/student/results/...)
  courseId?: string; // Target course ID when notification is course-specific
  courseTitle?: string;
  targetRole?: NotificationTargetRole;
  senderId?: string;
  senderName?: string;
  senderRole?: 'admin' | 'teacher' | 'system';
  priority?: NotificationPriority;
  data?: Record<string, string>;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  fcmToken?: string;
  courses: boolean;
  tests: boolean;
  doubts: boolean;
  assignments: boolean;
  announcements: boolean;
  payments: boolean;
  updatedAt: string;
}
