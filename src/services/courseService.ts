import {
  getDocData,
  setDocData,
  queryCollection,
  where,
  orderBy,
} from '../firebase/firestore';
import type {
  Category,
  Course,
  Subject,
  Chapter,
  Lesson,
  StudyMaterial,
  Test,
  Assignment,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_COURSES,
  INITIAL_CHAPTERS,
  INITIAL_LESSONS,
} from './courseCatalogSeed';

import { cacheManager } from '../utils/cacheManager';

const CATEGORIES_COLLECTION = 'categories';
const COURSES_COLLECTION = 'courses';
const SUBJECTS_COLLECTION = 'subjects';
const CHAPTERS_COLLECTION = 'chapters';
const LESSONS_COLLECTION = 'lessons';
const STUDY_MATERIALS_COLLECTION = 'studyMaterials';
const TESTS_COLLECTION = 'tests';
const ASSIGNMENTS_COLLECTION = 'assignments';

let catalogInitialized = false;

export const courseService = {
  /**
   * Initializes baseline categories and courses in Firestore if empty.
   */
  async ensureCatalogSeeded(): Promise<void> {
    if (catalogInitialized) return;
    try {
      const existingCats = await queryCollection<Category>(CATEGORIES_COLLECTION);
      if (existingCats.length === 0) {
        console.log('[courseService] Seeding initial categories into Firestore...');
        for (const cat of INITIAL_CATEGORIES) {
          await setDocData(CATEGORIES_COLLECTION, cat.id, {
            ...cat,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const existingCourses = await queryCollection<Course>(COURSES_COLLECTION);
      if (existingCourses.length === 0) {
        console.log('[courseService] Seeding initial courses into Firestore...');
        for (const course of INITIAL_COURSES) {
          await setDocData(COURSES_COLLECTION, course.id, {
            ...course,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        for (const chap of INITIAL_CHAPTERS) {
          await setDocData(CHAPTERS_COLLECTION, chap.id, {
            ...chap,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        for (const less of INITIAL_LESSONS) {
          await setDocData(LESSONS_COLLECTION, less.id, {
            ...less,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      catalogInitialized = true;
    } catch (err) {
      // Mark initialized to prevent repeating seed check across 10k concurrent requests
      catalogInitialized = true;
    }
  },

  /**
   * Fetch all categories dynamically from Firestore.
   * Any new category added by the Admin appears here immediately.
   * Cached for 10 minutes with in-flight deduplication.
   */
  async getCategories(): Promise<Category[]> {
    return cacheManager.getOrFetch(
      'categories:all',
      async () => {
        await this.ensureCatalogSeeded();
        try {
          const list = await queryCollection<Category>(
            CATEGORIES_COLLECTION,
            orderBy('name', 'asc')
          );
          if (list.length > 0) return list;
          return INITIAL_CATEGORIES;
        } catch (err) {
          console.warn('[courseService] Error fetching categories:', err);
          return INITIAL_CATEGORIES;
        }
      },
      10 * 60 * 1000 // 10 minutes TTL
    );
  },

  /**
   * Fetch a single course by its ID from Firestore.
   * Cached for 5 minutes with in-flight deduplication.
   */
  async getCourseById(courseId: string): Promise<Course | null> {
    return cacheManager.getOrFetch(
      `courses:id:${courseId}`,
      async () => {
        await this.ensureCatalogSeeded();
        try {
          const course = await getDocData<Course>(COURSES_COLLECTION, courseId);
          if (course) return course;
          return INITIAL_COURSES.find((c) => c.id === courseId) || null;
        } catch (err) {
          console.warn('[courseService] Error fetching course by ID:', err);
          return INITIAL_COURSES.find((c) => c.id === courseId) || null;
        }
      },
      5 * 60 * 1000
    );
  },

  /**
   * Fetch all published courses from Firestore.
   * Only published courses appear in public discovery.
   * Cached for 5 minutes with in-flight deduplication.
   */
  async getAllPublishedCourses(): Promise<Course[]> {
    return cacheManager.getOrFetch(
      'courses:published:all',
      async () => {
        await this.ensureCatalogSeeded();
        try {
          const courses = await queryCollection<Course>(
            COURSES_COLLECTION,
            where('isPublished', '==', true)
          );
          if (courses.length > 0) return courses;
          return INITIAL_COURSES.filter((c) => c.isPublished);
        } catch (err) {
          console.warn('[courseService] Error fetching published courses:', err);
          return INITIAL_COURSES.filter((c) => c.isPublished);
        }
      },
      5 * 60 * 1000
    );
  },

  /**
   * Fetch all courses (both published and draft) for administration and faculty.
   * Cached for 3 minutes with in-flight deduplication and SWR background revalidation.
   */
  async getAllCourses(): Promise<Course[]> {
    return cacheManager.getOrFetch(
      'courses:all',
      async () => {
        await this.ensureCatalogSeeded();
        try {
          const courses = await queryCollection<Course>(COURSES_COLLECTION);
          if (courses.length > 0) return courses;
          return INITIAL_COURSES;
        } catch (err) {
          console.warn('[courseService] Error fetching all courses:', err);
          return INITIAL_COURSES;
        }
      },
      3 * 60 * 1000
    );
  },

  /**
   * Fetch published courses belonging to a specific category.
   */
  async getCoursesByCategory(categoryId: string): Promise<Course[]> {
    await this.ensureCatalogSeeded();
    try {
      const courses = await queryCollection<Course>(
        COURSES_COLLECTION,
        where('categoryId', '==', categoryId),
        where('isPublished', '==', true)
      );
      if (courses.length > 0) return courses;
      return INITIAL_COURSES.filter(
        (c) => c.categoryId === categoryId && c.isPublished
      );
    } catch (err) {
      console.warn('[courseService] Error fetching courses by category:', err);
      return INITIAL_COURSES.filter(
        (c) => c.categoryId === categoryId && c.isPublished
      );
    }
  },

  /**
   * Fetch published courses for a specific school class grade (e.g., 'Class 10').
   */
  async getCoursesByClass(classGrade: string): Promise<Course[]> {
    await this.ensureCatalogSeeded();
    try {
      const courses = await queryCollection<Course>(
        COURSES_COLLECTION,
        where('classGrade', '==', classGrade),
        where('isPublished', '==', true)
      );
      if (courses.length > 0) return courses;
      return INITIAL_COURSES.filter(
        (c) => c.classGrade === classGrade && c.isPublished
      );
    } catch (err) {
      console.warn('[courseService] Error fetching courses by class:', err);
      return INITIAL_COURSES.filter(
        (c) => c.classGrade === classGrade && c.isPublished
      );
    }
  },

  /**
   * Fetch published courses for a specific competitive or entrance exam.
   */
  async getCoursesByExam(targetExam: string): Promise<Course[]> {
    await this.ensureCatalogSeeded();
    try {
      const courses = await queryCollection<Course>(
        COURSES_COLLECTION,
        where('targetExam', '==', targetExam),
        where('isPublished', '==', true)
      );
      if (courses.length > 0) return courses;
      return INITIAL_COURSES.filter(
        (c) => c.targetExam === targetExam && c.isPublished
      );
    } catch (err) {
      console.warn('[courseService] Error fetching courses by exam:', err);
      return INITIAL_COURSES.filter(
        (c) => c.targetExam === targetExam && c.isPublished
      );
    }
  },

  /**
   * Fetch the complete pedagogical hierarchy for a Course:
   * Course -> Subjects -> Chapters -> Lessons, Notes, Tests, Assignments
   * Cached for 5 minutes with in-flight coalescing.
   */
  async getCourseHierarchy(courseId: string) {
    return cacheManager.getOrFetch(
      `course:hierarchy:${courseId}`,
      async () => {
        await this.ensureCatalogSeeded();
        try {
          const [course, subjects, chapters, lessons, materials, tests, assignments] =
            await Promise.all([
              this.getCourseById(courseId),
              queryCollection<Subject>(
                SUBJECTS_COLLECTION,
                where('courseId', '==', courseId)
              ),
              queryCollection<Chapter>(
                CHAPTERS_COLLECTION,
                where('courseId', '==', courseId),
                orderBy('order', 'asc')
              ),
              queryCollection<Lesson>(
                LESSONS_COLLECTION,
                where('courseId', '==', courseId),
                orderBy('order', 'asc')
              ),
              queryCollection<StudyMaterial>(
                STUDY_MATERIALS_COLLECTION,
                where('isPublished', '==', true)
              ),
              queryCollection<Test>(
                TESTS_COLLECTION,
                where('isPublished', '==', true)
              ),
              queryCollection<Assignment>(
                ASSIGNMENTS_COLLECTION,
                where('isPublished', '==', true)
              ),
            ]);

          const courseChapters =
            chapters.length > 0
              ? chapters
              : INITIAL_CHAPTERS.filter((ch) => ch.courseId === courseId);
          const courseLessons =
            lessons.length > 0
              ? lessons
              : INITIAL_LESSONS.filter((ls) => ls.courseId === courseId);

          return {
            course,
            subjects,
            chapters: courseChapters,
            lessons: courseLessons,
            materials,
            tests,
            assignments,
          };
        } catch (err) {
          console.warn('[courseService] Error fetching course hierarchy:', err);
          const course = INITIAL_COURSES.find((c) => c.id === courseId) || null;
          return {
            course,
            subjects: [],
            chapters: INITIAL_CHAPTERS.filter((ch) => ch.courseId === courseId),
            lessons: INITIAL_LESSONS.filter((ls) => ls.courseId === courseId),
            materials: [],
            tests: [],
            assignments: [],
          };
        }
      },
      5 * 60 * 1000
    );
  },

  /**
   * Fetch all chapters for a given course ordered by sequence.
   */
  async getCourseChapters(courseId: string): Promise<Chapter[]> {
    try {
      const list = await queryCollection<Chapter>(
        CHAPTERS_COLLECTION,
        where('courseId', '==', courseId),
        where('isPublished', '==', true),
        orderBy('order', 'asc')
      );
      if (list.length > 0) return list;
      return INITIAL_CHAPTERS.filter(
        (c) => c.courseId === courseId && c.isPublished
      );
    } catch (err) {
      console.warn('[courseService] Error fetching course chapters:', err);
      return INITIAL_CHAPTERS.filter(
        (c) => c.courseId === courseId && c.isPublished
      );
    }
  },

  /**
   * Fetch all lessons within a specific chapter ordered by sequence.
   */
  async getChapterLessons(chapterId: string): Promise<Lesson[]> {
    try {
      const list = await queryCollection<Lesson>(
        LESSONS_COLLECTION,
        where('chapterId', '==', chapterId),
        where('isPublished', '==', true),
        orderBy('order', 'asc')
      );
      if (list.length > 0) return list;
      return INITIAL_LESSONS.filter(
        (l) => l.chapterId === chapterId && l.isPublished
      );
    } catch (err) {
      console.warn('[courseService] Error fetching chapter lessons:', err);
      return INITIAL_LESSONS.filter(
        (l) => l.chapterId === chapterId && l.isPublished
      );
    }
  },
};

export default courseService;
