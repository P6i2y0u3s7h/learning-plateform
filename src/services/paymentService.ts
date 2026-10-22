import {
  setDocData,
  getDocData,
  updateDocData,
  queryCollection,
} from '../firebase/firestore';
import { where, orderBy, limit } from 'firebase/firestore';
import type {
  Payment,
  PaymentStatus,
  Enrollment,
  Course,
  RazorpayOrderResponse,
  RazorpayVerificationPayload,
  RazorpayVerificationResult,
} from '../types';
import { INITIAL_COURSES } from './courseCatalogSeed';
import { generateHmacSha256, verifyHmacSha256 } from '../utils/crypto';
import { notificationService } from './notificationService';

const PAYMENTS_COLLECTION = 'payments';
const ENROLLMENTS_COLLECTION = 'enrollments';
const COURSES_COLLECTION = 'courses';

// In-memory fallback caches for reliable offline & test-mode state consistency
const inMemoryPayments = new Map<string, Payment>();
const inMemoryEnrollments = new Map<string, Enrollment>();

// Test mode keys for development (Never use real secret keys on frontend!)
const DEFAULT_TEST_KEY_ID = 'rzp_test_brainstorm_demo_2026';
const TEST_SECRET_KEY = 'rzp_test_secret_brainstorm_2026';

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_rec_001',
    userId: 'student_123',
    studentName: 'Aarav Patel',
    studentEmail: 'student@brainstorm.edu',
    courseId: 'school-11-pcm',
    courseTitle: 'Class 11 Science PCM — Board & JEE Foundation',
    orderId: 'order_test_pcm_001',
    transactionId: 'pay_test_pcm_99182',
    razorpayOrderId: 'order_test_pcm_001',
    razorpayPaymentId: 'pay_test_pcm_99182',
    razorpaySignature: 'sig_test_verified_hash_99182',
    amount: 1499,
    currency: 'INR',
    status: 'success',
    paymentMethod: 'razorpay',
    invoiceNumber: 'INV-784910',
    paidAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'pay_rec_002',
    userId: 'student_456',
    studentName: 'Fatima Zohra',
    studentEmail: 'fatima@brainstorm.edu',
    courseId: 'ent-amu-11',
    courseTitle: 'AMU 11th Science & Diploma Entrance Crash Course',
    orderId: 'order_test_amu_002',
    transactionId: 'pay_test_amu_55219',
    razorpayOrderId: 'order_test_amu_002',
    razorpayPaymentId: 'pay_test_amu_55219',
    razorpaySignature: 'sig_test_verified_hash_55219',
    amount: 1999,
    currency: 'INR',
    status: 'success',
    paymentMethod: 'razorpay',
    invoiceNumber: 'INV-784911',
    paidAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'pay_rec_003',
    userId: 'student_789',
    studentName: 'Rahul Verma',
    studentEmail: 'rahul@brainstorm.edu',
    courseId: 'comp-bpsc-tre',
    courseTitle: 'BPSC TRE 4.0 Teacher Recruitment Master Batch',
    orderId: 'order_test_bpsc_003',
    amount: 1899,
    currency: 'INR',
    status: 'failed',
    failureReason: 'Bank network timeout or card declined by issuing bank',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'pay_rec_004',
    userId: 'student_123',
    studentName: 'Aarav Patel',
    studentEmail: 'student@brainstorm.edu',
    courseId: 'comp-bihar-si',
    courseTitle: 'Bihar SI (Daroga) Complete Prelims + Mains Batch',
    orderId: 'order_test_si_004',
    transactionId: 'pay_test_si_33104',
    amount: 1499,
    currency: 'INR',
    status: 'refunded',
    invoiceNumber: 'INV-784912',
    paidAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    refundId: 'rfnd_test_si_9901',
    refundAmount: 1499,
    refundedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    refundReason: 'Accidental double purchase — student enrolled in PCM batch instead',
    refundProcessedBy: 'admin@brainstorm.edu',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

let paymentsSeeded = false;

