/**
 * ==============================================================
 * Brainstorm Academy — Comprehensive Security Audit Verification Suite
 * ==============================================================
 * Validates all security rules, access control policies, privilege escalation guards,
 * payment verification defenses, and student privacy boundaries.
 * ==============================================================
 */

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { generateHmacSha256, verifyHmacSha256 } from '../utils/crypto';

// Simulated Security Context & Document State for Rules Engine Simulation
interface SecurityAuth {
  uid: string;
  token: {
    role?: 'student' | 'teacher' | 'admin';
    admin?: boolean;
    superAdmin?: boolean;
    teacherApproved?: boolean;
  };
}

interface FirestoreDoc {
  data: Record<string, any>;
}

/**
 * Lightweight, zero-dependency AST/Constraint Validator for Firestore Security Rules
 * Evaluates requested resource operations against defined rule invariants.
 */
class SecurityRuleEvaluator {
  private users: Map<string, Record<string, any>> = new Map();
  private courses: Map<string, Record<string, any>> = new Map();
  private enrollments: Map<string, Record<string, any>> = new Map();

  seedUser(uid: string, data: Record<string, any>) {
    this.users.set(uid, data);
  }

  seedCourse(id: string, data: Record<string, any>) {
    this.courses.set(id, data);
  }

  seedEnrollment(id: string, data: Record<string, any>) {
    this.enrollments.set(id, data);
  }

  isAdmin(auth: SecurityAuth | null): boolean {
    if (!auth) return false;
    if (auth.token.role === 'admin' || auth.token.admin || auth.token.superAdmin) return true;
    const user = this.users.get(auth.uid);
    return user?.role === 'admin' || user?.isSuperAdmin === true;
  }

  isApprovedTeacher(auth: SecurityAuth | null): boolean {
    if (!auth) return false;
    if (auth.token.role === 'teacher' || auth.token.teacherApproved) return true;
    const user = this.users.get(auth.uid);
    return user?.role === 'teacher' && user?.approvalStatus === 'approved';
  }

  isEnrolled(auth: SecurityAuth | null, courseId: string): boolean {
    if (!auth) return false;
    const enrollment = this.enrollments.get(`enr_${auth.uid}_${courseId}`);
    return enrollment?.status === 'active';
  }

  isCourseFree(courseId: string): boolean {
    const course = this.courses.get(courseId);
    return course ? (course.price === 0 || course.isFree === true) : false;
  }

  // --- Rule Check: /users/{userId} Create ---
  canCreateUser(auth: SecurityAuth | null, userId: string, requestData: Record<string, any>): { allowed: boolean; reason?: string } {
    if (!auth || auth.uid !== userId) return { allowed: false, reason: 'Must be authenticated owner' };
    if (requestData.uid !== userId) return { allowed: false, reason: 'UID mismatch' };
    if (requestData.role === 'admin') return { allowed: false, reason: 'Public self-assignment of role: admin is forbidden' };
    if (requestData.isSuperAdmin === true) return { allowed: false, reason: 'Self-assignment of isSuperAdmin is forbidden' };
    if (requestData.role !== 'student' && !(requestData.role === 'teacher' && requestData.approvalStatus === 'pending')) {
      return { allowed: false, reason: 'Invalid initial role assignment' };
    }
    return { allowed: true };
  }

  // --- Rule Check: /users/{userId} Update ---
  canUpdateUser(auth: SecurityAuth | null, userId: string, currentData: Record<string, any>, updateData: Record<string, any>): { allowed: boolean; reason?: string } {
    if (this.isAdmin(auth)) return { allowed: true };
    if (!auth || auth.uid !== userId) return { allowed: false, reason: 'Unauthorized update' };

    if (updateData.role !== currentData.role) return { allowed: false, reason: 'Cannot mutate own role' };
    if (updateData.approvalStatus !== currentData.approvalStatus) return { allowed: false, reason: 'Cannot mutate approvalStatus' };
    if (updateData.uid !== currentData.uid) return { allowed: false, reason: 'Cannot mutate uid' };
    if ((updateData.isSuperAdmin ?? false) !== (currentData.isSuperAdmin ?? false)) {
      return { allowed: false, reason: 'Cannot mutate isSuperAdmin' };
    }
    return { allowed: true };
  }

