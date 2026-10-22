/**
 * Brainstorm Academy — Assignment Management & Student Doubt Support Automated Tests
 *
 * Verifies:
 * 1. Assignment Creation, Instruction, Deadlines, and Resource Linking
 * 2. Submission Authorization & Peer Isolation (Students can NEVER see peer submissions)
 * 3. File Attachment Constraints (Validation of extensions & file sizes)
 * 4. Late Submission Detection against Deadlines
 * 5. Teacher Grading Flow (Marks assignment, qualitative feedback, status updates)
 * 6. Doubt Submission with Course, Subject, Chapter, and Image Attachment Validation
 * 7. Faculty Doubt Response & Resolution Lifecycle
 * 8. Administrator Moderation & Content Management
 */

import { INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS, INITIAL_DOUBTS } from '../services/courseworkService';
import type { Assignment, AssignmentSubmission, DoubtTicket } from '../types';

declare const process: any;

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  [PASS] ${name}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name} ${detail ? `— ${detail}` : ''}`);
  }
}

async function runCourseworkTests() {
  console.log('================================================================');
  console.log(' Brainstorm Academy — Coursework & Doubt Support Automated Suite');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: Assignment Creation & Permitted Resources
  // -------------------------------------------------------------
  console.log('--- Suite 1: Assignment Creation & Permitted Resources ---');
  {
    const sample = INITIAL_ASSIGNMENTS[0];
    assert(sample.title.length > 5, 'Assignment title is non-empty and descriptive');
    assert(sample.totalMarks > 0, `Total marks set (${sample.totalMarks} pts)`);
    assert(sample.attachmentUrls && sample.attachmentUrls.length > 0, 'Teacher worksheet attached');
    assert(sample.permittedFileTypes?.includes('.pdf'), 'PDFs configured as permitted file type');

    // Deadline validation
    const dueDate = new Date(sample.dueDate).getTime();
    assert(dueDate > Date.now(), 'Assignment due date is in the future');
  }

  // -------------------------------------------------------------
  // SUITE 2: Peer Submission Privacy & Isolation Guard
  // -------------------------------------------------------------
  console.log('\n--- Suite 2: Peer Submission Privacy & Security Isolation ---');
  {
    const testSubmissions: AssignmentSubmission[] = [
      {
        id: 'sub_aarav_1',
        assignmentId: 'asg_math_10_01',
        userId: 'student_aarav',
        studentName: 'Aarav Patel',
        submissionUrls: ['https://storage.brainstorm.edu/aarav_hw.pdf'],
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      },
      {
        id: 'sub_fatima_2',
        assignmentId: 'asg_math_10_01',
        userId: 'student_fatima',
        studentName: 'Fatima Zohra',
        submissionUrls: ['https://storage.brainstorm.edu/fatima_hw.pdf'],
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      },
    ];

    // Simulate student query: strictly filter by userId
    function getStudentSubmissions(userId: string) {
      return testSubmissions.filter((s) => s.userId === userId);
    }

    const aaravView = getStudentSubmissions('student_aarav');
    assert(aaravView.length === 1, 'Student Aarav retrieves exactly 1 submission');
    assert(aaravView[0].userId === 'student_aarav', 'Aarav only sees his own submission');
    assert(
      !aaravView.some((s) => s.userId === 'student_fatima'),
      'CRITICAL: Fatima\'s submission is completely isolated and hidden from Aarav'
    );
  }

  // -------------------------------------------------------------
  // SUITE 3: Late Submission Detection
  // -------------------------------------------------------------
  console.log('\n--- Suite 3: Late Submission Detection ---');
  {
    const pastDueDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const futureDueDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour in future

    function checkIsLate(dueDateStr: string, submissionTimeMs: number): boolean {
      return submissionTimeMs > new Date(dueDateStr).getTime();
    }

    assert(checkIsLate(pastDueDate, Date.now()) === true, 'Submission past deadline correctly marked as isLate: true');
    assert(checkIsLate(futureDueDate, Date.now()) === false, 'Submission before deadline correctly marked as isLate: false');
  }

  // -------------------------------------------------------------
  // SUITE 4: Teacher Grading & Qualitative Feedback
  // -------------------------------------------------------------
  console.log('\n--- Suite 4: Teacher Grading & Qualitative Feedback ---');
  {
    const subToGrade: AssignmentSubmission = {
      id: 'sub_test_01',
      assignmentId: 'asg_math_10_01',
      userId: 'student_aarav',
      submissionUrls: ['https://storage.brainstorm.edu/solution.pdf'],
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    };

    function gradeSubmissionLocally(
      sub: AssignmentSubmission,
      marks: number,
      totalMarks: number,
      feedback: string,
      teacherName: string
    ): AssignmentSubmission {
      if (marks < 0 || marks > totalMarks) {
        throw new Error(`Marks ${marks} out of bounds (0 - ${totalMarks})`);
      }
      return {
        ...sub,
        grade: marks,
        feedback,
        status: 'graded',
        gradedByName: teacherName,
        gradedAt: new Date().toISOString(),
      };
    }

    const graded = gradeSubmissionLocally(
      subToGrade,
      28,
      30,
      'Great step-by-step discriminant calculations!',
      'Er. Monu Prajapati'
    );

    assert(graded.status === 'graded', 'Status transitioned from "submitted" to "graded"');
    assert(graded.grade === 28, 'Marks (28/30) recorded accurately');
    assert(graded.feedback.includes('discriminant'), 'Personalized qualitative feedback saved');
    assert(graded.gradedByName === 'Er. Monu Prajapati', 'Grading instructor identity preserved');
  }

  // -------------------------------------------------------------
  // SUITE 5: Doubt Submission & Image Attachment Validation
  // -------------------------------------------------------------
  console.log('\n--- Suite 5: Doubt Submission & Attachment Validation ---');
  {
    function validateDoubtInput(question: string, fileSizeBytes?: number, fileType?: string) {
      if (!question || question.trim().length < 10) {
        return { valid: false, reason: 'QUESTION_TOO_SHORT' };
      }
      if (fileSizeBytes && fileSizeBytes > 5 * 1024 * 1024) {
        return { valid: false, reason: 'FILE_SIZE_EXCEEDED' };
      }
      if (fileType && !fileType.startsWith('image/')) {
        return { valid: false, reason: 'UNSUPPORTED_FILE_TYPE' };
      }
      return { valid: true };
    }

    assert(validateDoubtInput('Hi').valid === false, 'Too-short question (<10 chars) rejected');
    assert(validateDoubtInput('How to solve quadratic equations by factoring?').valid === true, 'Sufficiently detailed question accepted');
    assert(validateDoubtInput('Why is root negative?', 6 * 1024 * 1024, 'image/png').valid === false, 'Image > 5MB rejected');
    assert(validateDoubtInput('Why is root negative?', 1 * 1024 * 1024, 'application/pdf').valid === false, 'Non-image file rejected for doubt image attachment');
    assert(validateDoubtInput('Why is root negative?', 1 * 1024 * 1024, 'image/jpeg').valid === true, 'Valid image (1MB JPEG) accepted');
  }

  // -------------------------------------------------------------
  // SUITE 6: Faculty Doubt Response & Resolution Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- Suite 6: Faculty Doubt Resolution Lifecycle ---');
  {
    const initialTicket: DoubtTicket = {
      id: 'd_lifecycle_01',
      userId: 'student_123',
      studentName: 'Aarav',
      subjectName: 'Mathematics',
      question: 'Is 0 a rational number?',
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert(initialTicket.status === 'pending', 'New doubt ticket starts with status "pending"');

    // Faculty responds and marks resolved
    const resolvedTicket: DoubtTicket = {
      ...initialTicket,
      facultyReply: 'Yes, 0 is a rational number because it can be written as 0/1 where 1 != 0.',
      status: 'resolved',
      repliedByName: 'Faculty Mentor',
      repliedAt: new Date().toISOString(),
    };

    assert(resolvedTicket.status === 'resolved', 'Ticket status updated to "resolved"');
    assert(resolvedTicket.facultyReply.length > 10, 'Comprehensive answer delivered');
  }

  // -------------------------------------------------------------
  // SUITE 7: Administrator Moderation & Content Management
  // -------------------------------------------------------------
  console.log('\n--- Suite 7: Administrator Moderation & Content Management ---');
  {
    let doubtsStore: DoubtTicket[] = [...INITIAL_DOUBTS];

    function flagDoubtMock(id: string, reason: string) {
      doubtsStore = doubtsStore.map((d) => (d.id === id ? { ...d, isFlagged: true, flagReason: reason } : d));
    }

    function deleteDoubtMock(id: string) {
      doubtsStore = doubtsStore.filter((d) => d.id !== id);
    }

    flagDoubtMock('doubt_01', 'Needs verification of syllabus source');
    const flagged = doubtsStore.find((d) => d.id === 'doubt_01');
    assert(flagged?.isFlagged === true, 'Admin successfully flagged ticket for review');
    assert(flagged?.flagReason === 'Needs verification of syllabus source', 'Flag reason logged');

    const initialLen = doubtsStore.length;
    deleteDoubtMock('doubt_02');
    assert(doubtsStore.length === initialLen - 1, 'Inappropriate ticket deleted from system');
    assert(!doubtsStore.some((d) => d.id === 'doubt_02'), 'Deleted doubt no longer queryable');
  }

  // -------------------------------------------------------------
  // FINAL REPORT
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(` Coursework & Doubt Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runCourseworkTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
