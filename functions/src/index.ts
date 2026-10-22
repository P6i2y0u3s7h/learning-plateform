import * as functions from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://brainstorm-academy-30222-default-rtdb.firebaseio.com',
  });
}

const db = admin.firestore();
const rtdb = admin.database();

const HIGH_CONCURRENCY_CONFIG = {
  cors: true,
  concurrency: 80, // 80 simultaneous requests per container instance
  minInstances: 2, // Warm instances to mitigate cold starts during peak spikes
  maxInstances: 150, // Scales to 12,000 concurrent requests across containers
  memory: '512MiB' as const,
  timeoutSeconds: 60,
};

/**
 * 1. Secure Server-Authoritative Razorpay Order Creation
 * Validates course existence, retrieves authoritative price, rejects client price tampering.
 */
export const createRazorpayOrder = functions.onCall(
  HIGH_CONCURRENCY_CONFIG,
  async (request) => {
    // 1. Authentication check
    if (!request.auth) {
      throw new functions.HttpsError(
        'unauthenticated',
        'Authentication required to create a payment order.'
      );
    }

    const { courseId } = request.data;
    if (!courseId || typeof courseId !== 'string') {
      throw new functions.HttpsError(
        'invalid-argument',
        'Valid course ID must be provided.'
      );
    }

    const userId = request.auth.uid;

    // 2. Authoritative database lookup
    const courseSnap = await db.collection('courses').doc(courseId).get();
    if (!courseSnap.exists) {
      throw new functions.HttpsError('not-found', 'The requested course does not exist.');
    }

    const course = courseSnap.data();
    if (!course?.isPublished) {
      throw new functions.HttpsError(
        'failed-precondition',
        'Course is not currently published for enrollment.'
      );
    }

    // 3. Duplicate enrollment prevention
    const enrollmentId = `enr_${userId}_${courseId}`;
    const enrSnap = await db.collection('enrollments').doc(enrollmentId).get();
    if (enrSnap.exists && enrSnap.data()?.status === 'active') {
      throw new functions.HttpsError(
        'already-exists',
        'You are already actively enrolled in this course.'
      );
    }

    // 4. Resolve authoritative price (client-supplied amount is ignored!)
    const authoritativePrice = Number(course.price) || 0;
    if (authoritativePrice <= 0) {
      throw new functions.HttpsError(
        'invalid-argument',
        'This course is free. Please enroll directly without payment gateway.'
      );
    }

    // Amount in paise
    const amountInPaise = Math.round(authoritativePrice * 100);
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 5. Store pending payment record in Firestore via Admin SDK
    const now = new Date().toISOString();
    const paymentRecord = {
      id: orderId,
      userId,
      studentName: request.auth.token.name || 'Student',
      studentEmail: request.auth.token.email || '',
      courseId,
      courseTitle: course.title || 'Course',
      orderId,
      amount: authoritativePrice,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'razorpay',
      signatureVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('payments').doc(orderId).set(paymentRecord);

    return {
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_public_key',
    };
  }
);

/**
 * 2. Secure Server-Authoritative Razorpay Payment Verification
 * Validates HMAC-SHA256 signature using secret key in server environment, activates enrollment atomically.
 */
export const verifyRazorpayPayment = functions.onCall(
  HIGH_CONCURRENCY_CONFIG,
  async (request) => {
    if (!request.auth) {
      throw new functions.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { orderId, paymentId, signature } = request.data;
    if (!orderId || !paymentId || !signature) {
      throw new functions.HttpsError('invalid-argument', 'Missing required payment verification parameters.');
    }

    const userId = request.auth.uid;
    const paymentRef = db.collection('payments').doc(orderId);
    const paymentSnap = await paymentRef.get();

    if (!paymentSnap.exists) {
      throw new functions.HttpsError('not-found', 'Payment order record was not found.');
    }

    const payment = paymentSnap.data()!;
    if (payment.userId !== userId) {
      throw new functions.HttpsError('permission-denied', 'Unauthorized access to payment transaction.');
    }

    // Idempotency: If already verified, return confirmation immediately
    if (payment.status === 'success') {
      const enrollmentId = `enr_${userId}_${payment.courseId}`;
      const enrDoc = await db.collection('enrollments').doc(enrollmentId).get();
      return {
        success: true,
        message: 'Payment already verified.',
        enrollmentId,
        enrollment: enrDoc.data(),
      };
    }

    // 3. Cryptographic Signature Verification on Backend
    const secretKey = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_brainstorm_2026';
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(`${orderId}|${paymentId}`);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature !== signature) {
      await paymentRef.update({
        status: 'failed',
        failureReason: 'Cryptographic signature mismatch. Potential tampering detected.',
        updatedAt: new Date().toISOString(),
      });
      throw new functions.HttpsError(
        'permission-denied',
        'Payment signature verification failed. Potential tampering detected.'
      );
    }

    // 4. Atomic Verification & Enrollment Activation
    const now = new Date().toISOString();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const enrollmentId = `enr_${userId}_${payment.courseId}`;

    const batch = db.batch();

    batch.update(paymentRef, {
      status: 'success',
      transactionId: paymentId,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      signatureVerified: true,
      paidAt: now,
      invoiceNumber,
      updatedAt: now,
    });

    const enrollmentRef = db.collection('enrollments').doc(enrollmentId);
    batch.set(enrollmentRef, {
      id: enrollmentId,
      userId,
      courseId: payment.courseId,
      courseTitle: payment.courseTitle,
      studentName: payment.studentName,
      enrolledAt: now,
      status: 'active',
      isPaid: true,
      progressPercentage: 0,
      completedLessonIds: [],
      createdAt: now,
      updatedAt: now,
    });

    await batch.commit();

    return {
      success: true,
      message: 'Payment verified and enrollment activated.',
      enrollmentId,
      invoiceNumber,
    };
  }
);

/**
 * 3. Secure Role Management: Super Admin Promotion
 * Callable strictly by an existing Super Admin or trusted pipeline.
 */
export const promoteToSuperAdmin = functions.onCall(
  { cors: true },
  async (request) => {
    if (!request.auth || !request.auth.token.superAdmin) {
      throw new functions.HttpsError(
        'permission-denied',
        'Super Administrator privileges required.'
      );
    }

    const { targetUid } = request.data;
    if (!targetUid || typeof targetUid !== 'string') {
      throw new functions.HttpsError('invalid-argument', 'Target user UID must be provided.');
    }

    // Set custom user claims via Admin Auth
    await admin.auth().setCustomUserClaims(targetUid, {
      role: 'admin',
      admin: true,
      superAdmin: true,
    });

    // Update Firestore document
    await db.collection('users').doc(targetUid).set(
      {
        role: 'admin',
        isSuperAdmin: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, message: `User ${targetUid} promoted to Super Admin.` };
  }
);

/**
 * 4. Secure Teacher Approval
 * Callable strictly by an Admin.
 */
export const approveTeacherAccount = functions.onCall(
  { cors: true },
  async (request) => {
    if (!request.auth || (!request.auth.token.admin && request.auth.token.role !== 'admin')) {
      throw new functions.HttpsError('permission-denied', 'Admin privileges required.');
    }

    const { teacherUid } = request.data;
    if (!teacherUid || typeof teacherUid !== 'string') {
      throw new functions.HttpsError('invalid-argument', 'Target teacher UID is required.');
    }

    await admin.auth().setCustomUserClaims(teacherUid, {
      role: 'teacher',
      teacherApproved: true,
    });

    await db.collection('users').doc(teacherUid).set(
      {
        role: 'teacher',
        approvalStatus: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { success: true, message: `Teacher ${teacherUid} approved.` };
  }
);

/**
 * Helper: Authorize that the calling user is an Administrator
 */
async function assertCallerIsAdmin(request: functions.CallableRequest): Promise<string> {
  if (!request.auth) {
    throw new functions.HttpsError('unauthenticated', 'Administrator authentication required.');
  }
  const callerUid = request.auth.uid;

  // 1. Check custom claim
  if (request.auth.token.role === 'admin' || request.auth.token.admin) {
    return callerUid;
  }

  // 2. Check Realtime Database /users/{callerUid}/role
  try {
    const snap = await rtdb.ref(`users/${callerUid}/role`).get();
    if (snap.exists() && snap.val() === 'admin') {
      return callerUid;
    }
  } catch {}

  // 3. Fallback: Check Firestore
  try {
    const fsSnap = await db.collection('users').doc(callerUid).get();
    if (fsSnap.exists && (fsSnap.data()?.role === 'admin' || fsSnap.data()?.isSuperAdmin)) {
      return callerUid;
    }
  } catch {}

  throw new functions.HttpsError(
    'permission-denied',
    'Forbidden: Administrator privileges are required to perform this action.'
  );
}

/**
 * 5. Secure Add Teacher by Admin
 * Creates the Firebase Authentication account on trusted server without affecting current admin session.
 * Writes /users/{uid} profile to Realtime Database and synchronizes Firestore.
 */
export const createTeacherAccountByAdmin = functions.onCall(
  { cors: true },
  async (request) => {
    await assertCallerIsAdmin(request);

    const { name, email, password, status } = request.data || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new functions.HttpsError('invalid-argument', 'Full name is required.');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new functions.HttpsError('invalid-argument', 'Valid email address is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new functions.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name.trim();
    const accountStatus = status === 'disabled' ? 'disabled' : 'active';

    try {
      // 1. Create Firebase Authentication account via Admin SDK
      const userRecord = await admin.auth().createUser({
        email: normalizedEmail,
        password,
        displayName,
        emailVerified: true,
        disabled: accountStatus === 'disabled',
      });

      // 2. Set Custom User Claims for role
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: 'teacher',
        teacherApproved: true,
      });

      const now = Date.now();

      // 3. Create Realtime Database profile at /users/{uid}
      await rtdb.ref(`users/${userRecord.uid}`).set({
        uid: userRecord.uid,
        name: displayName,
        email: normalizedEmail,
        role: 'teacher',
        status: accountStatus,
        createdAt: now,
      });

      // 4. Synchronize Firestore profile
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        uid: userRecord.uid,
        displayName,
        email: normalizedEmail,
        role: 'teacher',
        approvalStatus: 'approved',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'Teacher account created successfully.',
        uid: userRecord.uid,
        user: {
          uid: userRecord.uid,
          name: displayName,
          email: normalizedEmail,
          role: 'teacher',
          status: accountStatus,
          createdAt: now,
        },
      };
    } catch (err: any) {
      if (err?.code === 'auth/email-already-exists') {
        throw new functions.HttpsError('already-exists', 'An account with this email address already exists.');
      }
      throw new functions.HttpsError('internal', err?.message || 'Failed to create teacher account.');
    }
  }
);

/**
 * 6. Secure Add Admin by Admin
 * Creates another administrator account via Admin SDK without logging out current administrator.
 */
export const createAdminAccountByAdmin = functions.onCall(
  { cors: true },
  async (request) => {
    await assertCallerIsAdmin(request);

    const { name, email, password, status } = request.data || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new functions.HttpsError('invalid-argument', 'Full name is required.');
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new functions.HttpsError('invalid-argument', 'Valid email address is required.');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new functions.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name.trim();
    const accountStatus = status === 'disabled' ? 'disabled' : 'active';

    try {
      // 1. Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email: normalizedEmail,
        password,
        displayName,
        emailVerified: true,
        disabled: accountStatus === 'disabled',
      });

      // 2. Set Admin custom claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: 'admin',
        admin: true,
        superAdmin: true,
      });

      const now = Date.now();

      // 3. Write to Realtime Database at /users/{uid}
      await rtdb.ref(`users/${userRecord.uid}`).set({
        uid: userRecord.uid,
        name: displayName,
        email: normalizedEmail,
        role: 'admin',
        status: accountStatus,
        createdAt: now,
      });

      // 4. Synchronize Firestore
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        uid: userRecord.uid,
        displayName,
        email: normalizedEmail,
        role: 'admin',
        isSuperAdmin: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: 'Administrator account created successfully.',
        uid: userRecord.uid,
        user: {
          uid: userRecord.uid,
          name: displayName,
          email: normalizedEmail,
          role: 'admin',
          status: accountStatus,
          createdAt: now,
        },
      };
    } catch (err: any) {
      if (err?.code === 'auth/email-already-exists') {
        throw new functions.HttpsError('already-exists', 'An account with this email address already exists.');
      }
      throw new functions.HttpsError('internal', err?.message || 'Failed to create administrator account.');
    }
  }
);