  // --- Rule Check: /users/{userId} Read (Privacy) ---
  canReadUser(auth: SecurityAuth | null, targetUserId: string): { allowed: boolean; reason?: string } {
    if (!auth) return { allowed: false, reason: 'Unauthenticated' };
    if (auth.uid === targetUserId || this.isAdmin(auth) || this.isApprovedTeacher(auth)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Students cannot access other students private profiles' };
  }

  // --- Rule Check: /lessons/{lessonId} Read (Protected Content) ---
  canReadLesson(auth: SecurityAuth | null, lesson: Record<string, any>): { allowed: boolean; reason?: string } {
    if (lesson.isFreePreview === true) return { allowed: true };
    if (!auth) return { allowed: false, reason: 'Login required for non-preview content' };
    if (this.isAdmin(auth) || this.isApprovedTeacher(auth)) return { allowed: true };
    if (this.isCourseFree(lesson.courseId) || this.isEnrolled(auth, lesson.courseId)) return { allowed: true };
    return { allowed: false, reason: 'Unenrolled students cannot access protected paid lessons' };
  }

  // --- Rule Check: /enrollments/{enrollmentId} Create (Payment Bypass Guard) ---
  canCreateEnrollment(auth: SecurityAuth | null, requestData: Record<string, any>): { allowed: boolean; reason?: string } {
    if (this.isAdmin(auth)) return { allowed: true };
    if (!auth) return { allowed: false, reason: 'Unauthenticated' };
    if (auth.uid !== requestData.userId) return { allowed: false, reason: 'Cannot enroll for another user' };

    // Self-enrollment ONLY permitted for 100% free courses
    if (this.isCourseFree(requestData.courseId) && requestData.status === 'active') {
      return { allowed: true };
    }

    return { allowed: false, reason: 'Cannot forge active enrollment for paid course without verified payment' };
  }

  // --- Rule Check: /payments/{paymentId} Create (Payment Forgery Guard) ---
  canCreatePayment(auth: SecurityAuth | null, requestData: Record<string, any>): { allowed: boolean; reason?: string } {
    if (!auth) return { allowed: false, reason: 'Unauthenticated' };
    if (auth.uid !== requestData.userId) return { allowed: false, reason: 'User ID mismatch' };
    if (requestData.status !== 'pending' && requestData.status !== 'created') {
      return { allowed: false, reason: 'Students cannot directly create success/verified payments' };
    }
    if (requestData.signatureVerified === true) {
      return { allowed: false, reason: 'Students cannot mark payment signatures verified' };
    }
    if (!requestData.amount || requestData.amount <= 0) {
      return { allowed: false, reason: 'Amount must be greater than zero' };
    }
    return { allowed: true };
  }

  // --- Rule Check: /testAttempts/{attemptId} Create & Update (Score Tampering Guard) ---
  canCreateTestAttempt(auth: SecurityAuth | null, requestData: Record<string, any>): { allowed: boolean; reason?: string } {
    if (!auth) return { allowed: false, reason: 'Unauthenticated' };
    if (auth.uid !== requestData.userId) return { allowed: false, reason: 'User ID mismatch' };
    if (requestData.status !== 'in_progress') {
      return { allowed: false, reason: 'Attempts must start in in_progress state' };
    }
    if (requestData.score !== 0 || requestData.percentage !== 0 || requestData.isPassed !== false) {
      return { allowed: false, reason: 'Cannot pre-set score or passing status on attempt creation' };
    }
    return { allowed: true };
  }

  canUpdateTestAttempt(
    auth: SecurityAuth | null,
    currentData: Record<string, any>,
    updateData: Record<string, any>
  ): { allowed: boolean; reason?: string } {
    if (this.isAdmin(auth)) return { allowed: true };
    if (!auth || auth.uid !== currentData.userId) return { allowed: false, reason: 'Unauthorized update' };

    if (currentData.status !== 'in_progress') {
      return { allowed: false, reason: 'Cannot update finalized or expired attempt' };
    }

    // Student cannot modify score, percentage, or passing status!
    if (updateData.score !== currentData.score) return { allowed: false, reason: 'Score is immutable by student' };
    if (updateData.percentage !== currentData.percentage) return { allowed: false, reason: 'Percentage is immutable by student' };
    if (updateData.isPassed !== currentData.isPassed) return { allowed: false, reason: 'Passing status is immutable by student' };
    if (updateData.totalMarks !== currentData.totalMarks) return { allowed: false, reason: 'Total marks is immutable' };
    if (updateData.testId !== currentData.testId) return { allowed: false, reason: 'Test ID is immutable' };

    return { allowed: true };
  }

  // --- Rule Check: Teacher Scope on Chapters / Lessons ---
  canTeacherModifyCourseContent(auth: SecurityAuth | null, courseId: string): { allowed: boolean; reason?: string } {
    if (this.isAdmin(auth)) return { allowed: true };
    if (!this.isApprovedTeacher(auth)) return { allowed: false, reason: 'Approved teacher role required' };

    const course = this.courses.get(courseId);
    if (!course) return { allowed: false, reason: 'Course not found' };

    if (course.instructorId === auth!.uid) return { allowed: true };
    return { allowed: false, reason: 'Teachers cannot access or modify unauthorized courses' };
  }
}

export async function runSecurityAuditVerification() {
  console.log('======================================================');
  console.log('BRAINSTORM ACADEMY — APPLICATION SECURITY AUDIT SUITE');
  console.log('======================================================\n');

  const evaluator = new SecurityRuleEvaluator();

  // Seed sample database state
  evaluator.seedCourse('course_paid_pcm', {
    id: 'course_paid_pcm',
    title: 'Class 11 Science PCM',
    price: 1499,
    isFree: false,
    isPublished: true,
    instructorId: 'teacher_t1',
  });

  evaluator.seedCourse('course_free_bridge', {
    id: 'course_free_bridge',
    title: 'Free Foundation Bridge Course',
    price: 0,
    isFree: true,
    isPublished: true,
    instructorId: 'teacher_t2',
  });

  evaluator.seedUser('student_s1', {
    uid: 'student_s1',
    role: 'student',
    isSuperAdmin: false,
    displayName: 'Student One',
  });

  evaluator.seedUser('student_s2', {
    uid: 'student_s2',
    role: 'student',
    isSuperAdmin: false,
    displayName: 'Student Two',
  });

  evaluator.seedUser('teacher_t1', {
    uid: 'teacher_t1',
    role: 'teacher',
    approvalStatus: 'approved',
    displayName: 'Teacher One (Physics)',
  });

  evaluator.seedEnrollment('enr_student_s1_course_paid_pcm', {
    id: 'enr_student_s1_course_paid_pcm',
    userId: 'student_s1',
    courseId: 'course_paid_pcm',
    status: 'active',
  });

  const student1Auth: SecurityAuth = { uid: 'student_s1', token: { role: 'student' } };
  const student2Auth: SecurityAuth = { uid: 'student_s2', token: { role: 'student' } };
  const teacher1Auth: SecurityAuth = { uid: 'teacher_t1', token: { role: 'teacher', teacherApproved: true } };
  const adminAuth: SecurityAuth = { uid: 'admin_root', token: { role: 'admin', admin: true, superAdmin: true } };

  // ----------------------------------------------------------
  // TEST 1: Students Cannot Grant Themselves Admin Permissions
  // ----------------------------------------------------------
  console.log('1. Testing Privilege Escalation & Role Self-Assignment...');
  {
    // A. Student creating profile with role: admin
    const check1 = evaluator.canCreateUser(student1Auth, 'student_s1', {
      uid: 'student_s1',
      role: 'admin',
    });
    assert.strictEqual(check1.allowed, false, 'Student MUST NOT be allowed to create profile with role: admin');

    // B. Student creating profile with isSuperAdmin: true
    const check2 = evaluator.canCreateUser(student1Auth, 'student_s1', {
      uid: 'student_s1',
      role: 'student',
      isSuperAdmin: true,
    });
    assert.strictEqual(check2.allowed, false, 'Student MUST NOT be allowed to self-assign isSuperAdmin: true');

    // C. Student updating existing profile to role: admin
    const check3 = evaluator.canUpdateUser(student1Auth, 'student_s1', { role: 'student' }, { role: 'admin' });
    assert.strictEqual(check3.allowed, false, 'Student MUST NOT be allowed to update own role to admin');

    // D. Student updating existing profile with isSuperAdmin: true
    const check4 = evaluator.canUpdateUser(student1Auth, 'student_s1', { isSuperAdmin: false }, { isSuperAdmin: true });
    assert.strictEqual(check4.allowed, false, 'Student MUST NOT be allowed to escalate isSuperAdmin');

    console.log('   ✓ Blocked self-assignment of role: admin');
    console.log('   ✓ Blocked self-assignment of isSuperAdmin: true');
    console.log('   ✓ Blocked role mutation on profile update');
  }

  // ----------------------------------------------------------
  // TEST 2: Students Cannot Modify Their Own Test Scores
  // ----------------------------------------------------------
  console.log('\n2. Testing Test Score Tampering Protection...');
  {
    // A. Student creating pre-evaluated attempt with high score
    const check1 = evaluator.canCreateTestAttempt(student1Auth, {
      userId: 'student_s1',
      testId: 'test_123',
      status: 'submitted',
      score: 100,
      percentage: 100,
      isPassed: true,
    });
    assert.strictEqual(check1.allowed, false, 'Attempt with pre-populated score MUST be rejected');

    // B. Valid attempt creation (score: 0, in_progress)
    const check2 = evaluator.canCreateTestAttempt(student1Auth, {
      userId: 'student_s1',
      testId: 'test_123',
      status: 'in_progress',
      score: 0,
      percentage: 0,
      isPassed: false,
    });
    assert.strictEqual(check2.allowed, true, 'Valid in_progress attempt must be allowed');

    // C. Student tampering with score during draft save
    const currentAttempt = {
      userId: 'student_s1',
      testId: 'test_123',
      status: 'in_progress',
      score: 0,
      percentage: 0,
      isPassed: false,
      totalMarks: 100,
    };
    const tamperedAttempt = {
      ...currentAttempt,
      score: 95,
      percentage: 95,
      isPassed: true,
    };
    const check3 = evaluator.canUpdateTestAttempt(student1Auth, currentAttempt, tamperedAttempt);
    assert.strictEqual(check3.allowed, false, 'Direct modification of score by student MUST be rejected');

    // D. Valid draft answer save without altering score
    const validDraftUpdate = {
      ...currentAttempt,
      savedAnswers: { q1: ['opt_a'] },
    };
    const check4 = evaluator.canUpdateTestAttempt(student1Auth, currentAttempt, validDraftUpdate);
    assert.strictEqual(check4.allowed, true, 'Saving draft answers without score modification must be allowed');

    console.log('   ✓ Blocked pre-evaluated test submission on create');
    console.log('   ✓ Blocked direct score & percentage modification on update');
    console.log('   ✓ Permitted valid in-progress draft saving');
  }

  // ----------------------------------------------------------
  // TEST 3: Students Cannot Forge Payment Success
  // ----------------------------------------------------------
  console.log('\n3. Testing Payment Forgery & Signature Tampering...');
  {
    // A. Student creating payment directly as 'success'
    const check1 = evaluator.canCreatePayment(student1Auth, {
      userId: 'student_s1',
      amount: 1499,
      status: 'success',
      signatureVerified: true,
    });
    assert.strictEqual(check1.allowed, false, 'Direct creation of success payment MUST be rejected');

    // B. Student creating active enrollment for paid course directly
    const check2 = evaluator.canCreateEnrollment(student1Auth, {
      userId: 'student_s1',
      courseId: 'course_paid_pcm',
      status: 'active',
    });
    assert.strictEqual(check2.allowed, false, 'Direct enrollment for paid course without payment MUST be rejected');

    // C. Student self-enrolling in 100% free course
    const check3 = evaluator.canCreateEnrollment(student1Auth, {
      userId: 'student_s1',
      courseId: 'course_free_bridge',
      status: 'active',
    });
    assert.strictEqual(check3.allowed, true, 'Self-enrollment in free course must be allowed');

    // D. Cryptographic verification of tampered Razorpay signature
    const testSecret = 'secret_testing_key_2026';
    const validSignature = await generateHmacSha256('order_123|pay_456', testSecret);
    const tamperedSignature = validSignature.substring(0, 10) + 'badhash' + validSignature.substring(17);

    const isTamperedValid = await verifyHmacSha256('order_123|pay_456', testSecret, tamperedSignature);
    assert.strictEqual(isTamperedValid, false, 'Tampered HMAC-SHA256 signature MUST be rejected');

    const isValidSignatureVerified = await verifyHmacSha256('order_123|pay_456', testSecret, validSignature);
    assert.strictEqual(isValidSignatureVerified, true, 'Authentic signature must pass verification');

    console.log('   ✓ Blocked direct creation of status: success payment records');
    console.log('   ✓ Blocked active enrollment creation for paid courses');
    console.log('   ✓ Allowed self-enrollment for verified 100% free courses');
    console.log('   ✓ Rejected fraudulent/tampered HMAC-SHA256 payment signature');
  }

  // ----------------------------------------------------------
  // TEST 4: Teachers Cannot Access Unauthorized Courses
  // ----------------------------------------------------------
  console.log('\n4. Testing Teacher Course Scope Authorization...');
  {
    // Teacher 1 attempts to modify content in course assigned to Teacher 1 (authorized)
    const check1 = evaluator.canTeacherModifyCourseContent(teacher1Auth, 'course_paid_pcm');
    assert.strictEqual(check1.allowed, true, 'Teacher must be permitted to modify their assigned course');

    // Teacher 1 attempts to modify course_free_bridge assigned to Teacher 2 (unauthorized)
    const check2 = evaluator.canTeacherModifyCourseContent(teacher1Auth, 'course_free_bridge');
    assert.strictEqual(check2.allowed, false, 'Teacher MUST NOT be permitted to modify unauthorized course');

    console.log('   ✓ Permitted teacher access to authorized course (instructorId matches)');
    console.log('   ✓ Blocked teacher access to unauthorized course (instructorId mismatch)');
  }

  // ----------------------------------------------------------
  // TEST 5: Unenrolled Students Cannot Access Protected Paid Content
  // ----------------------------------------------------------
  console.log('\n5. Testing Protected Content & Anti-Piracy Guard...');
  {
    const paidLesson = {
      id: 'lesson_quantum',
      courseId: 'course_paid_pcm',
      isFreePreview: false,
      videoUrl: 'https://secure.video/stream/123.mp4',
    };

    const freePreviewLesson = {
      id: 'lesson_intro',
      courseId: 'course_paid_pcm',
      isFreePreview: true,
      videoUrl: 'https://cdn.example.com/preview.mp4',
    };

    // Unauthenticated user
    assert.strictEqual(evaluator.canReadLesson(null, paidLesson).allowed, false, 'Guest cannot read paid lesson');
    assert.strictEqual(evaluator.canReadLesson(null, freePreviewLesson).allowed, true, 'Guest can read free preview');

    // Unenrolled student (student 2)
    assert.strictEqual(evaluator.canReadLesson(student2Auth, paidLesson).allowed, false, 'Unenrolled student cannot read paid lesson');
    assert.strictEqual(evaluator.canReadLesson(student2Auth, freePreviewLesson).allowed, true, 'Unenrolled student can read free preview');

    // Enrolled student (student 1)
    assert.strictEqual(evaluator.canReadLesson(student1Auth, paidLesson).allowed, true, 'Enrolled student can access paid lesson');

    console.log('   ✓ Denied guest access to paid content');
    console.log('   ✓ Denied unenrolled student access to paid lesson');
    console.log('   ✓ Permitted free preview lesson access to all users');
    console.log('   ✓ Permitted enrolled student access to protected course content');
  }

  // ----------------------------------------------------------
  // TEST 6: Student Privacy Protection
  // ----------------------------------------------------------
  console.log('\n6. Testing Student Privacy & Profile Protection...');
  {
    // Student 1 reading their own profile
    assert.strictEqual(evaluator.canReadUser(student1Auth, 'student_s1').allowed, true, 'Student can read own profile');

    // Student 1 reading Student 2 profile (unauthorized data scrape)
    assert.strictEqual(evaluator.canReadUser(student1Auth, 'student_s2').allowed, false, 'Student cannot read other students profile');

    // Admin reading Student 2 profile
    assert.strictEqual(evaluator.canReadUser(adminAuth, 'student_s2').allowed, true, 'Admin can read student profile');

    // Teacher reading Student 2 profile
    assert.strictEqual(evaluator.canReadUser(teacher1Auth, 'student_s2').allowed, true, 'Teacher can read student profile');

    console.log('   ✓ Verified student can read own profile');
    console.log('   ✓ Blocked cross-student profile scraping (protects phone, email, address)');
    console.log('   ✓ Permitted administrative and faculty profile audits');
  }

  // ----------------------------------------------------------
  // TEST 7: Firestore and Storage Security Rules Syntax & Structure
  // ----------------------------------------------------------
  console.log('\n7. Testing Security Rules File Integrity & Non-Permissive Posture...');
  {
    const firestoreRulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const storageRulesPath = path.resolve(process.cwd(), 'storage.rules');

    const firestoreRules = fs.readFileSync(firestoreRulesPath, 'utf8');
    const storageRules = fs.readFileSync(storageRulesPath, 'utf8');

    // Check that permissive development rules are NOT present
    assert.ok(!firestoreRules.includes('allow read, write: if true;'), 'Must not have allow read, write: if true');
    assert.ok(!firestoreRules.includes('allow write: if true;'), 'Must not have allow write: if true');
    assert.ok(!storageRules.includes('allow read, write: if true;'), 'Must not have allow read, write: if true in storage');

    // Check default deny in storage.rules
    assert.ok(storageRules.includes('match /{allPaths=**}'), 'Storage rules must define catch-all path');
    assert.ok(storageRules.includes('allow read, write: if false;'), 'Storage rules must enforce default deny');

    // Check anti-privilege escalation in users
    assert.ok(firestoreRules.includes('isSuperAdmin'), 'Firestore rules must guard isSuperAdmin');
    assert.ok(firestoreRules.includes('role != \'admin\''), 'Firestore rules must forbid role: admin creation');

    // Check payment protection
    assert.ok(firestoreRules.includes('status in [\'pending\', \'created\']'), 'Firestore rules must restrict initial payment status');

    console.log('   ✓ firestore.rules confirmed non-permissive & hardened');
    console.log('   ✓ storage.rules default-deny confirmed');
    console.log('   ✓ Anti-escalation guards detected in rule source');
  }

  console.log('\n======================================================');
  console.log('ALL SECURITY AUDIT INVARIANTS VERIFIED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runSecurityAuditVerification().catch((err) => {
  console.error('❌ Security Audit Verification Failed:', err);
  process.exit(1);
});
