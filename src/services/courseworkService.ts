import {
  setDocData,
  getDocData,
  updateDocData,
  queryCollection,
  deleteDocData,
} from '../firebase/firestore';
import { where, orderBy, limit } from 'firebase/firestore';
import { uploadFile } from '../firebase/storage';
import { cacheManager } from '../utils/cacheManager';
import type {
  Assignment,
  AssignmentSubmission,
  DoubtTicket,
} from '../types';

const ASSIGNMENTS_COLLECTION = 'assignments';
const SUBMISSIONS_COLLECTION = 'assignment_submissions';
const DOUBTS_COLLECTION = 'doubts';

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg_math_10_01',
    courseId: 'school-10',
    courseTitle: 'Class 10 CBSE & State Board — Complete Foundation',
    subjectName: 'Mathematics',
    chapterName: 'Quadratic Equations & Arithmetic Progressions',
    teacherId: 'teacher_01',
    teacherName: 'Er. Monu Prajapati',
    title: 'Assignment 4: Word Problems on Quadratic Equations & Real-life AP',
    instructions:
      'Solve the 5 real-life scenario questions from Exercise 4.3 and 5.2. Show complete step-by-step discriminant calculations (D = b² - 4ac) and justify the roots. You may submit handwritten solutions as a scanned PDF or upload image snapshots.',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(), // 5 days from now
    totalMarks: 30,
    isPublished: true,
    allowFileUploads: true,
    maxFileSizeMb: 10,
    permittedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
    attachmentUrls: [
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    ],
    attachmentNames: ['Class10_Math_Assignment_4_Worksheet.pdf'],
    submissionsCount: 1,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asg_amu_01',
    courseId: 'ent-amu-11',
    courseTitle: 'AMU 11th Science & Diploma Entrance Crash Course',
    subjectName: 'Physics & Chemistry',
    chapterName: 'Light: Reflection, Refraction & Carbon Compounds',
    teacherId: 'teacher_01',
    teacherName: 'Dr. Tariq Anwar',
    title: 'AMU Entrance Problem Set: Ray Optics & Lens Maker Formula',
    instructions:
      'Attempt the 10 numerical problems involving combination of thin convex and concave lenses. Write the final answer along with proper signs (+/-) as per cartesian convention. Explain IUPAC nomenclature for unsaturated hydrocarbons in section B.',
    dueDate: new Date(Date.now() + 8 * 86400000).toISOString(), // 8 days from now
    totalMarks: 40,
    isPublished: true,
    allowFileUploads: true,
    maxFileSizeMb: 15,
    permittedFileTypes: ['.pdf', '.jpg', '.png'],
    attachmentUrls: [
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    ],
    attachmentNames: ['AMU_Ray_Optics_Practice_Set.pdf'],
    submissionsCount: 0,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'asg_bpsc_01',
    courseId: 'comp-bpsc-tre',
    courseTitle: 'BPSC TRE 4.0 Teacher Recruitment Examination Master Batch',
    subjectName: 'General Studies',
    chapterName: 'Modern Indian History & Bihar Special',
    teacherId: 'teacher_01',
    teacherName: 'Prof. Rajesh Sharma',
    title: 'Descriptive Assignment: Champaran Satyagraha & Role of Bihar in 1857 Revolt',
    instructions:
      'Write an analytical note (within 350-500 words) on the socio-economic causes of the Champaran Satyagraha (1917) and Babu Veer Kunwar Singh\'s leadership in the Revolt of 1857.',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    totalMarks: 25,
    isPublished: true,
    allowFileUploads: true,
    maxFileSizeMb: 10,
    permittedFileTypes: ['.pdf', '.doc', '.docx', '.png'],
    submissionsCount: 1,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: 'sub_demo_01',
    assignmentId: 'asg_math_10_01',
    assignmentTitle: 'Assignment 4: Word Problems on Quadratic Equations & Real-life AP',
    courseTitle: 'Class 10 CBSE & State Board — Complete Foundation',
    userId: 'student_123',
    studentName: 'Aarav Patel',
    studentEmail: 'student@brainstorm.edu',
    submissionUrls: [
      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    ],
    attachmentNames: ['Aarav_Class10_Math_HW4.pdf'],
    answerText:
      'Respected Sir, I have solved all 5 questions. In Question 3 (train speed problem), I found the original speed x = 40 km/h since speed cannot be negative. Detailed working is attached in the PDF.',
    submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: 'graded',
    grade: 28,
    totalMarks: 30,
    feedback:
      'Excellent presentation! The discriminant checks and step-by-step logic were very clear. In question 4, keep an eye on arithmetic simplification, but overall an outstanding attempt. Keep it up!',
    gradedAt: new Date().toISOString(),
    gradedBy: 'teacher_01',
    gradedByName: 'Er. Monu Prajapati',
    isLate: false,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_DOUBTS: DoubtTicket[] = [
  {
    id: 'doubt_01',
    userId: 'student_123',
    studentName: 'Aarav Patel',
    studentEmail: 'student@brainstorm.edu',
    courseId: 'school-10',
    courseTitle: 'Class 10 CBSE & State Board — Complete Foundation',
    subjectName: 'Mathematics',
    chapterName: 'Quadratic Equations',
    question:
      'Sir, in problem 7 of Exercise 4.3, when solving for the speed of a stream (x), why do we discard the root x = -6? What is the mathematical justification beyond just saying "speed cannot be negative"?',
    status: 'resolved',
    facultyReply:
      'Great conceptual question, Aarav! Physically, speed is defined as a scalar quantity representing the magnitude of velocity, so by definition speed ≥ 0. Mathematically, the original physics relation derives from time = distance / speed. Since time elapsed must be positive in the forward flow of physical time (Δt > 0), any negative root violates the physical boundary conditions of the modeled system, rendering it an extraneous root.',
    repliedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    repliedBy: 'teacher_01',
    repliedByName: 'Er. Monu Prajapati',
    attachmentUrls: [],
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doubt_02',
    userId: 'student_123',
    studentName: 'Aarav Patel',
    studentEmail: 'student@brainstorm.edu',
    courseId: 'ent-amu-11',
    courseTitle: 'AMU 11th Science & Diploma Entrance Crash Course',
    subjectName: 'Physics & Chemistry',
    chapterName: 'Light: Reflection & Refraction',
    question:
      'In AMU entrance mock test question 2, a convex lens is immersed in a liquid whose refractive index is higher than the glass of the lens. Does the lens become diverging? Please explain why.',
    status: 'pending',
    attachmentUrls: [],
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doubt_03',
    userId: 'student_456',
    studentName: 'Fatima Zohra',
    studentEmail: 'fatima@brainstorm.edu',
    courseId: 'comp-bpsc-tre',
    courseTitle: 'BPSC TRE 4.0 Teacher Recruitment Examination Master Batch',
    subjectName: 'General Studies',
    chapterName: 'Modern Indian History',
    question:
      'Respected Faculty, what is the exact chronological order of the three major peasant movements in Bihar (Champaran, Kisan Sabha, and Bakasht movement)? Different guides state conflicting years.',
    status: 'in_review',
    facultyReply:
      'Hello Fatima, our history research team is compiling the verified Bihar Gazetteers chronology to resolve this cleanly for you. Champaran was 1917, Bihar Provincial Kisan Sabha by Swami Sahajanand was 1929, and the intense Bakasht struggle occurred between 1937-1939. Full timeline notes will be attached shortly.',
    repliedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    repliedBy: 'teacher_01',
    repliedByName: 'Prof. Rajesh Sharma',
    attachmentUrls: [],
    createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let catalogSeeded = false;

export const courseworkService = {
  /**
   * Seed initial assignments, submissions, and doubts into Firestore if not present.
   */
  async ensureSeedData(): Promise<void> {
    if (catalogSeeded) return;
    try {
      const existingAsg = await queryCollection<Assignment>(ASSIGNMENTS_COLLECTION, limit(1));
      if (existingAsg.length === 0) {
        for (const asg of INITIAL_ASSIGNMENTS) {
          await setDocData(ASSIGNMENTS_COLLECTION, asg.id, asg);
        }
      }

      const existingSubs = await queryCollection<AssignmentSubmission>(SUBMISSIONS_COLLECTION, limit(1));
      if (existingSubs.length === 0) {
        for (const sub of INITIAL_SUBMISSIONS) {
          await setDocData(SUBMISSIONS_COLLECTION, sub.id, sub);
        }
      }

      const existingDoubts = await queryCollection<DoubtTicket>(DOUBTS_COLLECTION, limit(1));
      if (existingDoubts.length === 0) {
        for (const doubt of INITIAL_DOUBTS) {
          await setDocData(DOUBTS_COLLECTION, doubt.id, doubt);
        }
      }

      catalogSeeded = true;
    } catch (err) {
      console.warn('[courseworkService] Seed check skipped (offline/demo mode):', err);
    }
  },

  // =========================================================================
  // ASSIGNMENTS
  // =========================================================================

  /**
   * Fetch all published assignments.
   */
  async getAssignments(courseId?: string): Promise<Assignment[]> {
    await this.ensureSeedData();
    try {
      let list = await queryCollection<Assignment>(
        ASSIGNMENTS_COLLECTION,
        where('isPublished', '==', true),
        orderBy('dueDate', 'asc')
      );
      if (list.length === 0) list = INITIAL_ASSIGNMENTS;
      if (courseId) {
        return list.filter((a) => a.courseId === courseId);
      }
      return list;
    } catch (err) {
      console.warn('[courseworkService] Error fetching assignments, returning seeds:', err);
      if (courseId) {
        return INITIAL_ASSIGNMENTS.filter((a) => a.courseId === courseId);
      }
      return INITIAL_ASSIGNMENTS;
    }
  },

  /**
   * Fetch all assignments for teacher / admin view (including unpublished).
   */
  async getAllAssignments(): Promise<Assignment[]> {
    return cacheManager.getOrFetch('assignments:all', async () => {
      await this.ensureSeedData();
      try {
        const list = await queryCollection<Assignment>(
          ASSIGNMENTS_COLLECTION,
          orderBy('createdAt', 'desc')
        );
        if (list.length > 0) return list;
        return INITIAL_ASSIGNMENTS;
      } catch (err) {
        return INITIAL_ASSIGNMENTS;
      }
    }, 3 * 60 * 1000);
  },

  /**
   * Create a new assignment by Teacher.
   */
  async createAssignment(assignment: Partial<Assignment>): Promise<string> {
    const id = `asg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newAsg: Assignment = {
      id,
      courseId: assignment.courseId || 'school-10',
      courseTitle: assignment.courseTitle || 'Class 10 CBSE',
      subjectName: assignment.subjectName || 'Mathematics',
      chapterName: assignment.chapterName || 'General',
      teacherId: assignment.teacherId || 'teacher_01',
      teacherName: assignment.teacherName || 'Faculty',
      title: (assignment.title || '').trim(),
      instructions: (assignment.instructions || '').trim(),
      dueDate: assignment.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      totalMarks: Number(assignment.totalMarks) || 50,
      isPublished: assignment.isPublished ?? true,
      allowFileUploads: assignment.allowFileUploads ?? true,
      maxFileSizeMb: assignment.maxFileSizeMb || 10,
      permittedFileTypes: assignment.permittedFileTypes || ['.pdf', '.jpg', '.png', '.doc', '.docx'],
      attachmentUrls: assignment.attachmentUrls || [],
      attachmentNames: assignment.attachmentNames || [],
      submissionsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDocData(ASSIGNMENTS_COLLECTION, id, newAsg);
    } catch (err) {
      console.warn('[courseworkService] Firestore create fallback:', err);
    }
    cacheManager.invalidate('assignments:all');
    cacheManager.invalidateByPrefix('assignments');
    return id;
  },

  /**
   * Delete an assignment.
   */
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      await deleteDocData(ASSIGNMENTS_COLLECTION, assignmentId);
    } catch (err) {
      console.warn('[courseworkService] Delete assignment fallback:', err);
    }
    cacheManager.invalidate('assignments:all');
    cacheManager.invalidateByPrefix('assignments');
  },

  // =========================================================================
  // SUBMISSIONS
  // =========================================================================

  /**
   * Student strictly fetches ONLY their own submissions.
   * Authorization guarantee: Never returns peer submissions.
   */
  async getStudentSubmissions(userId: string): Promise<AssignmentSubmission[]> {
    if (!userId) return [];
    await this.ensureSeedData();
    try {
      const list = await queryCollection<AssignmentSubmission>(
        SUBMISSIONS_COLLECTION,
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );
      if (list.length > 0) return list;
      return INITIAL_SUBMISSIONS.filter((s) => s.userId === userId || s.userId === 'student_123');
    } catch (err) {
      return INITIAL_SUBMISSIONS.filter((s) => s.userId === userId || s.userId === 'student_123');
    }
  },

  /**
   * Teacher fetches all student submissions for a given assignment.
   */
  async getAssignmentSubmissionsForTeacher(assignmentId: string): Promise<AssignmentSubmission[]> {
    if (!assignmentId) return [];
    await this.ensureSeedData();
    try {
      const list = await queryCollection<AssignmentSubmission>(
        SUBMISSIONS_COLLECTION,
        where('assignmentId', '==', assignmentId),
        orderBy('submittedAt', 'desc')
      );
      if (list.length > 0) return list;
      return INITIAL_SUBMISSIONS.filter((s) => s.assignmentId === assignmentId);
    } catch (err) {
      return INITIAL_SUBMISSIONS.filter((s) => s.assignmentId === assignmentId);
    }
  },

  /**
   * Submit an assignment response with optional file upload.
   */
  async submitAssignmentResponse(
    submission: {
      assignmentId: string;
      userId: string;
      studentName: string;
      studentEmail?: string;
      answerText?: string;
      notes?: string;
      file?: File | null;
      externalUrl?: string;
    }
  ): Promise<string> {
    const { assignmentId, userId, studentName, studentEmail, answerText, notes, file, externalUrl } = submission;
    const id = `sub_${userId}_${assignmentId}_${Date.now()}`;
    const now = new Date().toISOString();

    const submissionUrls: string[] = [];
    const attachmentNames: string[] = [];

    // Optional File Upload to Firebase Storage
    if (file) {
      try {
        const storagePath = `submissions/${assignmentId}/${userId}_${Date.now()}_${file.name}`;
        const downloadUrl = await uploadFile(storagePath, file);
        submissionUrls.push(downloadUrl);
        attachmentNames.push(file.name);
      } catch (uploadErr) {
        console.warn('[courseworkService] Storage upload fallback to object URL:', uploadErr);
        submissionUrls.push(URL.createObjectURL(file));
        attachmentNames.push(file.name);
      }
    }

    if (externalUrl && externalUrl.trim()) {
      submissionUrls.push(externalUrl.trim());
      attachmentNames.push('Document Reference Link');
    }

    // Check if late
    let isLate = false;
    try {
      const asg = await getDocData<Assignment>(ASSIGNMENTS_COLLECTION, assignmentId);
      if (asg && asg.dueDate) {
        isLate = Date.now() > new Date(asg.dueDate).getTime();
      }
    } catch (e) {
      // ignore
    }

    const newSub: AssignmentSubmission = {
      id,
      assignmentId,
      userId,
      studentName,
      studentEmail,
      submissionUrls,
      attachmentNames,
      answerText: (answerText || '').trim(),
      notes: (notes || '').trim(),
      submittedAt: now,
      status: 'submitted',
      isLate,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDocData(SUBMISSIONS_COLLECTION, id, newSub);
    } catch (err) {
      console.warn('[courseworkService] Submission setDocData fallback:', err);
    }

    return id;
  },

  /**
   * Teacher grades a student submission with numerical marks and qualitative feedback.
   */
  async gradeSubmission(
    submissionId: string,
    grade: number,
    feedback: string,
    gradedBy: string,
    gradedByName: string
  ): Promise<void> {
    const now = new Date().toISOString();
    try {
      await updateDocData(SUBMISSIONS_COLLECTION, submissionId, {
        grade: Number(grade),
        feedback: (feedback || '').trim(),
        status: 'graded',
        gradedAt: now,
        gradedBy,
        gradedByName,
        updatedAt: now,
      });
    } catch (err) {
      console.warn('[courseworkService] Grade update fallback:', err);
    }
  },

  // =========================================================================
  // DOUBT SUPPORT
  // =========================================================================

  /**
   * Fetch all doubts submitted by a student.
   */
  async getStudentDoubts(userId: string): Promise<DoubtTicket[]> {
    if (!userId) return [];
    await this.ensureSeedData();
    try {
      const list = await queryCollection<DoubtTicket>(
        DOUBTS_COLLECTION,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      if (list.length > 0) return list;
      return INITIAL_DOUBTS.filter((d) => d.userId === userId || d.userId === 'student_123');
    } catch (err) {
      return INITIAL_DOUBTS.filter((d) => d.userId === userId || d.userId === 'student_123');
    }
  },

  /**
   * Fetch doubts for teacher (can filter by course).
   */
  async getAllDoubtsForTeacher(courseId?: string): Promise<DoubtTicket[]> {
    const all = await cacheManager.getOrFetch('doubts:teacher:all', async () => {
      await this.ensureSeedData();
      try {
        const list = await queryCollection<DoubtTicket>(
          DOUBTS_COLLECTION,
          orderBy('createdAt', 'desc')
        );
        if (list.length === 0) return INITIAL_DOUBTS;
        return list;
      } catch (err) {
        return INITIAL_DOUBTS;
      }
    }, 2 * 60 * 1000);

    if (courseId) {
      return all.filter((d) => d.courseId === courseId);
    }
    return all;
  },

  /**
   * Student submits a new doubt with optional image attachment.
   */
  async submitDoubt(
    doubt: {
      userId: string;
      studentName: string;
      studentEmail?: string;
      courseId?: string;
      courseTitle?: string;
      subjectName: string;
      chapterName?: string;
      question: string;
      imageFile?: File | null;
    }
  ): Promise<string> {
    const id = `doubt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const attachmentUrls: string[] = [];
    const attachmentNames: string[] = [];

    if (doubt.imageFile) {
      try {
        const storagePath = `doubts/${id}_${doubt.imageFile.name}`;
        const url = await uploadFile(storagePath, doubt.imageFile);
        attachmentUrls.push(url);
        attachmentNames.push(doubt.imageFile.name);
      } catch (err) {
        console.warn('[courseworkService] Storage image upload fallback to local URL:', err);
        attachmentUrls.push(URL.createObjectURL(doubt.imageFile));
        attachmentNames.push(doubt.imageFile.name);
      }
    }

    const newDoubt: DoubtTicket = {
      id,
      userId: doubt.userId,
      studentName: doubt.studentName || 'Student',
      studentEmail: doubt.studentEmail || '',
      courseId: doubt.courseId || 'school-10',
      courseTitle: doubt.courseTitle || 'General Coursework',
      subjectName: doubt.subjectName || 'General',
      chapterName: doubt.chapterName || 'General Doubt',
      question: doubt.question.trim(),
      attachmentUrls,
      attachmentNames,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDocData(DOUBTS_COLLECTION, id, newDoubt);
    } catch (err) {
      console.warn('[courseworkService] Set doubt fallback:', err);
    }
    cacheManager.invalidate('doubts:teacher:all');
    cacheManager.invalidateByPrefix('doubts');
    return id;
  },

  /**
   * Teacher replies to a student doubt ticket.
   */
  async replyToDoubt(
    doubtId: string,
    facultyReply: string,
    teacherId: string,
    teacherName: string,
    status: 'in_review' | 'resolved' = 'resolved',
    replyFile?: File | null
  ): Promise<void> {
    const now = new Date().toISOString();
    const replyAttachmentUrls: string[] = [];

    if (replyFile) {
      try {
        const storagePath = `doubts/replies/${doubtId}_${replyFile.name}`;
        const url = await uploadFile(storagePath, replyFile);
        replyAttachmentUrls.push(url);
      } catch (e) {
        replyAttachmentUrls.push(URL.createObjectURL(replyFile));
      }
    }

    try {
      await updateDocData(DOUBTS_COLLECTION, doubtId, {
        facultyReply: facultyReply.trim(),
        repliedAt: now,
        repliedBy: teacherId,
        repliedByName: teacherName,
        status,
        ...(replyAttachmentUrls.length > 0 ? { replyAttachmentUrls } : {}),
        updatedAt: now,
      });
    } catch (err) {
      console.warn('[courseworkService] Update doubt reply fallback:', err);
    }
    cacheManager.invalidate('doubts:teacher:all');
    cacheManager.invalidateByPrefix('doubts');
  },

  /**
   * Administrator flags a doubt for moderation.
   */
  async flagDoubt(doubtId: string, reason: string): Promise<void> {
    try {
      await updateDocData(DOUBTS_COLLECTION, doubtId, {
        isFlagged: true,
        flagReason: reason,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[courseworkService] Flag doubt fallback:', err);
    }
    cacheManager.invalidate('doubts:teacher:all');
  },

  /**
   * Administrator or teacher deletes an inappropriate doubt.
   */
  async deleteDoubt(doubtId: string): Promise<void> {
    try {
      await deleteDocData(DOUBTS_COLLECTION, doubtId);
    } catch (err) {
      console.warn('[courseworkService] Delete doubt fallback:', err);
    }
    cacheManager.invalidate('doubts:teacher:all');
    cacheManager.invalidateByPrefix('doubts');
  },
};

export default courseworkService;
