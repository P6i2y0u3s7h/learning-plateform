import { BaseEntity, UserRole } from './common';

export type TeacherApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface User extends BaseEntity {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  disabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  phone?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Student specific fields
  classGrade?: string;
  targetExam?: string;
  enrolledCourseIds?: string[];
  completedLessonIds?: string[];

  // Teacher specific fields
  approvalStatus?: TeacherApprovalStatus;
  subjectSpecialization?: string;
  subjects?: string[];
  qualification?: string;
  experienceYears?: number;
  approvedBy?: string;
  approvedAt?: string;

  // Admin specific fields
  isSuperAdmin?: boolean;
}

export interface StudentRegistrationData {
  fullName: string;
  email: string;
  password: string;
  classOrExamPreference: string;
  phone?: string;
}

export interface TeacherRegistrationData {
  fullName: string;
  email: string;
  password: string;
  subjectSpecialization: string;
  qualification: string;
  experienceYears: number | string;
  phone?: string;
}
