import {
  getDocData,
  setDocData,
  updateDocData,
  deleteDocData,
  queryCollection,
  where,
  orderBy,
  limit,
} from '../firebase/firestore';
import type {
  UserProfile,
  Course,
  Category,
  Subject,
  Chapter,
  Lesson,
  StudyMaterial,
  Test,
  Assignment,
  Enrollment,
  Payment,
  DoubtTicket,
  Notification,
  AuditLog,
  WebsiteSettings,
} from '../types';
import { courseworkService } from './courseworkService';
import { paymentService } from './paymentService';
import { notificationService } from './notificationService';
import { cacheManager } from '../utils/cacheManager';
import { examService } from './examService';

const USERS_COLLECTION = 'users';
const COURSES_COLLECTION = 'courses';
const CATEGORIES_COLLECTION = 'categories';
const SUBJECTS_COLLECTION = 'subjects';
const CHAPTERS_COLLECTION = 'chapters';
const LESSONS_COLLECTION = 'lessons';
const STUDY_MATERIALS_COLLECTION = 'studyMaterials';
const TESTS_COLLECTION = 'tests';
const ASSIGNMENTS_COLLECTION = 'assignments';
const ENROLLMENTS_COLLECTION = 'enrollments';
const PAYMENTS_COLLECTION = 'payments';
const DOUBTS_COLLECTION = 'doubts';
const NOTIFICATIONS_COLLECTION = 'notifications';
const AUDIT_LOGS_COLLECTION = 'auditLogs';
const SETTINGS_COLLECTION = 'settings';

// In-memory study materials store for offline/demo resilience
const inMemoryStudyMaterials = new Map<string, StudyMaterial>();

