import {
  setDocData,
  getDocData,
  updateDocData,
  queryCollection,
  deleteDocData,
} from '../firebase/firestore';
import { where, orderBy, limit } from 'firebase/firestore';
import { isFirebaseConfigured } from '../firebase/config';
import { cacheManager } from '../utils/cacheManager';
import type {
  Test,
  Question,
  ClientSafeQuestion,
  TestAttempt,
  QuestionResponse,
} from '../types';
import { INITIAL_TESTS } from './examSeedData';

const TESTS_COLLECTION = 'tests';
const ATTEMPTS_COLLECTION = 'test_attempts';

// 30 seconds grace period for network latency upon submission
const SUBMISSION_GRACE_PERIOD_MS = 30000;

let catalogSeeded = false;
const inMemoryAttempts = new Map<string, TestAttempt>();

export const examService = {
  /**
   * Ensure tests are seeded in Firestore (or fallback).
   */
  async ensureTestsSeeded(): Promise<void> {
    if (catalogSeeded) return;
    try {
      const existing = await queryCollection<Test>(TESTS_COLLECTION, limit(1));
      if (existing.length === 0) {
        console.log('[examService] Seeding initial examination catalog into Firestore...');
        for (const test of INITIAL_TESTS) {
          await setDocData(TESTS_COLLECTION, test.id, {
            ...test,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      catalogSeeded = true;
    } catch (err) {
      // Mark initialized to avoid repeating seed check on every high-concurrency request
      catalogSeeded = true;
    }
  },

  /**
   * Fetch all published tests available for students.
   */
  async getPublishedTests(): Promise<Test[]> {
    return cacheManager.getOrFetch('tests:published', async () => {
      await this.ensureTestsSeeded();
      try {
        const list = await queryCollection<Test>(
          TESTS_COLLECTION,
          where('isPublished', '==', true),
          orderBy('createdAt', 'desc')
        );
        if (list.length > 0) return list;
        return INITIAL_TESTS.filter((t) => t.isPublished);
      } catch (err) {
        console.warn('[examService] Error fetching published tests, using seed:', err);
        return INITIAL_TESTS.filter((t) => t.isPublished);
      }
    }, 3 * 60 * 1000);
  },

  /**
   * Fetch all tests for teachers and admin.
   */
  async getAllTests(): Promise<Test[]> {
    return cacheManager.getOrFetch('tests:all', async () => {
      await this.ensureTestsSeeded();
      try {
        const list = await queryCollection<Test>(
          TESTS_COLLECTION,
          orderBy('createdAt', 'desc')
        );
        if (list.length > 0) return list;
        return INITIAL_TESTS;
      } catch (err) {
        return INITIAL_TESTS;
      }
    }, 3 * 60 * 1000);
  },

  /**
   * Fetch a test by its ID with full authoritative questions (Backend only).
   */
  async getTestById(testId: string): Promise<Test | null> {
    await this.ensureTestsSeeded();
    try {
      const doc = await getDocData<Test>(TESTS_COLLECTION, testId);
      if (doc) return doc;
      return INITIAL_TESTS.find((t) => t.id === testId) || null;
    } catch (err) {
      return INITIAL_TESTS.find((t) => t.id === testId) || null;
    }
  },

  /**
   * Validate student test eligibility (Dates, publication, attempt limits).
   */
  async validateEligibility(
    test: Test,
    userId: string
  ): Promise<{ isEligible: boolean; reason?: string; completedAttemptsCount: number }> {
    if (!test.isPublished) {
      return { isEligible: false, reason: 'This test is currently not published.', completedAttemptsCount: 0 };
    }

    const now = Date.now();
    if (test.availableFrom && now < new Date(test.availableFrom).getTime()) {
      return {
        isEligible: false,
        reason: `This test will open on ${new Date(test.availableFrom).toLocaleString()}.`,
        completedAttemptsCount: 0,
      };
    }

    if (test.availableUntil && now > new Date(test.availableUntil).getTime()) {
      return {
        isEligible: false,
        reason: `This test expired on ${new Date(test.availableUntil).toLocaleString()}.`,
        completedAttemptsCount: 0,
      };
    }

    // Check completed attempt limits
    const existingAttempts = await this.getStudentAttemptsForTest(userId, test.id);
    const completed = existingAttempts.filter(
      (a) => a.status === 'submitted' || a.status === 'expired'
    );

    if (test.attemptLimit && test.attemptLimit > 0 && completed.length >= test.attemptLimit) {
      return {
        isEligible: false,
        reason: `Attempt limit reached. You have already completed this test ${completed.length} time(s) (Maximum allowed: ${test.attemptLimit}).`,
        completedAttemptsCount: completed.length,
      };
    }

    return { isEligible: true, completedAttemptsCount: completed.length };
  },

  /**
   * Fetches test sanitized for the student client during examination.
   * Strips correctOptionIds and explanations to prevent cheating.
   */
  async getClientSafeTest(
    testId: string,
    userId: string
  ): Promise<{ test: Omit<Test, 'questions'> & { questions: ClientSafeQuestion[] }; eligibility: any }> {
    const rawTest = await this.getTestById(testId);
    if (!rawTest) {
      throw new Error(`Test with ID ${testId} not found.`);
    }

    const eligibility = await this.validateEligibility(rawTest, userId);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.reason || 'You are not eligible to take this test.');
    }

    // Strip answers and explanations
    const safeQuestions: ClientSafeQuestion[] = (rawTest.questions || []).map(
      ({ correctOptionIds, explanation, ...safeProps }) => safeProps
    );

    return {
      test: {
        ...rawTest,
        questions: safeQuestions,
      },
      eligibility,
    };
  },

  /**
   * Starts or resumes a test attempt.
   * Server validates startedAt and calculates a strict deadline.
   */
  async startOrResumeAttempt(
    testId: string,
    userId: string,
    studentName = 'Student'
  ): Promise<{ attempt: TestAttempt; isResumed: boolean }> {
    const rawTest = await this.getTestById(testId);
    if (!rawTest) {
      throw new Error(`Test not found.`);
    }

    // Check for an existing in_progress attempt
    const existingAttempts = await this.getStudentAttemptsForTest(userId, testId);
    const activeAttempt = existingAttempts.find((a) => a.status === 'in_progress');

    const now = Date.now();
    if (activeAttempt) {
      const deadlineTime = new Date(activeAttempt.deadline).getTime();
      // If still within deadline + grace period, resume
      if (now < deadlineTime + SUBMISSION_GRACE_PERIOD_MS) {
        return { attempt: activeAttempt, isResumed: true };
      } else {
        // Expired in the background: seal it
        await updateDocData(ATTEMPTS_COLLECTION, activeAttempt.id, {
          status: 'expired',
          submittedAt: activeAttempt.deadline,
        });
      }
    }

    // Validate eligibility for a new attempt
    const eligibility = await this.validateEligibility(rawTest, userId);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.reason || 'Not eligible to start a new attempt.');
    }

    const startedAt = new Date().toISOString();
    const durationMs = (rawTest.durationMinutes || 60) * 60 * 1000;
    const deadline = new Date(now + durationMs).toISOString();
    const attemptId = `att_${userId}_${testId}_${Date.now()}`;

    const newAttempt: TestAttempt = {
      id: attemptId,
      testId: rawTest.id,
      testTitle: rawTest.title,
      userId,
      studentName,
      startedAt,
      deadline,
      status: 'in_progress',
      score: 0,
      totalMarks: rawTest.totalMarks || 100,
      percentage: 0,
      isPassed: false,
      timeSpentSeconds: 0,
      savedAnswers: {},
      markedForReviewIds: [],
      visitedQuestionIds: rawTest.questions && rawTest.questions[0] ? [rawTest.questions[0].id] : [],
      responses: [],
      createdAt: startedAt,
      updatedAt: startedAt,
    };

    inMemoryAttempts.set(attemptId, newAttempt);

    if (isFirebaseConfigured) {
      try {
        await setDocData(ATTEMPTS_COLLECTION, attemptId, newAttempt);
      } catch (err) {
        console.warn('[examService] Firestore attempt save fallback to local:', err);
      }
    }

    return { attempt: newAttempt, isResumed: false };
  },

  /**
   * Save draft answers periodically or upon question advance.
   * Note: Countdown is strictly computed locally from attempt.deadline; NO countdown writes.
   */
  async saveDraftAnswers(
    attemptId: string,
    userId: string,
    savedAnswers: Record<string, string[]>,
    markedForReviewIds: string[],
    visitedQuestionIds: string[],
    timeSpentSeconds: number
  ): Promise<void> {
    try {
      await updateDocData(ATTEMPTS_COLLECTION, attemptId, {
        savedAnswers,
        markedForReviewIds,
        visitedQuestionIds,
        timeSpentSeconds,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      // Non-blocking for offline resilience
      console.warn('[examService] Draft save failed or offline:', err);
    }
  },

  /**
   * Evaluates student submission on trusted backend logic.
   * Prevents duplicate submissions and evaluates against authoritative answer keys.
   */
  async submitTestAttempt(
    attemptId: string,
    userId: string,
    answers: Record<string, string[]>,
    timeSpentSeconds: number
  ): Promise<TestAttempt> {
    // 1. Fetch attempt and check if already submitted
    let attempt: TestAttempt | null = inMemoryAttempts.get(attemptId) || null;
    if (!attempt && isFirebaseConfigured) {
      try {
        attempt = await getDocData<TestAttempt>(ATTEMPTS_COLLECTION, attemptId);
      } catch {
        // Offline fallback
      }
    }
    if (!attempt) {
      // Local demo fallback if Firestore was unreachable
      attempt = {
        id: attemptId,
        testId: '',
        testTitle: 'Practice Test',
        userId,
        startedAt: new Date(Date.now() - timeSpentSeconds * 1000).toISOString(),
        deadline: new Date(Date.now() + 60000).toISOString(),
        status: 'in_progress',
        score: 0,
        totalMarks: 100,
        percentage: 0,
        isPassed: false,
        timeSpentSeconds,
        responses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (attempt.status === 'submitted') {
      console.warn('[examService] Attempt was already submitted. Returning existing evaluation.');
      return attempt;
    }

    // 2. Fetch authoritative test with secret answer keys
    const test = await this.getTestById(attempt.testId || 'test_math_10');
    if (!test || !test.questions || test.questions.length === 0) {
      throw new Error('Test curriculum definition could not be located for evaluation.');
    }

    // 3. Deadline validation with 30s network grace period
    const now = Date.now();
    const deadlineTime = new Date(attempt.deadline).getTime();
    const isLate = now > deadlineTime + SUBMISSION_GRACE_PERIOD_MS;

    // 4. Authoritative evaluation algorithm
    let calculatedScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    const evaluatedResponses: QuestionResponse[] = [];

    for (const q of test.questions) {
      const selected = answers[q.id] || [];
      const correctOptionIds = q.correctOptionIds || [];

      if (selected.length === 0) {
        unattemptedCount++;
        evaluatedResponses.push({
          questionId: q.id,
          selectedOptionIds: [],
          isCorrect: false,
          marksObtained: 0,
          timeSpentSeconds: Math.round(timeSpentSeconds / test.questions.length),
        });
        continue;
      }

      // Check if arrays match exactly
      const sortedSelected = [...selected].sort();
      const sortedCorrect = [...correctOptionIds].sort();
      const isCorrect =
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((val, idx) => val === sortedCorrect[idx]);

      if (isCorrect) {
        correctCount++;
        const marks = q.marks || 4;
        calculatedScore += marks;
        evaluatedResponses.push({
          questionId: q.id,
          selectedOptionIds: selected,
          isCorrect: true,
          marksObtained: marks,
          timeSpentSeconds: Math.round(timeSpentSeconds / test.questions.length),
        });
      } else {
        incorrectCount++;
        const neg = test.negativeMarking ? (q.negativeMarks || 1) : 0;
        calculatedScore -= neg;
        evaluatedResponses.push({
          questionId: q.id,
          selectedOptionIds: selected,
          isCorrect: false,
          marksObtained: -neg,
          timeSpentSeconds: Math.round(timeSpentSeconds / test.questions.length),
        });
      }
    }

    const totalMarks = test.totalMarks || (test.questions.length * 4);
    // Score cannot be lower than 0
    const finalScore = Math.max(0, calculatedScore);
    const percentage = Math.round((finalScore / totalMarks) * 100);
    const passingMarks = test.passingMarks || Math.round(totalMarks * 0.4);
    const isPassed = finalScore >= passingMarks;

    const attemptedTotal = correctCount + incorrectCount;
    const accuracyPercentage =
      attemptedTotal > 0 ? Math.round((correctCount / attemptedTotal) * 100) : 0;

    const evaluatedAttempt: TestAttempt = {
      ...attempt,
      status: isLate ? 'expired' : 'submitted',
      submittedAt: new Date().toISOString(),
      score: finalScore,
      totalMarks,
      percentage,
      isPassed,
      timeSpentSeconds,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      unattemptedCount,
      accuracyPercentage,
      savedAnswers: answers,
      responses: evaluatedResponses,
      updatedAt: new Date().toISOString(),
    };

    inMemoryAttempts.set(attemptId, evaluatedAttempt);

    if (isFirebaseConfigured) {
      try {
        await updateDocData(ATTEMPTS_COLLECTION, attemptId, evaluatedAttempt);
      } catch (err) {
        console.warn('[examService] Error updating finalized attempt in Firestore:', err);
      }
    }

    return evaluatedAttempt;
  },

  /**
   * Fetch a completed attempt together with authoritative solutions and faculty explanations.
   */
  async getAttemptWithSolutions(
    attemptId: string,
    userId: string
  ): Promise<{ attempt: TestAttempt; test: Test }> {
    let attempt = inMemoryAttempts.get(attemptId) || null;
    if (!attempt) {
      try {
        attempt = await getDocData<TestAttempt>(ATTEMPTS_COLLECTION, attemptId);
      } catch {
        // Fallback
      }
    }

    if (!attempt) {
      throw new Error(`Attempt ${attemptId} not found.`);
    }

    const test = await this.getTestById(attempt.testId);
    if (!test) {
      throw new Error(`Test associated with attempt not found.`);
    }

    return { attempt, test };
  },

  /**
   * Get all test attempts for a given student.
   */
  async getStudentAttempts(userId: string): Promise<TestAttempt[]> {
    try {
      return await queryCollection<TestAttempt>(
        ATTEMPTS_COLLECTION,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    } catch (err) {
      console.warn('[examService] Error fetching student attempts:', err);
      return [];
    }
  },

  /**
   * Get all student attempts across all tests for analytics & faculty tracking.
   */
  async getAllAttempts(): Promise<TestAttempt[]> {
    return cacheManager.getOrFetch('exam:attempts:all', async () => {
      try {
        return await queryCollection<TestAttempt>(
          ATTEMPTS_COLLECTION,
          orderBy('createdAt', 'desc')
        );
      } catch (err) {
        console.warn('[examService] Error fetching all attempts:', err);
        return Array.from(inMemoryAttempts.values());
      }
    }, 2 * 60 * 1000);
  },

  /**
   * Get student attempts for a specific test.
   */
  async getStudentAttemptsForTest(
    userId: string,
    testId: string
  ): Promise<TestAttempt[]> {
    try {
      return await queryCollection<TestAttempt>(
        ATTEMPTS_COLLECTION,
        where('userId', '==', userId),
        where('testId', '==', testId),
        orderBy('createdAt', 'desc')
      );
    } catch (err) {
      return [];
    }
  },

  /**
   * Teacher / Admin: Save or update test configuration and question bank.
   */
  async saveTest(
    testData: Partial<Test>,
    userEmail = 'teacher@brainstorm.edu'
  ): Promise<string> {
    const id = testData.id || `test_${Date.now()}`;
    const totalMarks =
      testData.questions && testData.questions.length > 0
        ? testData.questions.reduce((sum, q) => sum + (q.marks || 4), 0)
        : testData.totalMarks || 100;

    const payload: Partial<Test> = {
      id,
      title: testData.title || 'Untitled Assessment',
      subjectName: testData.subjectName || 'General',
      classGrade: testData.classGrade || 'Class 10',
      durationMinutes: testData.durationMinutes || 60,
      totalMarks,
      passingMarks: testData.passingMarks || Math.round(totalMarks * 0.4),
      questionsCount: testData.questions ? testData.questions.length : 25,
      questions: testData.questions || [],
      isPublished: testData.isPublished ?? true,
      negativeMarking: testData.negativeMarking ?? true,
      allowRetake: testData.allowRetake ?? true,
      attemptLimit: testData.attemptLimit || 0,
      instructorId: testData.instructorId || userEmail || 'instructor_faculty',
      instructorName: testData.instructorName || 'Faculty Instructor',
      instructions: testData.instructions || [
        'Each question has four options with exactly one correct answer.',
        'Negative marking applies for incorrect choices as per the test rules.',
        'The examination will automatically submit when the countdown reaches zero.',
        'Do not refresh the browser or switch tabs repeatedly during the test.',
      ],
      createdAt: testData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...testData,
    };

    await setDocData(TESTS_COLLECTION, id, payload);
    cacheManager.invalidate('tests:all');
    cacheManager.invalidate('tests:published');
    cacheManager.invalidateByPrefix('tests');
    return id;
  },

  /**
   * Teacher / Admin: Delete a test.
   */
  async deleteTest(testId: string): Promise<void> {
    await deleteDocData(TESTS_COLLECTION, testId);
    cacheManager.invalidate('tests:all');
    cacheManager.invalidate('tests:published');
    cacheManager.invalidateByPrefix('tests');
  },

  /**
   * Teacher / Admin: Toggle test publication.
   */
  async toggleTestPublication(testId: string, currentStatus: boolean): Promise<boolean> {
    const newStatus = !currentStatus;
    await updateDocData(TESTS_COLLECTION, testId, {
      isPublished: newStatus,
      updatedAt: new Date().toISOString(),
    });
    cacheManager.invalidate('tests:all');
    cacheManager.invalidate('tests:published');
    cacheManager.invalidateByPrefix('tests');
    return newStatus;
  },
};

export default examService;
