import { notificationService } from '../services/notificationService';
import type { Notification, NotificationType } from '../types';

// Lightweight assertion helper for universal TypeScript test runners
const assert = {
  ok(val: any, msg?: string) {
    if (!val) throw new Error(msg || 'Expected truthy value');
  },
  strictEqual(actual: any, expected: any, msg?: string) {
    if (actual !== expected) {
      throw new Error(`${msg || 'Values did not match'} (Actual: ${actual}, Expected: ${expected})`);
    }
  },
  fail(msg?: string) {
    throw new Error(msg || 'Test assertion explicitly failed');
  },
};

async function runNotificationSystemTests() {
  console.log('--- STARTING IN-APP NOTIFICATION SYSTEM TEST SUITE ---\n');

  const testStudentId = `student_notif_${Date.now()}`;
  const testCourseId = 'course-class-11-pcm';
  const testCourseTitle = 'Class 11 Science PCM — Board & JEE Foundation';

  // 1. Test All 10 Notification Event Dispatchers
  console.log('1. Testing Event Dispatchers for all 10 platform notification events...');

  // Event 1: New course published
  const notifCourse = await notificationService.notifyCoursePublished('course-class-12-pcm', 'Class 12 Science PCM');
  assert.strictEqual(notifCourse.type, 'course_published');
  assert.ok(notifCourse.title.includes('New Course Launched'));

  // Event 2: New lesson available
  const notifLesson = await notificationService.notifyNewLesson(testCourseId, testCourseTitle, 'lesson_101', 'Electromagnetic Induction');
  assert.strictEqual(notifLesson.type, 'new_lesson');
  assert.strictEqual(notifLesson.courseId, testCourseId);

  // Event 3: New study notes uploaded
  const notifMaterial = await notificationService.notifyStudyMaterialUploaded(testCourseId, testCourseTitle, 'Organic Chemistry Formula Sheet');
  assert.strictEqual(notifMaterial.type, 'material_uploaded');

  // Event 4: Upcoming class
  const notifClass = await notificationService.notifyUpcomingClass(testCourseId, testCourseTitle, 'Live Doubt Clearing Session', new Date(Date.now() + 86400000).toISOString());
  assert.strictEqual(notifClass.type, 'upcoming_class');

  // Event 5: Upcoming test
  const notifTest = await notificationService.notifyUpcomingTest(testCourseId, testCourseTitle, 'test_mock_1', 'Physics Mid-Term Exam');
  assert.strictEqual(notifTest.type, 'upcoming_test');

  // Event 6: Assignment deadline
  const notifAssign = await notificationService.notifyAssignmentDeadline(testCourseId, testCourseTitle, 'assign_01', 'Calculus Problem Set 2', new Date(Date.now() + 48 * 3600000).toISOString());
  assert.strictEqual(notifAssign.type, 'assignment_due');

  // Event 7: Test result published
  const notifResult = await notificationService.notifyTestResultPublished(testStudentId, 'CBSE Board Simulation', 92, 92, 'attempt_789');
  assert.strictEqual(notifResult.type, 'test_result');
  assert.strictEqual(notifResult.userId, testStudentId);

  // Event 8: Teacher reply received
  const notifDoubt = await notificationService.notifyDoubtReply(testStudentId, 'Definite Integral Query', 'Dr. Sarah Khan', 'ticket_441');
  assert.strictEqual(notifDoubt.type, 'doubt_reply');
  assert.strictEqual(notifDoubt.userId, testStudentId);

  // Event 9: Course announcement
  const notifAnn = await notificationService.notifyCourseAnnouncement(testCourseId, testCourseTitle, 'Class Rescheduled to 5 PM', 'Due to faculty meeting...', 'Er. R.K. Sharma');
  assert.strictEqual(notifAnn.type, 'announcement');
  assert.strictEqual(notifAnn.courseId, testCourseId);

  // Event 10: Verified payment confirmation
  const notifPay = await notificationService.notifyPaymentSuccess(testStudentId, testCourseTitle, 'INV-998811', 1499);
  assert.strictEqual(notifPay.type, 'payment_success');
  assert.strictEqual(notifPay.userId, testStudentId);

  console.log('✓ Successfully created and dispatched all 10 distinct notification event types!');

  // 2. Test Deduplication Safeguard
  console.log('\n2. Testing Duplicate Notification Absorption...');
  const duplicatedNotif = await notificationService.notifyNewLesson(testCourseId, testCourseTitle, 'lesson_101', 'Electromagnetic Induction');
  assert.strictEqual(duplicatedNotif.id, notifLesson.id, 'Duplicate notification should return existing notification ID');
  console.log('✓ Deduplication guard successfully prevented duplicate notification dispatch within 10-minute window');

  // 3. Test Student Targeting & Course Permission Filtering
  console.log('\n3. Testing Access Permissions & Student Targeting...');
  // Student enrolled in testCourseId
  const enrolledStudentNotifs = await notificationService.getUserNotifications(testStudentId, 'student', [testCourseId]);
  const hasCourseNotif = enrolledStudentNotifs.some((n) => n.courseId === testCourseId);
  const hasPersonalNotif = enrolledStudentNotifs.some((n) => n.userId === testStudentId);
  assert.ok(hasCourseNotif, 'Enrolled student should receive notifications for their course');
  assert.ok(hasPersonalNotif, 'Student should receive their personal result and payment notifications');

  // Student NOT enrolled in testCourseId
  const otherStudentNotifs = await notificationService.getUserNotifications(`student_other_${Date.now()}`, 'student', ['different-course']);
  const receivedUnenrolledCourseNotif = otherStudentNotifs.some(
    (n) => n.courseId === testCourseId && n.userId === `course:${testCourseId}`
  );
  assert.strictEqual(receivedUnenrolledCourseNotif, false, 'Student must not receive notifications for non-enrolled courses');
  console.log('✓ Access permissions strictly enforced: students only receive authorized course & personal alerts');

  // 4. Test Mark As Read & Unread Count Calculation
  console.log('\n4. Testing Mark as Read & Unread Count...');
  const initialUnread = await notificationService.getUnreadCount(testStudentId, 'student', [testCourseId]);
  assert.ok(initialUnread > 0, 'Should have unread notifications initially');

  // Mark single personal notification as read
  await notificationService.markAsRead(notifResult.id, testStudentId);
  const updatedUnread = await notificationService.getUnreadCount(testStudentId, 'student', [testCourseId]);
  assert.strictEqual(updatedUnread, initialUnread - 1, 'Unread count should decrement by 1');

  // Batch mark all as read
  const currentNotifs = await notificationService.getUserNotifications(testStudentId, 'student', [testCourseId]);
  await notificationService.markAllAsRead(testStudentId, currentNotifs);
  const finalUnread = await notificationService.getUnreadCount(testStudentId, 'student', [testCourseId]);
  assert.strictEqual(finalUnread, 0, 'All notifications must be marked read');
  console.log('✓ Single mark-as-read and batch mark-all-read work accurately with correct unread counts');

  // 5. Test Notification Preferences
  console.log('\n5. Testing User Notification Preferences...');
  const initialPrefs = await notificationService.getUserPreferences(testStudentId);
  assert.strictEqual(initialPrefs.tests, true, 'Tests category enabled by default');

  // Disable 'tests' category in preferences
  await notificationService.updateUserPreferences(testStudentId, { tests: false });
  const notifsAfterPref = await notificationService.getUserNotifications(testStudentId, 'student', [testCourseId]);
  const hasTestNotif = notifsAfterPref.some((n) => n.type === 'upcoming_test' || n.type === 'test_result');
  assert.strictEqual(hasTestNotif, false, 'Disabled test category notifications should be suppressed');

  // Re-enable 'tests' category
  await notificationService.updateUserPreferences(testStudentId, { tests: true });
  const notifsRestored = await notificationService.getUserNotifications(testStudentId, 'student', [testCourseId]);
  const hasRestoredTest = notifsRestored.some((n) => n.type === 'upcoming_test' || n.type === 'test_result');
  assert.strictEqual(hasRestoredTest, true, 'Test notifications should reappear when category is re-enabled');
  console.log('✓ User preferences successfully respect category toggles and filter notifications');

  console.log('\n======================================================');
  console.log('ALL IN-APP NOTIFICATION & TARGETING TESTS PASSED!');
  console.log('======================================================');
}

runNotificationSystemTests().catch((err) => {
  console.error('\n❌ NOTIFICATION TEST SUITE FAILED:', err);
  if (typeof (globalThis as any).process !== 'undefined') {
    (globalThis as any).process.exit(1);
  }
});