export const adminService = {
  // ==============================================================
  // 17. AUDIT LOGGING
  // ==============================================================
  async logAction(
    action: string,
    targetCollection: string,
    targetId = '',
    details = '',
    adminId = 'admin_user',
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    try {
      const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const logEntry: AuditLog = {
        id,
        adminId,
        adminEmail,
        action,
        targetCollection,
        targetId,
        details,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDocData(AUDIT_LOGS_COLLECTION, id, logEntry);
    } catch (err) {
      console.warn('[adminService] Could not write audit log:', err);
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      return await queryCollection<AuditLog>(
        AUDIT_LOGS_COLLECTION,
        orderBy('timestamp', 'desc'),
        limit(50)
      );
    } catch (err) {
      console.warn('[adminService] Error fetching audit logs:', err);
      return [];
    }
  },

  // ==============================================================
  // DASHBOARD STATISTICS (Authorized live database queries)
  // ==============================================================
  async getDashboardStats() {
    return cacheManager.getOrFetch(
      'admin:dashboard:stats',
      async () => {
        try {
          const [
            students,
            teachers,
            courses,
            tests,
            enrollments,
            doubts,
            payments,
          ] = await Promise.all([
            queryCollection<UserProfile>(USERS_COLLECTION, where('role', '==', 'student')),
            queryCollection<UserProfile>(USERS_COLLECTION, where('role', '==', 'teacher')),
            queryCollection<Course>(COURSES_COLLECTION),
            queryCollection<Test>(TESTS_COLLECTION),
            queryCollection<Enrollment>(ENROLLMENTS_COLLECTION),
            queryCollection<DoubtTicket>(DOUBTS_COLLECTION),
            queryCollection<Payment>(PAYMENTS_COLLECTION),
          ]);

          const totalStudents = students.length;
          const totalTeachers = teachers.length;
          const pendingTeacherApprovals = teachers.filter(
            (t) => t.approvalStatus === 'pending'
          ).length;
          const totalCourses = courses.length;
          const publishedCourses = courses.filter((c) => c.isPublished).length;
          const activeEnrollments = enrollments.filter(
            (e) => e.status === 'active'
          ).length;
          const publishedTests = tests.filter((t) => t.isPublished).length;
          const pendingDoubts = doubts.filter((d) => d.status === 'pending').length;
          const verifiedPayments = payments.filter((p) => p.status === 'success');
          const totalRevenue = verifiedPayments.reduce(
            (sum, p) => sum + (p.amount || 0),
            0
          );

          return {
            totalStudents,
            totalTeachers,
            pendingTeacherApprovals,
            totalCourses,
            publishedCourses,
            activeEnrollments,
            publishedTests,
            pendingDoubts,
            verifiedPaymentsCount: verifiedPayments.length,
            totalRevenue,
          };
        } catch (err) {
          console.warn('[adminService] Error aggregating dashboard stats:', err);
          return {
            totalStudents: 0,
            totalTeachers: 0,
            pendingTeacherApprovals: 0,
            totalCourses: 0,
            publishedCourses: 0,
            activeEnrollments: 0,
            publishedTests: 0,
            pendingDoubts: 0,
            verifiedPaymentsCount: 0,
            totalRevenue: 0,
          };
        }
      },
      2 * 60 * 1000 // 2 minutes TTL
    );
  },

  // ==============================================================
  // 1. STUDENT MANAGEMENT
  // ==============================================================
  async getStudents(): Promise<UserProfile[]> {
    try {
      return await queryCollection<UserProfile>(
        USERS_COLLECTION,
        where('role', '==', 'student'),
        orderBy('createdAt', 'desc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching students:', err);
      return [];
    }
  },

  async updateStudent(
    studentId: string,
    updates: Partial<UserProfile>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(USERS_COLLECTION, studentId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await this.logAction(
      'UPDATE_STUDENT',
      USERS_COLLECTION,
      studentId,
      JSON.stringify(updates),
      'admin',
      adminEmail
    );
  },

  async deleteStudent(
    studentId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(USERS_COLLECTION, studentId);
    await this.logAction(
      'DELETE_STUDENT',
      USERS_COLLECTION,
      studentId,
      `Removed student record ${studentId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 2. TEACHER MANAGEMENT
  // ==============================================================
  async getTeachers(): Promise<UserProfile[]> {
    try {
      return await queryCollection<UserProfile>(
        USERS_COLLECTION,
        where('role', '==', 'teacher'),
        orderBy('createdAt', 'desc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching teachers:', err);
      return [];
    }
  },

  async approveTeacher(
    teacherId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(USERS_COLLECTION, teacherId, {
      approvalStatus: 'approved',
      updatedAt: new Date().toISOString(),
    });
    await this.logAction(
      'APPROVE_TEACHER',
      USERS_COLLECTION,
      teacherId,
      'Approved teacher credentials',
      'admin',
      adminEmail
    );
  },

  async rejectTeacher(
    teacherId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(USERS_COLLECTION, teacherId, {
      approvalStatus: 'rejected',
      updatedAt: new Date().toISOString(),
    });
    await this.logAction(
      'REJECT_TEACHER',
      USERS_COLLECTION,
      teacherId,
      'Rejected teacher application',
      'admin',
      adminEmail
    );
  },

  async assignTeacherToCourse(
    teacherId: string,
    teacherName: string,
    courseId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(COURSES_COLLECTION, courseId, {
      instructorId: teacherId,
      instructorName: teacherName,
      updatedAt: new Date().toISOString(),
    });
    await this.logAction(
      'ASSIGN_TEACHER_COURSE',
      COURSES_COLLECTION,
      courseId,
      `Assigned instructor ${teacherName} (${teacherId}) to course ${courseId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 3. COURSE MANAGEMENT
  // ==============================================================
  async getCourses(): Promise<Course[]> {
    try {
      return await queryCollection<Course>(
        COURSES_COLLECTION,
        orderBy('createdAt', 'desc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching courses:', err);
      return [];
    }
  },

  async createCourse(
    course: Partial<Course>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = course.id || `course_${Date.now()}`;
    const newCourse: Partial<Course> = {
      id,
      slug: course.slug || id,
      title: course.title || 'Untitled Course',
      description: course.description || '',
      price: course.price || 0,
      isFree: course.isFree ?? false,
      isPublished: course.isPublished ?? false,
      enrolledStudentsCount: 0,
      totalLessons: course.totalLessons || 0,
      totalChapters: course.totalChapters || 0,
      durationHours: course.durationHours || 10,
      averageRating: 5.0,
      totalReviews: 0,
      tags: course.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...course,
    };
    await setDocData(COURSES_COLLECTION, id, newCourse);
    cacheManager.invalidate('courses:all');
    cacheManager.invalidate('courses:published:all');
    cacheManager.invalidateByPrefix('courses');
    await this.logAction(
      'CREATE_COURSE',
      COURSES_COLLECTION,
      id,
      `Created course "${newCourse.title}"`,
      'admin',
      adminEmail
    );
    return id;
  },

  async updateCourse(
    courseId: string,
    updates: Partial<Course>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(COURSES_COLLECTION, courseId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate('courses:all');
    cacheManager.invalidate('courses:published:all');
    cacheManager.invalidateByPrefix('courses');
    await this.logAction(
      'UPDATE_COURSE',
      COURSES_COLLECTION,
      courseId,
      `Updated course ${courseId}`,
      'admin',
      adminEmail
    );
  },

  async toggleCoursePublish(
    courseId: string,
    isPublished: boolean,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(COURSES_COLLECTION, courseId, {
      isPublished,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate('courses:all');
    cacheManager.invalidate('courses:published:all');
    cacheManager.invalidateByPrefix('courses');
    await this.logAction(
      isPublished ? 'PUBLISH_COURSE' : 'UNPUBLISH_COURSE',
      COURSES_COLLECTION,
      courseId,
      `Set isPublished = ${isPublished}`,
      'admin',
      adminEmail
    );
  },

  async saveCourse(course: Course, adminEmail = 'admin@brainstorm.edu'): Promise<void> {
    try {
      const existing = await getDocData<Course>(COURSES_COLLECTION, course.id);
      if (existing) {
        await this.updateCourse(course.id, course, adminEmail);
      } else {
        await this.createCourse(course, adminEmail);
      }
    } catch {
      await setDocData(COURSES_COLLECTION, course.id, course);
    }
    cacheManager.invalidate('courses:all');
    cacheManager.invalidate('courses:published:all');
    cacheManager.invalidateByPrefix('courses');
  },

  async deleteCourse(
    courseId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(COURSES_COLLECTION, courseId);
    cacheManager.invalidate('courses:all');
    cacheManager.invalidate('courses:published:all');
    cacheManager.invalidateByPrefix('courses');
    await this.logAction(
      'DELETE_COURSE',
      COURSES_COLLECTION,
      courseId,
      `Deleted course ${courseId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 4. CATEGORY MANAGEMENT
  // ==============================================================
  async getCategories(): Promise<Category[]> {
    try {
      return await queryCollection<Category>(
        CATEGORIES_COLLECTION,
        orderBy('name', 'asc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching categories:', err);
      return [];
    }
  },

  async createCategory(
    data: Partial<Category>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `cat_${Date.now()}`;
    const newCat: Partial<Category> = {
      id,
      name: data.name || 'New Category',
      slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || id,
      description: data.description || '',
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDocData(CATEGORIES_COLLECTION, id, newCat);
    await this.logAction(
      'CREATE_CATEGORY',
      CATEGORIES_COLLECTION,
      id,
      `Created category ${newCat.name}`,
      'admin',
      adminEmail
    );
    return id;
  },

  async deleteCategory(
    categoryId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(CATEGORIES_COLLECTION, categoryId);
    await this.logAction(
      'DELETE_CATEGORY',
      CATEGORIES_COLLECTION,
      categoryId,
      `Deleted category ${categoryId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 5. SUBJECT MANAGEMENT
  // ==============================================================
  async getSubjects(): Promise<Subject[]> {
    try {
      return await queryCollection<Subject>(
        SUBJECTS_COLLECTION,
        orderBy('name', 'asc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching subjects:', err);
      return [];
    }
  },

  async createSubject(
    data: Partial<Subject>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `subj_${Date.now()}`;
    const newSubj: Partial<Subject> = {
      id,
      name: data.name || 'New Subject',
      categoryId: data.categoryId || 'school',
      classGrade: data.classGrade || 'Class 10',
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDocData(SUBJECTS_COLLECTION, id, newSubj);
    await this.logAction(
      'CREATE_SUBJECT',
      SUBJECTS_COLLECTION,
      id,
      `Created subject ${newSubj.name}`,
      'admin',
      adminEmail
    );
    return id;
  },

  async deleteSubject(
    subjectId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(SUBJECTS_COLLECTION, subjectId);
    await this.logAction(
      'DELETE_SUBJECT',
      SUBJECTS_COLLECTION,
      subjectId,
      `Deleted subject ${subjectId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 6. CHAPTER MANAGEMENT
  // ==============================================================
  async getChapters(courseId?: string): Promise<Chapter[]> {
    try {
      if (courseId) {
        return await queryCollection<Chapter>(
          CHAPTERS_COLLECTION,
          where('courseId', '==', courseId),
          orderBy('order', 'asc')
        );
      }
      return await queryCollection<Chapter>(
        CHAPTERS_COLLECTION,
        orderBy('title', 'asc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching chapters:', err);
      return [];
    }
  },

  async createChapter(
    data: Partial<Chapter>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `chap_${Date.now()}`;
    const newChap: Partial<Chapter> = {
      id,
      title: data.title || 'Chapter Title',
      courseId: data.courseId || '',
      description: data.description || '',
      order: data.order || 1,
      totalLessons: data.totalLessons || 0,
      isPublished: data.isPublished ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDocData(CHAPTERS_COLLECTION, id, newChap);
    await this.logAction(
      'CREATE_CHAPTER',
      CHAPTERS_COLLECTION,
      id,
      `Created chapter "${newChap.title}"`,
      'admin',
      adminEmail
    );
    return id;
  },

  async deleteChapter(
    chapterId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(CHAPTERS_COLLECTION, chapterId);
    await this.logAction(
      'DELETE_CHAPTER',
      CHAPTERS_COLLECTION,
      chapterId,
      `Deleted chapter ${chapterId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 7. LESSON MANAGEMENT
  // ==============================================================
  async getLessons(chapterId?: string): Promise<Lesson[]> {
    const cacheKey = chapterId ? `lessons:chapter:${chapterId}` : 'lessons:all';
    return cacheManager.getOrFetch(
      cacheKey,
      async () => {
        try {
          if (chapterId) {
            return await queryCollection<Lesson>(
              LESSONS_COLLECTION,
              where('chapterId', '==', chapterId),
              orderBy('order', 'asc')
            );
          }
          return await queryCollection<Lesson>(
            LESSONS_COLLECTION,
            orderBy('title', 'asc')
          );
        } catch (err) {
          console.warn('[adminService] Error fetching lessons:', err);
          return [];
        }
      },
      3 * 60 * 1000
    );
  },

  async createLesson(
    data: Partial<Lesson>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `less_${Date.now()}`;
    const newLesson: Partial<Lesson> = {
      id,
      title: data.title || 'Lesson Title',
      chapterId: data.chapterId || '',
      courseId: data.courseId || '',
      type: data.type || 'video',
      durationMinutes: data.durationMinutes || 30,
      order: data.order || 1,
      videoUrl: data.videoUrl || '',
      isFreePreview: data.isFreePreview ?? false,
      isPublished: data.isPublished ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDocData(LESSONS_COLLECTION, id, newLesson);
    cacheManager.invalidate('lessons:all');
    cacheManager.invalidateByPrefix('lessons');
    cacheManager.invalidateByPrefix('courses:lessons');

    // Increment course totalLessons count if courseId exists
    if (newLesson.courseId) {
      try {
        const crs = await getDocData<Course>(COURSES_COLLECTION, newLesson.courseId);
        if (crs) {
          await updateDocData(COURSES_COLLECTION, newLesson.courseId, {
            totalLessons: (crs.totalLessons || 0) + 1,
            updatedAt: new Date().toISOString(),
          });
          cacheManager.invalidate('courses:all');
          cacheManager.invalidateByPrefix('courses');
        }
      } catch (e) {
        // non-blocking
      }
    }

    await this.logAction(
      'CREATE_LESSON',
      LESSONS_COLLECTION,
      id,
      `Created lesson "${newLesson.title}"`,
      'admin',
      adminEmail
    );
    return id;
  },

  async updateLesson(
    lessonId: string,
    updates: Partial<Lesson>,
    userEmail = 'teacher@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(LESSONS_COLLECTION, lessonId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate(/lessons/);
    await this.logAction(
      'UPDATE_LESSON',
      LESSONS_COLLECTION,
      lessonId,
      `Updated lesson ${lessonId}`,
      'teacher',
      userEmail
    );
  },

  async toggleLessonPublishStatus(
    lessonId: string,
    currentStatus: boolean,
    userEmail = 'staff@brainstorm.edu'
  ): Promise<boolean> {
    const newStatus = !currentStatus;
    await updateDocData(LESSONS_COLLECTION, lessonId, {
      isPublished: newStatus,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate(/lessons/);
    await this.logAction(
      'TOGGLE_LESSON_PUBLISH',
      LESSONS_COLLECTION,
      lessonId,
      `Toggled publish status to ${newStatus}`,
      'staff',
      userEmail
    );
    return newStatus;
  },

  async deleteLesson(
    lessonId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(LESSONS_COLLECTION, lessonId);
    cacheManager.invalidate(/lessons/);
    await this.logAction(
      'DELETE_LESSON',
      LESSONS_COLLECTION,
      lessonId,
      `Deleted lesson ${lessonId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 8. STUDY MATERIAL MANAGEMENT
  // ==============================================================
  async getStudyMaterials(): Promise<StudyMaterial[]> {
    return cacheManager.getOrFetch(
      'materials:all',
      async () => {
        const materialsMap = new Map<string, StudyMaterial>();
        inMemoryStudyMaterials.forEach((m) => materialsMap.set(m.id, m));

        try {
          const list = await queryCollection<StudyMaterial>(
            STUDY_MATERIALS_COLLECTION,
            orderBy('createdAt', 'desc')
          );
          list.forEach((m) => {
            materialsMap.set(m.id, m);
            inMemoryStudyMaterials.set(m.id, m);
          });
        } catch (err) {
          console.warn('[adminService] Error fetching study materials from Firestore:', err);
        }

        return Array.from(materialsMap.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
      },
      3 * 60 * 1000
    );
  },

  async createStudyMaterial(
    data: Partial<StudyMaterial>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `mat_${Date.now()}`;
    const newMat: StudyMaterial = {
      id,
      title: data.title || 'Study Material Title',
      subjectName: data.subjectName || 'General',
      classGrade: data.classGrade || 'Class 10',
      teacherId: data.teacherId || data.instructorId || adminEmail,
      fileUrl: data.fileUrl || '',
      fileType: data.fileType || 'pdf',
      fileSizeMb: data.fileSizeMb || 1.5,
      isPublished: data.isPublished ?? true,
      isDownloadable: data.isDownloadable ?? true,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    } as StudyMaterial;

    inMemoryStudyMaterials.set(id, newMat);

    try {
      await setDocData(STUDY_MATERIALS_COLLECTION, id, newMat);
    } catch (err) {
      console.warn('[adminService] Firestore create study material fallback to memory:', err);
    }

    cacheManager.invalidate('materials:all');
    cacheManager.invalidateByPrefix('materials');

    try {
      await this.logAction(
        'CREATE_STUDY_MATERIAL',
        STUDY_MATERIALS_COLLECTION,
        id,
        `Created study material "${newMat.title}"`,
        'admin',
        adminEmail
      );
    } catch {
      // ignore
    }

    return id;
  },

  async updateStudyMaterial(
    materialId: string,
    updates: Partial<StudyMaterial>,
    userEmail = 'staff@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(STUDY_MATERIALS_COLLECTION, materialId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate('materials:all');
    await this.logAction(
      'UPDATE_STUDY_MATERIAL',
      STUDY_MATERIALS_COLLECTION,
      materialId,
      `Updated study material ${materialId}`,
      'staff',
      userEmail
    );
  },

  async toggleMaterialPublishStatus(
    materialId: string,
    currentStatus: boolean,
    userEmail = 'staff@brainstorm.edu'
  ): Promise<boolean> {
    const newStatus = !currentStatus;
    await updateDocData(STUDY_MATERIALS_COLLECTION, materialId, {
      isPublished: newStatus,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate('materials:all');
    await this.logAction(
      'TOGGLE_MATERIAL_PUBLISH',
      STUDY_MATERIALS_COLLECTION,
      materialId,
      `Toggled study material publish status to ${newStatus}`,
      'staff',
      userEmail
    );
    return newStatus;
  },

  async deleteStudyMaterial(
    materialId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(STUDY_MATERIALS_COLLECTION, materialId);
    cacheManager.invalidate('materials:all');
    await this.logAction(
      'DELETE_STUDY_MATERIAL',
      STUDY_MATERIALS_COLLECTION,
      materialId,
      `Deleted study material ${materialId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 9. TEST MANAGEMENT
  // ==============================================================
  async getTests(): Promise<Test[]> {
    return cacheManager.getOrFetch(
      'tests:all',
      async () => {
        try {
          return await queryCollection<Test>(
            TESTS_COLLECTION,
            orderBy('createdAt', 'desc')
          );
        } catch (err) {
          console.warn('[adminService] Error fetching tests:', err);
          return [];
        }
      },
      3 * 60 * 1000
    );
  },

  async createTest(
    data: Partial<Test>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `test_${Date.now()}`;
    const newTest: Partial<Test> = {
      id,
      title: data.title || 'Mock Test Title',
      durationMinutes: data.durationMinutes || 60,
      totalMarks: data.totalMarks || 100,
      passingMarks: data.passingMarks || 40,
      questionsCount: data.questionsCount || 25,
      isPublished: data.isPublished ?? true,
      targetCategory: data.targetCategory || 'Practice Quiz',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDocData(TESTS_COLLECTION, id, newTest);
    cacheManager.invalidate('tests:all');
    cacheManager.invalidate('tests:published');
    cacheManager.invalidateByPrefix('tests');
    await this.logAction(
      'CREATE_TEST',
      TESTS_COLLECTION,
      id,
      `Created test "${newTest.title}"`,
      'admin',
      adminEmail
    );
    return id;
  },

  async toggleTestPublish(
    testId: string,
    isPublished: boolean,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(TESTS_COLLECTION, testId, {
      isPublished,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate('tests:all');
    cacheManager.invalidate('tests:published');
    cacheManager.invalidateByPrefix('tests');
    await this.logAction(
      isPublished ? 'PUBLISH_TEST' : 'UNPUBLISH_TEST',
      TESTS_COLLECTION,
      testId,
      `Set isPublished = ${isPublished}`,
      'admin',
      adminEmail
    );
  },

  async deleteTest(
    testId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(TESTS_COLLECTION, testId);
    cacheManager.invalidate('tests:all');
    cacheManager.invalidate('tests:published');
    cacheManager.invalidateByPrefix('tests');
    await this.logAction(
      'DELETE_TEST',
      TESTS_COLLECTION,
      testId,
      `Deleted test ${testId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 10. ASSIGNMENT MANAGEMENT
  // ==============================================================
  async getAssignments(): Promise<Assignment[]> {
    try {
      return await queryCollection<Assignment>(
        ASSIGNMENTS_COLLECTION,
        orderBy('createdAt', 'desc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching assignments:', err);
      return [];
    }
  },

  async createAssignment(
    data: Partial<Assignment>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `assign_${Date.now()}`;
    const newAssign: Partial<Assignment> = {
      id,
      title: data.title || 'Coursework Assignment',
      instructions: data.instructions || '',
      dueDate: data.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      totalMarks: data.totalMarks || 50,
      isPublished: data.isPublished ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDocData(ASSIGNMENTS_COLLECTION, id, newAssign);
    await this.logAction(
      'CREATE_ASSIGNMENT',
      ASSIGNMENTS_COLLECTION,
      id,
      `Created assignment "${newAssign.title}"`,
      'admin',
      adminEmail
    );
    return id;
  },

  async deleteAssignment(
    assignmentId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(ASSIGNMENTS_COLLECTION, assignmentId);
    await this.logAction(
      'DELETE_ASSIGNMENT',
      ASSIGNMENTS_COLLECTION,
      assignmentId,
      `Deleted assignment ${assignmentId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 11. ENROLLMENT MANAGEMENT
  // ==============================================================
  async getEnrollments(): Promise<Enrollment[]> {
    try {
      return await queryCollection<Enrollment>(
        ENROLLMENTS_COLLECTION,
        orderBy('enrolledAt', 'desc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching enrollments:', err);
      return [];
    }
  },

  async createEnrollment(
    data: Partial<Enrollment>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<string> {
    const id = data.id || `enr_${Date.now()}`;
    const newEnr: Partial<Enrollment> = {
      id,
      userId: data.userId || '',
      courseId: data.courseId || '',
      courseTitle: data.courseTitle || 'Enrolled Course',
      enrolledAt: new Date().toISOString(),
      status: 'active',
      progressPercentage: 0,
      completedLessonIds: [],
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data,
    };
    await setDocData(ENROLLMENTS_COLLECTION, id, newEnr);
    await this.logAction(
      'CREATE_ENROLLMENT',
      ENROLLMENTS_COLLECTION,
      id,
      `Enrolled user ${newEnr.userId} in course ${newEnr.courseTitle}`,
      'admin',
      adminEmail
    );
    return id;
  },

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: 'active' | 'completed' | 'expired' | 'cancelled',
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(ENROLLMENTS_COLLECTION, enrollmentId, {
      status,
      updatedAt: new Date().toISOString(),
    });
    await this.logAction(
      'UPDATE_ENROLLMENT_STATUS',
      ENROLLMENTS_COLLECTION,
      enrollmentId,
      `Set status to ${status}`,
      'admin',
      adminEmail
    );
  },

  async deleteEnrollment(
    enrollmentId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await deleteDocData(ENROLLMENTS_COLLECTION, enrollmentId);
    await this.logAction(
      'DELETE_ENROLLMENT',
      ENROLLMENTS_COLLECTION,
      enrollmentId,
      `Removed enrollment ${enrollmentId}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 12. PAYMENT MANAGEMENT
  // ==============================================================
  async getPayments(): Promise<Payment[]> {
    return paymentService.getAllPayments();
  },

  async verifyPayment(
    paymentId: string,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    const payment = await getDocData<Payment>(PAYMENTS_COLLECTION, paymentId);
    if (payment) {
      const now = new Date().toISOString();
      await updateDocData(PAYMENTS_COLLECTION, paymentId, {
        status: 'success',
        paidAt: now,
        updatedAt: now,
      });
      // Activate student enrollment atomically
      const enrollmentId = `enr_${payment.userId}_${payment.courseId}`;
      await setDocData(
        ENROLLMENTS_COLLECTION,
        enrollmentId,
        {
          id: enrollmentId,
          userId: payment.userId,
          courseId: payment.courseId,
          courseTitle: payment.courseTitle,
          enrolledAt: now,
          status: 'active',
          progressPercentage: 0,
          completedLessonIds: [],
          lastAccessedAt: now,
        },
        true
      );
    }
    await this.logAction(
      'VERIFY_PAYMENT',
      PAYMENTS_COLLECTION,
      paymentId,
      `Verified payment and activated enrollment for ${paymentId}`,
      'admin',
      adminEmail
    );
  },

  async refundPayment(
    paymentId: string,
    adminEmail = 'admin@brainstorm.edu',
    reason = 'Admin processed refund'
  ): Promise<void> {
    await paymentService.processRefund(paymentId, adminEmail, reason);
    await this.logAction(
      'REFUND_PAYMENT',
      PAYMENTS_COLLECTION,
      paymentId,
      `Processed refund for payment ${paymentId}: ${reason}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 13. NOTIFICATION MANAGEMENT (Announcements)
  // ==============================================================
  async getBroadcastNotifications(): Promise<Notification[]> {
    return notificationService.getUserNotifications('broadcast-all', 'admin');
  },

  async publishAnnouncement(
    title: string,
    body: string,
    targetRole: 'all' | 'student' | 'teacher' = 'all',
    adminEmail = 'admin@brainstorm.edu',
    courseId?: string,
    courseTitle?: string,
    priority: 'normal' | 'high' = 'normal'
  ): Promise<string> {
    const notif = await notificationService.createNotification({
      targetRole,
      courseId,
      courseTitle,
      title,
      body,
      type: 'announcement',
      priority,
      senderRole: 'admin',
      senderName: 'Academic Directorate',
      actionUrl: courseId ? `/dashboard/student/classroom/${courseId}` : undefined,
    });

    await this.logAction(
      'PUBLISH_ANNOUNCEMENT',
      NOTIFICATIONS_COLLECTION,
      notif.id,
      `Broadcasted announcement "${title}" (target: ${courseId ? `Course ${courseTitle}` : targetRole})`,
      'admin',
      adminEmail
    );
    return notif.id;
  },

  // ==============================================================
  // 14. DOUBT MANAGEMENT
  // ==============================================================
  async getDoubts(): Promise<DoubtTicket[]> {
    try {
      return await queryCollection<DoubtTicket>(
        DOUBTS_COLLECTION,
        orderBy('createdAt', 'desc')
      );
    } catch (err) {
      console.warn('[adminService] Error fetching doubts:', err);
      return [];
    }
  },

  async replyToDoubt(
    doubtId: string,
    replyText: string,
    repliedByName = 'Faculty Admin',
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await updateDocData(DOUBTS_COLLECTION, doubtId, {
      facultyReply: replyText,
      repliedByName,
      repliedAt: new Date().toISOString(),
      status: 'resolved',
      updatedAt: new Date().toISOString(),
    });
    await this.logAction(
      'RESOLVE_DOUBT',
      DOUBTS_COLLECTION,
      doubtId,
      `Provided solution to doubt ${doubtId}`,
      'admin',
      adminEmail
    );
  },

  async updateDoubtStatus(
    doubtId: string,
    status: string,
    replyText?: string,
    repliedByName = 'Faculty Admin',
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    const updateData: Record<string, any> = {
      status: status === 'answered' ? 'resolved' : status,
      updatedAt: new Date().toISOString(),
    };
    if (replyText) {
      updateData.facultyReply = replyText;
      updateData.repliedByName = repliedByName;
      updateData.repliedAt = new Date().toISOString();
    }
    await updateDocData(DOUBTS_COLLECTION, doubtId, updateData);
    await this.logAction(
      'UPDATE_DOUBT_STATUS',
      DOUBTS_COLLECTION,
      doubtId,
      `Updated doubt ${doubtId} status to ${status}`,
      'faculty',
      adminEmail
    );
  },

  async deleteDoubt(doubtId: string, adminEmail = 'admin@brainstorm.edu'): Promise<void> {
    await deleteDocData(DOUBTS_COLLECTION, doubtId);
    await this.logAction(
      'DELETE_DOUBT',
      DOUBTS_COLLECTION,
      doubtId,
      `Deleted inappropriate doubt ${doubtId}`,
      'admin',
      adminEmail
    );
  },

  async flagDoubt(doubtId: string, reason: string, adminEmail = 'admin@brainstorm.edu'): Promise<void> {
    await updateDocData(DOUBTS_COLLECTION, doubtId, {
      isFlagged: true,
      flagReason: reason,
      updatedAt: new Date().toISOString(),
    });
    await this.logAction(
      'FLAG_DOUBT',
      DOUBTS_COLLECTION,
      doubtId,
      `Flagged doubt ${doubtId}: ${reason}`,
      'admin',
      adminEmail
    );
  },

  // ==============================================================
  // 15. REPORTS
  // ==============================================================
  async getReportsData() {
    try {
      const [courses, enrollments, payments, tests] = await Promise.all([
        this.getCourses(),
        this.getEnrollments(),
        this.getPayments(),
        this.getTests(),
      ]);

      const courseEnrollmentMap = new Map<string, number>();
      enrollments.forEach((e) => {
        const title = e.courseTitle || 'General';
        courseEnrollmentMap.set(
          title,
          (courseEnrollmentMap.get(title) || 0) + 1
        );
      });

      const enrollmentsByCourse = Array.from(courseEnrollmentMap.entries()).map(
        ([name, count]) => ({ name, count })
      );

      const verifiedRevenue = payments
        .filter((p) => p.status === 'success')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        totalCourses: courses.length,
        totalEnrollments: enrollments.length,
        totalTests: tests.length,
        verifiedRevenue,
        enrollmentsByCourse,
      };
    } catch (err) {
      console.warn('[adminService] Error generating reports data:', err);
      return {
        totalCourses: 0,
        totalEnrollments: 0,
        totalTests: 0,
        verifiedRevenue: 0,
        enrollmentsByCourse: [],
      };
    }
  },

  // ==============================================================
  // 16. WEBSITE SETTINGS
  // ==============================================================
  async getWebsiteSettings(): Promise<WebsiteSettings> {
    try {
      const settings = await getDocData<WebsiteSettings>(
        SETTINGS_COLLECTION,
        'general'
      );
      if (settings) return settings;

      // Default baseline settings
      return {
        id: 'general',
        siteTitle: 'Brainstorm Academy',
        tagline: 'Learn Today. Lead Tomorrow.',
        contactEmail: 'contact@brainstormacademy.in',
        contactPhone: '+91 98765 43210',
        maintenanceMode: false,
        registrationOpen: true,
        allowTeacherRegistration: true,
        featuredNotice: 'Admissions Open for CBSE Boards & BPSC batches.',
      };
    } catch (err) {
      console.warn('[adminService] Error fetching website settings:', err);
      return {
        id: 'general',
        siteTitle: 'Brainstorm Academy',
        tagline: 'Learn Today. Lead Tomorrow.',
        contactEmail: 'contact@brainstormacademy.in',
        contactPhone: '+91 98765 43210',
        maintenanceMode: false,
        registrationOpen: true,
        allowTeacherRegistration: true,
      };
    }
  },

  async updateWebsiteSettings(
    updates: Partial<WebsiteSettings>,
    adminEmail = 'admin@brainstorm.edu'
  ): Promise<void> {
    await setDocData(SETTINGS_COLLECTION, 'general', {
      ...updates,
      updatedAt: new Date().toISOString(),
    }, true);
    await this.logAction(
      'UPDATE_SETTINGS',
      SETTINGS_COLLECTION,
      'general',
      JSON.stringify(updates),
      'admin',
      adminEmail
    );
  },
};

export default adminService;