/**
 * 7. Update User Status (Enable / Disable)
 * Protects current admin and last active admin from being deactivated.
 */
export const updateUserStatusByAdmin = functions.onCall(
  { cors: true },
  async (request) => {
    const callerUid = await assertCallerIsAdmin(request);
    const { targetUid, status } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new functions.HttpsError('invalid-argument', 'Target user UID is required.');
    }
    if (status !== 'active' && status !== 'disabled') {
      throw new functions.HttpsError('invalid-argument', 'Status must be active or disabled.');
    }

    if (targetUid === callerUid && status === 'disabled') {
      throw new functions.HttpsError('failed-precondition', 'Security violation: You cannot disable your own active administrator account.');
    }

    // Check if target is an admin being disabled
    const targetSnap = await rtdb.ref(`users/${targetUid}`).get();
    if (targetSnap.exists() && targetSnap.val()?.role === 'admin' && status === 'disabled') {
      const allUsersSnap = await rtdb.ref('users').get();
      let activeAdminsCount = 0;
      if (allUsersSnap.exists()) {
        const usersObj = allUsersSnap.val();
        Object.values(usersObj).forEach((u: any) => {
          if (u.role === 'admin' && u.status === 'active' && u.uid !== targetUid) {
            activeAdminsCount++;
          }
        });
      }
      if (activeAdminsCount === 0) {
        throw new functions.HttpsError('failed-precondition', 'Cannot disable the last active administrator.');
      }
    }

    // Update in RTDB
    await rtdb.ref(`users/${targetUid}/status`).set(status);
    await rtdb.ref(`users/${targetUid}/updatedAt`).set(Date.now());

    // Update in Firebase Auth
    try {
      await admin.auth().updateUser(targetUid, {
        disabled: status === 'disabled',
      });
    } catch (authErr) {
      console.warn('Auth disable warning:', authErr);
    }

    return { success: true, message: `Account status updated to ${status}.`, targetUid, status };
  }
);

