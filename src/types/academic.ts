import { BaseEntity } from './common';

export type EnrollmentStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface Enrollment extends BaseEntity {
  userId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  expiresAt?: string;
  status: EnrollmentStatus;
  progressPercentage: number;
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
  lastAccessedAt: string;
  certificateIssued?: boolean;
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'numerical' | 'true_false';

export interface Question {
  id: string;
  questionText: string;
  questionImage?: string;
  type: QuestionType;
  options: { id: string; text: string; image?: string }[];
  correctOptionIds: string[];
  marks: number;
  negativeMarks: number;
  explanation?: string;
}

/**
 * Question format delivered to the student during an active examination.
 * Strips correctOptionIds and explanation to prevent inspect-element cheating.
 */
export type ClientSafeQuestion = Omit<Question, 'correctOptionIds' | 'explanation'>;

export interface Test extends BaseEntity {
  courseId?: string;
  chapterId?: string;
  subjectName?: string;
  classGrade?: string;
  title: string;
  description?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questionsCount: number;
  questions?: Question[];
  isPublished: boolean;
  targetCategory?: string;
  allowRetake?: boolean;
  attemptLimit?: number;
  negativeMarking?: boolean;
  availableFrom?: string;
  availableUntil?: string;
  instructions?: string[];
  instructorId?: string;
  instructorName?: string;
}

export interface QuestionResponse {
  questionId: string;
  selectedOptionIds: string[];
  isCorrect?: boolean;
  marksObtained: number;
  timeSpentSeconds: number;
}

export type TestAttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface TestAttempt extends BaseEntity {
  testId: string;
  testTitle: string;
  userId: string;
  studentName?: string;
  startedAt: string;
  deadline: string;
  submittedAt?: string;
  status: TestAttemptStatus;
  score: number;
  totalMarks: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  correctAnswersCount?: number;
  incorrectAnswersCount?: number;
  unattemptedCount?: number;
  accuracyPercentage?: number;
  savedAnswers?: Record<string, string[]>;
  markedForReviewIds?: string[];
  visitedQuestionIds?: string[];
  responses: QuestionResponse[];
  rank?: number;
}

export interface Assignment extends BaseEntity {
  courseId: string;
  courseTitle?: string;
  subjectName?: string;
  chapterId?: string;
  chapterName?: string;
  teacherId?: string;
  teacherName?: string;
  title: string;
  instructions: string;
  attachmentUrls?: string[];
  attachmentNames?: string[];
  dueDate: string;
  totalMarks: number;
  isPublished: boolean;
  allowFileUploads?: boolean;
  maxFileSizeMb?: number;
  permittedFileTypes?: string[];
  submissionsCount?: number;
}

export interface AssignmentSubmission extends BaseEntity {
  assignmentId: string;
  assignmentTitle?: string;
  courseTitle?: string;
  userId: string;
  studentName?: string;
  studentEmail?: string;
  submissionUrls: string[];
  attachmentNames?: string[];
  answerText?: string;
  notes?: string;
  submittedAt: string;
  status: 'submitted' | 'graded' | 'resubmit';
  grade?: number;
  totalMarks?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
  gradedByName?: string;
  isLate?: boolean;
}

export interface StudyMaterial extends BaseEntity {
  courseId?: string;
  courseTitle?: string;
  chapterId?: string;
  subjectName?: string;
  title: string;
  description?: string;
  fileUrl: string;
  storagePath?: string;
  fileType: 'pdf' | 'doc' | 'notes' | 'formula_sheet' | 'image' | 'worksheet';
  fileSizeMb?: number;
  classGrade?: string;
  isPublished: boolean;
  isDownloadable?: boolean;
  downloadCount?: number;
  teacherId?: string;
  teacherName?: string;
  instructorId?: string;
}

export interface LiveClass extends BaseEntity {
  courseId?: string;
  courseTitle?: string;
  subjectName?: string;
  title: string;
  description?: string;
  instructorName: string;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl?: string;
  recordingUrl?: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
}

export interface DoubtTicket extends BaseEntity {
  userId: string;
  studentName: string;
  studentEmail?: string;
  courseId?: string;
  courseTitle?: string;
  subjectName: string;
  chapterName?: string;
  teacherId?: string;
  question: string;
  attachmentUrls?: string[];
  attachmentNames?: string[];
  status: 'pending' | 'in_review' | 'resolved';
  facultyReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  repliedByName?: string;
  replyAttachmentUrls?: string[];
  isFlagged?: boolean;
  flagReason?: string;
}