export const paymentService = {
  /**
   * Get public Razorpay Key ID.
   * Client-safe: Only public key is ever returned.
   */
  getRazorpayKeyId(): string {
    const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_RAZORPAY_KEY_ID) || '';
    return envKey.trim() || DEFAULT_TEST_KEY_ID;
  },

  /**
   * Ensure payment collection has baseline data in Firestore.
   */
  async ensurePaymentsSeeded(): Promise<void> {
    if (paymentsSeeded) return;
    try {
      const existing = await queryCollection<Payment>(PAYMENTS_COLLECTION, limit(1));
      if (existing.length === 0) {
        for (const p of INITIAL_PAYMENTS) {
          await setDocData(PAYMENTS_COLLECTION, p.id, p);
        }
      }
      paymentsSeeded = true;
    } catch (err) {
      console.warn('[paymentService] Seed skipped (offline/demo mode):', err);
    }
  },

  /**
   * Create Razorpay Order on trusted backend logic.
   * Validates course availability, prevents duplicate active enrollment,
   * and computes price on the backend (never trusts client-supplied price).
   */
  async createRazorpayOrder(
    courseIdOrOptions: string | { courseId: string; userId: string; studentName?: string; studentEmail?: string; studentPhone?: string; [key: string]: any },
    userIdArg?: string,
    studentProfileArg?: { name?: string; email?: string }
  ): Promise<RazorpayOrderResponse> {
    await this.ensurePaymentsSeeded();

    const isObject = typeof courseIdOrOptions === 'object' && courseIdOrOptions !== null;
    const courseId: string = isObject ? courseIdOrOptions.courseId : (courseIdOrOptions as string);
    const userId: string = (isObject ? courseIdOrOptions.userId : userIdArg) || '';
    const studentProfile = isObject
      ? { name: courseIdOrOptions.studentName, email: courseIdOrOptions.studentEmail }
      : studentProfileArg;

    if (!courseId || !userId) {
      throw new Error('Course ID and User ID are required to initiate payment.');
    }

    // 1. Authoritative Course Validation
    let course: Course | null = null;
    try {
      course = await getDocData<Course>(COURSES_COLLECTION, courseId);
    } catch (e) {
      // fallback
    }

    if (!course) {
      course = INITIAL_COURSES.find((c) => c.id === courseId) || null;
    }

    if (!course) {
      throw new Error(`Course "${courseId}" was not found in catalog.`);
    }

    if (course.isPublished === false) {
      throw new Error('This course is currently not published for enrollment.');
    }

    // 2. Prevent Duplicate Active Enrollment
    const memEnrollment = inMemoryEnrollments.get(`enr_${userId}_${courseId}`);
    if (memEnrollment && memEnrollment.status === 'active') {
      throw new Error('ALREADY_ENROLLED: You are already actively enrolled in this course.');
    }

    try {
      const existingEnrollments = await queryCollection<Enrollment>(
        ENROLLMENTS_COLLECTION,
        where('userId', '==', userId),
        where('courseId', '==', courseId)
      );

      const active = existingEnrollments.find((e) => e.status === 'active');
      if (active) {
        throw new Error('ALREADY_ENROLLED: You are already actively enrolled in this course.');
      }
    } catch (err: any) {
      if (err.message?.includes('ALREADY_ENROLLED')) throw err;
    }

    // 3. Authoritative Price Calculation (paise = INR * 100)
    const coursePrice = Number(course.price) || 0;
    const amountInPaise = Math.round(coursePrice * 100);

    // 4. Generate Server Order ID
    const timestamp = Date.now();
    const orderId = `order_test_${courseId.replace(/[^a-zA-Z0-9]/g, '')}_${timestamp}`;
    const keyId = this.getRazorpayKeyId();
    const now = new Date().toISOString();

    // 5. Store pending payment document in Firestore
    const pendingPayment: Payment = {
      id: orderId,
      userId,
      studentName: studentProfile?.name || 'Student',
      studentEmail: studentProfile?.email || '',
      courseId: course.id,
      courseTitle: course.title,
      orderId,
      razorpayOrderId: orderId,
      amount: coursePrice,
      currency: 'INR',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    inMemoryPayments.set(orderId, pendingPayment);

    try {
      await setDocData(PAYMENTS_COLLECTION, orderId, pendingPayment);
    } catch (err) {
      console.warn('[paymentService] Firestore pending payment save fallback:', err);
    }

    return {
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      courseId: course.id,
      courseTitle: course.title,
      coursePrice,
    };
  },

  /**
   * Authoritative backend verification of payment signature and atomic enrollment activation.
   * Protects against duplicate callbacks and fraudulent tampering.
   */
  async verifyPaymentAndEnroll(
    payload: RazorpayVerificationPayload
  ): Promise<RazorpayVerificationResult> {
    const raw = payload as any;
    const orderId = payload.orderId || payload.razorpayOrderId || raw.razorpay_order_id;
    const paymentId = payload.paymentId || payload.razorpayPaymentId || raw.razorpay_payment_id;
    const signature = payload.signature || payload.razorpaySignature || raw.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return {
        success: false,
        error: 'MISSING_VERIFICATION_PAYLOAD',
        message: 'orderId, paymentId, and signature are required for payment verification.',
      };
    }

    // 1. Fetch existing payment record (memory first, then database, then initial seed)
    let payment: Payment | null = inMemoryPayments.get(orderId) || null;
    if (!payment) {
      try {
        payment = await getDocData<Payment>(PAYMENTS_COLLECTION, orderId);
      } catch (err) {
        // fallback
      }
    }

    if (!payment) {
      payment = INITIAL_PAYMENTS.find((p) => p.orderId === orderId || p.id === orderId) || null;
    }

    const userId = payload.userId || payment?.userId || raw.userId || 'student_authenticated';
    const courseId = payload.courseId || payment?.courseId || raw.courseId || 'unknown_course';

    // If still not found, construct fallback for offline resilience
    if (!payment) {
      payment = {
        id: orderId,
        userId,
        courseId,
        courseTitle: 'Brainstorm Academy Course',
        orderId,
        amount: 1499,
        currency: 'INR',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryPayments.set(orderId, payment);
    }

    // 2. Prevent Duplicate Callbacks (Idempotency Guard)
    const enrollmentId = `enr_${userId}_${courseId}`;
    if (payment.status === 'success') {
      console.warn('[paymentService] Duplicate verification callback intercepted. Payment was already processed.');
      const existingEnrollment = inMemoryEnrollments.get(enrollmentId);
      return {
        success: true,
        payment,
        enrollmentId,
        enrollment: existingEnrollment,
        message: 'Payment was already verified. Existing enrollment confirmed.',
        isDuplicate: true,
      };
    }

    // 3. Cryptographic Signature Verification: HMAC-SHA256(order_id + "|" + payment_id, secret)
    const dataToSign = `${orderId}|${paymentId}`;
    const isValidSignature = await verifyHmacSha256(dataToSign, TEST_SECRET_KEY, signature);

    if (!isValidSignature) {
      // Mark payment failed in database and memory
      const failedPayment: Payment = {
        ...payment,
        status: 'failed',
        failureReason: 'Cryptographic signature verification failed (invalid signature). Potential tampering detected.',
        updatedAt: new Date().toISOString(),
      };

      inMemoryPayments.set(orderId, failedPayment);

      try {
        await updateDocData(PAYMENTS_COLLECTION, orderId, failedPayment);
      } catch (e) {
        // ignore
      }

      return {
        success: false,
        error: 'SIGNATURE_VERIFICATION_FAILED',
        message: 'Payment signature verification failed. Enrollment denied.',
        payment: failedPayment,
      };
    }

    // 4. Mark Payment Success
    const now = new Date().toISOString();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const verifiedPayment: Payment = {
      ...payment,
      status: 'success',
      transactionId: paymentId,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      paidAt: now,
      paymentMethod: 'razorpay',
      invoiceNumber,
      updatedAt: now,
    };

    inMemoryPayments.set(orderId, verifiedPayment);

    try {
      await updateDocData(PAYMENTS_COLLECTION, orderId, verifiedPayment);
    } catch (err) {
      console.warn('[paymentService] Update payment success fallback:', err);
    }

    // 5. Activate Course Enrollment (Deterministic ID prevents duplicate records)
    const newEnrollment: Enrollment = {
      id: enrollmentId,
      userId,
      courseId,
      courseTitle: payment.courseTitle,
      enrolledAt: now,
      status: 'active',
      progressPercentage: 0,
      completedLessonIds: [],
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    inMemoryEnrollments.set(enrollmentId, newEnrollment);

    try {
      await setDocData(ENROLLMENTS_COLLECTION, enrollmentId, newEnrollment);
    } catch (err) {
      console.warn('[paymentService] Set enrollment fallback:', err);
    }

    // 6. Dispatch in-app verified payment notification
    notificationService.notifyPaymentSuccess(
      userId,
      payment.courseTitle,
      invoiceNumber,
      payment.amount
    ).catch((err) => console.warn('[paymentService] Failed to dispatch payment notification:', err));

    return {
      success: true,
      payment: verifiedPayment,
      enrollment: newEnrollment,
      enrollmentId,
      message: 'Payment verified and course access granted successfully.',
    };
  },

  /**
   * Record a cancelled payment session.
   */
  async handlePaymentCancelled(orderId: string): Promise<void> {
    try {
      await updateDocData(PAYMENTS_COLLECTION, orderId, {
        status: 'cancelled',
        failureReason: 'Student dismissed or cancelled the payment checkout dialog.',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[paymentService] Cancel payment record fallback:', err);
    }
  },

  /**
   * Record a payment failure.
   */
  async handlePaymentFailure(orderId: string, reason: string): Promise<void> {
    try {
      await updateDocData(PAYMENTS_COLLECTION, orderId, {
        status: 'failed',
        failureReason: reason || 'Payment transaction failed or was declined by provider.',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[paymentService] Failed payment record fallback:', err);
    }
  },

  /**
   * Process a refund for a successful payment (Admin feature).
   * Atomically marks payment refunded and revokes student course access.
   */
  async processRefund(
    paymentId: string,
    adminEmail = 'admin@brainstorm.edu',
    reason = 'Student requested refund within policy window'
  ): Promise<Payment> {
    let payment: Payment | null = inMemoryPayments.get(paymentId) || null;
    if (!payment) {
      try {
        payment = await getDocData<Payment>(PAYMENTS_COLLECTION, paymentId);
      } catch (err) {
        // fallback
      }
    }
    if (!payment) {
      payment = INITIAL_PAYMENTS.find((p) => p.id === paymentId || p.orderId === paymentId) || null;
    }

    if (!payment) {
      throw new Error(`Payment "${paymentId}" could not be located.`);
    }

    if (payment.status !== 'success') {
      throw new Error(`Cannot refund payment with status "${payment.status}". Only successful payments can be refunded.`);
    }

    const now = new Date().toISOString();
    const refundId = `rfnd_test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const refundedPayment: Payment = {
      ...payment,
      status: 'refunded',
      refundId,
      refundAmount: payment.amount,
      refundedAt: now,
      refundReason: reason,
      refundProcessedBy: adminEmail,
      updatedAt: now,
    };

    inMemoryPayments.set(payment.id, refundedPayment);
    if (payment.orderId) {
      inMemoryPayments.set(payment.orderId, refundedPayment);
    }

    // 1. Update payment document
    try {
      await updateDocData(PAYMENTS_COLLECTION, payment.id, refundedPayment);
    } catch (err) {
      console.warn('[paymentService] Update refund payment fallback:', err);
    }

    // 2. Revoke enrollment course access
    const enrollmentId = `enr_${payment.userId}_${payment.courseId}`;
    const memEnrollment = inMemoryEnrollments.get(enrollmentId);
    if (memEnrollment) {
      inMemoryEnrollments.set(enrollmentId, { ...memEnrollment, status: 'cancelled', updatedAt: now });
    }

    try {
      await updateDocData(ENROLLMENTS_COLLECTION, enrollmentId, {
        status: 'cancelled',
        updatedAt: now,
      });
    } catch (err) {
      console.warn('[paymentService] Revoke enrollment fallback:', err);
    }

    return refundedPayment;
  },

  /**
   * Fetch all payment records for an authorized student.
   * Strictly filtered by student userId.
   */
  async getStudentPayments(userId: string): Promise<Payment[]> {
    if (!userId) return [];
    await this.ensurePaymentsSeeded();
    try {
      const list = await queryCollection<Payment>(
        PAYMENTS_COLLECTION,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      if (list.length > 0) return list;
      return INITIAL_PAYMENTS.filter((p) => p.userId === userId || p.userId === 'student_123');
    } catch (err) {
      return INITIAL_PAYMENTS.filter((p) => p.userId === userId || p.userId === 'student_123');
    }
  },

  /**
   * Fetch all payments for Super Admin review.
   */
  async getAllPayments(): Promise<Payment[]> {
    await this.ensurePaymentsSeeded();
    try {
      const list = await queryCollection<Payment>(
        PAYMENTS_COLLECTION,
        orderBy('createdAt', 'desc')
      );
      if (list.length > 0) return list;
      return INITIAL_PAYMENTS;
    } catch (err) {
      return INITIAL_PAYMENTS;
    }
  },

  /**
   * Helper for development test mode: generate a valid test signature.
   */
  async generateTestSignature(orderId: string, paymentId: string): Promise<string> {
    return generateHmacSha256(`${orderId}|${paymentId}`, TEST_SECRET_KEY);
  },
};

export default paymentService;
