import {
  getDocData,
  setDocData,
  updateDocData,
  queryCollection,
  where,
  orderBy,
  limit,
} from '../firebase/firestore';
import type {
  Enrollment,
  Course,
  Test,
  TestAttempt,
  Assignment,
  AssignmentSubmission,
  StudyMaterial,
  LiveClass,
  DoubtTicket,
  Payment,
  Notification,
} from '../types';
import { examService } from './examService';
import { courseworkService } from './courseworkService';
import { paymentService } from './paymentService';
import { notificationService } from './notificationService';

const ENROLLMENTS_COLLECTION = 'enrollments';
const COURSES_COLLECTION = 'courses';
const TESTS_COLLECTION = 'tests';
const TEST_ATTEMPTS_COLLECTION = 'testAttempts';
const ASSIGNMENTS_COLLECTION = 'assignments';
const ASSIGNMENT_SUBMISSIONS_COLLECTION = 'assignmentSubmissions';
const STUDY_MATERIALS_COLLECTION = 'studyMaterials';
const CLASSES_COLLECTION = 'classes';
const DOUBTS_COLLECTION = 'doubts';
const PAYMENTS_COLLECTION = 'payments';
const NOTIFICATIONS_COLLECTION = 'notifications';

export const studentService = {
  /**
   * Fetch all course enrollments for the authorized student.
   */
  async getStudentEnrollments(userId: string): Promise<Enrollment[]> {
    if (!userId) return [];
    try {
      return await queryCollection<Enrollment>(
        ENROLLMENTS_COLLECTION,
        where('userId', '==', userId),
        orderBy('enrolledAt', 'desc')
      );
    } catch (err) {
      console.warn('Error fetching student enrollments from Firestore:', err);
      return [];
    }
  },

  /**
   * Fetch course details for a list of course IDs.
   */
  async getCoursesByIds(courseIds: string[]): Promise<Course[]> {
    if (!courseIds || courseIds.length === 0) return [];
    try {
      const courses: Course[] = [];
      for (const id of courseIds) {
        const course = await getDocData<Course>(COURSES_COLLECTION, id);
        if (course) courses.push(course);
      }
      return courses;
    } catch (err) {
      console.warn('Error fetching courses by IDs:', err);
      return [];
    }
  },

  /**
   * Fetch all published courses available for enrollment.
   */
  async getAvailableCourses(): Promise<Course[]> {
    try {
      return await queryCollection<Course>(
        COURSES_COLLECTION,
        where('isPublished', '==', true),
        orderBy('title', 'asc')
      );
    } catch (err) {
      console.warn('Error fetching available courses:', err);
      return [];
    }
  },

  /**
   * Fetch test attempts for the student.
   */
  async getStudentTestAttempts(userId: string): Promise<TestAttempt[]> {
    if (!userId) return [];
    try {
      return await queryCollection<TestAttempt>(
        TEST_ATTEMPTS_COLLECTION,
        where('userId', '==', userId),
        orderBy('startedAt', 'desc')
      );
    } catch (err) {
      console.warn('Error fetching test attempts:', err);
      return [];
    }
  },

  /**
   * Fetch available practice tests.
   */
  async getAvailablePracticeTests(): Promise<Test[]> {
    return examService.getPublishedTests();
  },

  /**
   * Fetch published assignments.
   */
  async getAssignments(): Promise<Assignment[]> {
    return courseworkService.getAssignments();
  },

  /**
   * Fetch student's assignment submissions.
   */
  async getStudentAssignmentSubmissions(userId: string): Promise<AssignmentSubmission[]> {
    return courseworkService.getStudentSubmissions(userId);
  },

  /**
   * Submit an assignment response.
   */
  async submitAssignment(submission: Partial<AssignmentSubmission>): Promise<string> {
    return courseworkService.submitAssignmentResponse({
      assignmentId: submission.assignmentId || '',
      userId: submission.userId || '',
      studentName: submission.studentName || 'Student',
      notes: submission.notes || submission.answerText || '',
      externalUrl: submission.submissionUrls?.[0] || '',
    });
  },

  /**
   * Fetch upcoming live classes.
   */
  async getUpcomingClasses(): Promise<LiveClass[]> {
    try {
      return await queryCollection<LiveClass>(
        CLASSES_COLLECTION,
        where('status', 'in', ['upcoming', 'live']),
        orderBy('scheduledAt', 'asc')
      );
    } catch (err) {
      console.warn('Error fetching upcoming classes:', err);
      return [];
    }
  },

  /**
   * Fetch study materials and chapter notes.
   */
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    try {
      const list = await queryCollection<StudyMaterial>(
        STUDY_MATERIALS_COLLECTION,
        where('isPublished', '==', true)
      );
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } catch (err) {
      console.warn('Error fetching study materials, falling back:', err);
      try {
        const fallback = await queryCollection<StudyMaterial>(STUDY_MATERIALS_COLLECTION);
        return fallback
          .filter((m) => m.isPublished !== false)
          .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      } catch {
        return [];
      }
    }
  },

  /**
   * Fetch doubt queries submitted by the student.
   */
  async getStudentDoubts(userId: string): Promise<DoubtTicket[]> {
    return courseworkService.getStudentDoubts(userId);
  },

  /**
   * Submit a new academic doubt.
   */
  async submitDoubt(doubt: Omit<DoubtTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    return courseworkService.submitDoubt({
      userId: doubt.userId,
      studentName: doubt.studentName,
      studentEmail: doubt.studentEmail,
      courseId: doubt.courseId,
      courseTitle: doubt.courseTitle,
      subjectName: doubt.subjectName,
      chapterName: doubt.chapterName,
      question: doubt.question,
    });
  },

  /**
   * Fetch student's payment history.
   */
  async getStudentPayments(userId: string): Promise<Payment[]> {
    return paymentService.getStudentPayments(userId);
  },

  /**
   * Fetch student notifications via notificationService.
   */
  async getStudentNotifications(userId: string): Promise<Notification[]> {
    if (!userId) return [];
    const enrollments = await this.getStudentEnrollments(userId);
    const courseIds = enrollments.map((e) => e.courseId);
    return notificationService.getUserNotifications(userId, 'student', courseIds);
  },

  /**
   * Mark notification as read.
   */
  async markNotificationAsRead(notificationId: string, userId = 'student_123'): Promise<void> {
    return notificationService.markAsRead(notificationId, userId);
  },

  /**
   * Mark or unmark a lesson as completed for an enrolled student.
   * Updates Firestore enrollment record with new progress percentage.
   */
  async toggleLessonCompletion(
    userId: string,
    courseId: string,
    lessonId: string,
    totalCourseLessons = 10
  ): Promise<{ isCompleted: boolean; newProgress: number }> {
    if (!userId || !courseId || !lessonId) {
      return { isCompleted: false, newProgress: 0 };
    }

    try {
      const enrollments = await this.getStudentEnrollments(userId);
      const enr = enrollments.find((e) => e.courseId === courseId);

      if (!enr) {
        return { isCompleted: false, newProgress: 0 };
      }

      const existingCompleted = enr.completedLessonIds || [];
      const alreadyCompleted = existingCompleted.includes(lessonId);

      let updatedList: string[];
      if (alreadyCompleted) {
        updatedList = existingCompleted.filter((id) => id !== lessonId);
      } else {
        updatedList = [...existingCompleted, lessonId];
      }

      const effectiveTotal = Math.max(totalCourseLessons, updatedList.length, 1);
      const newProgress = Math.min(
        100,
        Math.round((updatedList.length / effectiveTotal) * 100)
      );

      await updateDocData(ENROLLMENTS_COLLECTION, enr.id, {
        completedLessonIds: updatedList,
        progressPercentage: newProgress,
        lastAccessedLessonId: lessonId,
        lastAccessedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        isCompleted: !alreadyCompleted,
        newProgress,
      };
    } catch (err) {
      console.warn('Error updating lesson completion:', err);
      return { isCompleted: false, newProgress: 0 };
    }
  },

  /**
   * Fetch study materials and chapter notes for a course.
   */
  async getCourseStudyMaterials(courseId: string): Promise<StudyMaterial[]> {
    try {
      const list = await queryCollection<StudyMaterial>(
        STUDY_MATERIALS_COLLECTION,
        where('isPublished', '==', true)
      );
      return list.filter((m) => !m.courseId || m.courseId === courseId);
    } catch (err) {
      console.warn('Error fetching course study materials:', err);
      return [];
    }
  },

  /**
   * Dynamically calculate dashboard statistics from authentic student records.
   * Zero hardcoding!
   */
  calculateDashboardStats(
    enrollments: Enrollment[],
    testAttempts: TestAttempt[],
    completedLessonIds: string[] = []
  ) {
    const enrolledCoursesCount = enrollments.length;
    const testsAttemptedCount = testAttempts.length;

    const avgScoreNumber =
      testAttempts.length > 0
        ? Math.round(
            testAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
              testAttempts.length
          )
        : 0;

    // Approximate study time: 45 mins per completed lesson + test time spent
    const totalTestMinutes = Math.round(
      testAttempts.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0) / 60
    );
    const totalLessonMinutes = completedLessonIds.length * 45;
    const totalStudyHours = ((totalLessonMinutes + totalTestMinutes) / 60).toFixed(1);

    return {
      enrolledCoursesCount,
      testsAttemptedCount,
      averageScorePercent: avgScoreNumber,
      averageScoreText: testsAttemptedCount > 0 ? `${avgScoreNumber}%` : '0%',
      studyHoursText: `${totalStudyHours} hrs`,
      completedLessonsCount: completedLessonIds.length,
    };
  },
};

export default studentService;