/**
 * 8. Delete User Account
 * Deletes from Firebase Authentication and Realtime Database with protection against deleting self or last admin.
 */
export const deleteUserAccountByAdmin = functions.onCall(
  { cors: true },
  async (request) => {
    const callerUid = await assertCallerIsAdmin(request);
    const { targetUid } = request.data || {};

    if (!targetUid || typeof targetUid !== 'string') {
      throw new functions.HttpsError('invalid-argument', 'Target user UID is required.');
    }

    if (targetUid === callerUid) {
      throw new functions.HttpsError('failed-precondition', 'Security violation: You cannot delete your own administrator account.');
    }

    // Protect the last admin
    const targetSnap = await rtdb.ref(`users/${targetUid}`).get();
    if (targetSnap.exists() && targetSnap.val()?.role === 'admin') {
      const allUsersSnap = await rtdb.ref('users').get();
      let activeAdminsCount = 0;
      if (allUsersSnap.exists()) {
        const usersObj = allUsersSnap.val();
        Object.values(usersObj).forEach((u: any) => {
          if (u.role === 'admin' && u.uid !== targetUid) {
            activeAdminsCount++;
          }
        });
      }
      if (activeAdminsCount === 0) {
        throw new functions.HttpsError('failed-precondition', 'Security violation: Cannot delete the only remaining administrator account.');
      }
    }

    // 1. Delete from Firebase Auth
    try {
      await admin.auth().deleteUser(targetUid);
    } catch (authErr: any) {
      if (authErr?.code !== 'auth/user-not-found') {
        console.warn('Auth deleteUser warning:', authErr);
      }
    }

    // 2. Delete from Realtime Database
    await rtdb.ref(`users/${targetUid}`).remove();

    // 3. Delete from Firestore
    await db.collection('users').doc(targetUid).delete();

    return { success: true, message: 'Account deleted successfully.', targetUid };
  }
);

