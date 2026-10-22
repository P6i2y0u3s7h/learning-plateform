import { BaseEntity } from './common';

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  order?: number;
}

export interface Subject extends BaseEntity {
  name: string;
  code?: string;
  categoryId: string;
  courseId?: string;
  courseTitle?: string;
  classGrade?: string;
  description?: string;
  icon?: string;
  order?: number;
}

export interface Course extends BaseEntity {
  title: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  subjectId?: string;
  subjectName?: string;
  classGrade?: string;
  stream?: 'Science PCM' | 'Science PCB' | 'Commerce' | 'Arts' | string;
  targetExam?: string;
  description: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  instructorId?: string;
  instructorName?: string;
  price: number;
  originalPrice?: number;
  validityDays?: number;
  isFree: boolean;
  isPublished: boolean;
  featured?: boolean;
  durationHours: number;
  totalLessons: number;
  totalChapters: number;
  enrolledStudentsCount: number;
  averageRating: number;
  totalReviews: number;
  syllabus?: string[];
  prerequisites?: string[];
  tags: string[];
}

export interface Chapter extends BaseEntity {
  courseId: string;
  subjectId?: string;
  subjectName?: string;
  title: string;
  description?: string;
  order: number;
  totalLessons: number;
  durationMinutes?: number;
  isPublished: boolean;
}

export type LessonType = 'video' | 'article' | 'pdf' | 'quiz' | 'live';

export interface Lesson extends BaseEntity {
  chapterId: string;
  chapterTitle?: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  description?: string;
  type: LessonType;
  durationMinutes: number;
  order: number;
  videoUrl?: string;
  videoId?: string;
  videoProvider?: 'youtube' | 'vimeo' | 'direct' | 'hls' | 'custom';
  pdfResourceUrl?: string;
  contentMarkdown?: string;
  attachmentUrls?: string[];
  isFreePreview: boolean;
  isPublished: boolean;
}
