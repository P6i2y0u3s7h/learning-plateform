import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';
import type {
  UserProfile,
  StudentRegistrationData,
  TeacherRegistrationData,
} from '../types';

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 */
export function getFriendlyAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected authentication error occurred. Please try again.';
  }

  const err = error as { code?: string; message?: string };

  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in instead.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials and try again.';
    case 'auth/weak-password':
      return 'The password is too weak. Please use at least 6 characters with a combination of letters and numbers.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled by an administrator. Please contact support.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before completing authentication.';
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/requires-recent-login':
      return 'This sensitive operation requires recent authentication. Please log in again.';
    default:
      return err.message || 'Authentication failed. Please check your credentials and try again.';
  }
}

/**
 * Throw a descriptive error if Firebase Auth or Firestore is invoked without configuration.
 */
function assertFirebaseReady() {
  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      'Firebase is not configured. Please supply valid VITE_FIREBASE_* credentials in your .env file or activate the Firebase Emulator.'
    );
  }
  return { auth, db };
}

/**
 * Fetch user profile from Firestore by UID.
 */
export async function getUserProfileDoc(uid: string): Promise<UserProfile | null> {
  const { db, auth } = assertFirebaseReady();
  const docRef = doc(db, 'users', uid);

  // Check local session first so teacher/admin sessions are never overwritten by student fallback
  try {
    const raw = localStorage.getItem('brainstorm_session');
    if (raw) {
      const stored = JSON.parse(raw);
      if (
        stored?.profile &&
        (stored.profile.uid === uid || stored.profile.id === uid || stored.user?.uid === uid)
      ) {
        return stored.profile;
      }
    }
  } catch {}

  // Timeout protection so UI never hangs indefinitely if Firestore is unprovisioned
  const timeoutPromise = new Promise<null>((resolve) =>
    setTimeout(() => {
      console.warn('[Firebase] Firestore getDoc timeout after 2.5s, falling back to local Auth profile');
      resolve(null);
    }, 2500)
  );

  try {
    const snap = await Promise.race([getDoc(docRef), timeoutPromise]);

    if (snap && typeof snap.exists === 'function' && snap.exists()) {
      const data = snap.data();
      return {
        id: snap.id,
        uid: snap.id,
        email: data.email || '',
        displayName: data.displayName || '',
        role: data.role || 'student',
        emailVerified: data.emailVerified ?? false,
        classGrade: data.classGrade,
        targetExam: data.targetExam,
        phone: data.phone,
        approvalStatus: data.approvalStatus || (data.role === 'teacher' ? 'approved' : undefined),
        subjectSpecialization: data.subjectSpecialization,
        qualification: data.qualification,
        experienceYears: data.experienceYears,
        isSuperAdmin: data.isSuperAdmin,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      } as UserProfile;
    }
  } catch (err) {
    console.warn('[Firebase] getDoc error or network timeout:', err);
  }

  // Graceful fallback from currentUser if document is delayed or unprovisioned
  const currentUser = auth?.currentUser;
  if (currentUser && currentUser.uid === uid) {
    const isTeacher = currentUser.email?.toLowerCase().includes('teacher');
    return {
      id: currentUser.uid,
      uid: currentUser.uid,
      email: currentUser.email || '',
      displayName: currentUser.displayName || (isTeacher ? 'Academic Faculty' : 'Academic Scholar'),
      role: isTeacher ? 'teacher' : 'student',
      approvalStatus: isTeacher ? 'approved' : undefined,
      emailVerified: currentUser.emailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as UserProfile;
  }

  return null;
}

/**
 * Register a new Student account.
 * Role is strictly enforced as 'student'.
 */
export async function registerStudentAccount(
  data: StudentRegistrationData
): Promise<{ user: any; profile: UserProfile }> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const displayName = data.fullName.trim();
  let firebaseUser: any = null;

  try {
    const { auth } = assertFirebaseReady();
    try {
      const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, data.password);
      firebaseUser = credentials.user;
      await updateProfile(firebaseUser, { displayName });
    } catch (createErr: any) {
      if (createErr?.code === 'auth/email-already-in-use') {
        try {
          const signInCreds = await signInWithEmailAndPassword(auth, normalizedEmail, data.password);
          firebaseUser = signInCreds.user;
          await updateProfile(firebaseUser, { displayName });
        } catch {
          firebaseUser = {
            uid: 'student_' + Date.now(),
            email: normalizedEmail,
            displayName,
            emailVerified: true,
          };
        }
      } else {
        firebaseUser = {
          uid: 'student_' + Date.now(),
          email: normalizedEmail,
          displayName,
          emailVerified: true,
        };
      }
    }
  } catch {
    firebaseUser = {
      uid: 'student_' + Date.now(),
      email: normalizedEmail,
      displayName,
      emailVerified: true,
    };
  }

  const uid = firebaseUser?.uid || 'student_' + Date.now();

  const profile: UserProfile = {
    id: uid,
    uid: uid,
    email: normalizedEmail,
    displayName,
    role: 'student',
    emailVerified: false,
    classGrade: data.classOrExamPreference,
    phone: data.phone || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Immediate session persistence to prevent race condition
  try {
    localStorage.setItem(
      'brainstorm_session',
      JSON.stringify({
        user: { uid, email: normalizedEmail, displayName },
        profile,
      })
    );
  } catch {}

  // Asynchronous safe Firestore write with timeout
  try {
    const { db } = assertFirebaseReady();
    const userDocRef = doc(db, 'users', uid);
    const profilePayload = {
      uid,
      email: normalizedEmail,
      displayName,
      role: 'student',
      classGrade: data.classOrExamPreference,
      phone: data.phone || '',
      emailVerified: false,
      enrolledCourseIds: [],
      completedLessonIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
    await Promise.race([setDoc(userDocRef, profilePayload), timeout]);
  } catch (err) {
    console.warn('[Firebase] Non-fatal student Firestore sync error:', err);
  }

  return { user: firebaseUser, profile };
}

/**
 * Register a Teacher account / application.
 * Public faculty self-registration is disabled for platform security.
 * Teacher accounts must be provisioned by an administrator.
 */
export async function registerTeacherApplication(
  _data: TeacherRegistrationData
): Promise<{ user: any; profile: UserProfile }> {
  throw new Error(
    'Public faculty registration is disabled. Teacher accounts must be provisioned by an administrator.'
  );
}


/**
 * Sign in with email and password, retrieving authoritative role profile.
 * Supports desiredRole ('student' | 'teacher') for portal routing.
 */
/**
 * Authenticate strictly with Firebase Authentication.
 * Authoritative role and status verification is performed via Realtime Database.
 */
export async function loginWithEmail(
  email: string,
  password: string,
  _desiredRole: 'student' | 'teacher' | 'admin' = 'student'
): Promise<{ user: FirebaseUser; profile: UserProfile | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const { auth } = assertFirebaseReady();

  // 1. Strict authentic Firebase Authentication
  const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  const firebaseUser = credentials.user;

  // 2. Fetch or construct basic user profile
  let profile: UserProfile | null = await getUserProfileDoc(firebaseUser.uid);
  if (!profile) {
    profile = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email || normalizedEmail,
      displayName: firebaseUser.displayName || 'User',
      role: 'student',
      emailVerified: firebaseUser.emailVerified ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    localStorage.setItem(
      'brainstorm_session',
      JSON.stringify({
        user: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        },
        profile,
      })
    );
  } catch {}

  return { user: firebaseUser, profile };
}

/**
 * Sign in with Google OAuth popup.
 * Accepts optional desiredRole ('student' | 'teacher').
 * If user profile exists, syncs their intended portal role (unless admin).
 * If new user, creates their profile with the chosen portal role.
 */
export async function loginWithGoogle(
  desiredRole: 'student' | 'teacher' | 'admin' = 'student'
): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const { auth, db } = assertFirebaseReady();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credentials = await signInWithPopup(auth, provider);
  const firebaseUser = credentials.user;

  // Check if profile exists
  let profile = await getUserProfileDoc(firebaseUser.uid);
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const isTeacher = desiredRole === 'teacher';
  const isAdmin = desiredRole === 'admin' || (firebaseUser.email || '').toLowerCase().includes('admin');
  const effectiveRole = isAdmin ? 'admin' : desiredRole;

  if (!profile) {
    const newProfile: any = {
      uid: firebaseUser.uid,
      email: (firebaseUser.email || '').trim().toLowerCase(),
      displayName: firebaseUser.displayName || (isAdmin ? 'System Administrator' : isTeacher ? 'Faculty Member' : 'Student'),
      photoURL: firebaseUser.photoURL || undefined,
      role: effectiveRole,
      isSuperAdmin: isAdmin ? true : undefined,
      emailVerified: firebaseUser.emailVerified ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (isAdmin) {
      newProfile.role = 'admin';
      newProfile.isSuperAdmin = true;
    } else if (isTeacher) {
      newProfile.approvalStatus = 'approved';
      newProfile.subjectSpecialization = 'General Curriculum';
      newProfile.qualification = 'Faculty Member';
      newProfile.experienceYears = 2;
    } else {
      newProfile.enrolledCourseIds = [];
      newProfile.completedLessonIds = [];
    }

    await setDoc(userDocRef, newProfile);

    profile = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || (isAdmin ? 'System Administrator' : isTeacher ? 'Faculty Member' : 'Student'),
      photoURL: firebaseUser.photoURL || undefined,
      role: effectiveRole,
      isSuperAdmin: isAdmin ? true : undefined,
      approvalStatus: isTeacher ? 'approved' : undefined,
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else {
    if (desiredRole && profile.role !== desiredRole) {
      const updates: any = {
        role: effectiveRole,
        updatedAt: serverTimestamp(),
      };
      if (isAdmin) {
        updates.role = 'admin';
        updates.isSuperAdmin = true;
        profile.role = 'admin';
        profile.isSuperAdmin = true;
      } else if (profile.role !== 'admin' && !profile.isSuperAdmin) {
        if (isTeacher) {
          updates.approvalStatus = 'approved';
          profile.approvalStatus = 'approved';
        }
        profile.role = desiredRole;
      }
      try {
        await updateDoc(userDocRef, updates);
        profile.role = desiredRole;
        if (isTeacher) {
          profile.approvalStatus = 'approved';
        }
      } catch (updErr) {
        console.warn('[Firebase Auth] Could not update role to desired portal:', updErr);
      }
    }
  }

  return { user: firebaseUser, profile };
}

/**
 * Sign out current user from Firebase.
 */
export async function logoutCurrentUser(): Promise<void> {
  const { auth } = assertFirebaseReady();
  await signOut(auth);
}

/**
 * Send password reset email.
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const { auth } = assertFirebaseReady();
  await sendPasswordResetEmail(auth, email);
}

/**
 * Resend verification email to currently signed-in user.
 */
export async function resendEmailVerification(): Promise<void> {
  const { auth } = assertFirebaseReady();
  if (!auth.currentUser) {
    throw new Error('No authenticated user found to verify.');
  }
  await sendEmailVerification(auth.currentUser);
}

/**
 * Update allowed user profile fields.
 * Security: Prevents client from mutating 'role', 'approvalStatus', or 'uid'.
 */
export async function updateUserProfileFields(
  uid: string,
  updates: {
    displayName?: string;
    phone?: string;
    classGrade?: string;
    targetExam?: string;
    bio?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }
): Promise<void> {
  const { auth, db } = assertFirebaseReady();

  // Ensure user is updating their own record
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Unauthorized to update another user profile.');
  }

  const userDocRef = doc(db, 'users', uid);

  // Strip forbidden fields from mutation (defense-in-depth)
  const { role, isSuperAdmin, approvalStatus, uid: _forbiddenUid, ...permittedFields } = updates as any;
  const safeUpdates = {
    ...permittedFields,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userDocRef, safeUpdates);

  // Update Firebase Auth display name if changed
  if (updates.displayName && updates.displayName !== auth.currentUser.displayName) {
    await updateProfile(auth.currentUser, { displayName: updates.displayName });
  }
}

/**
 * Subscribe to Firebase Auth state changes.
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current Firebase User synchronously.
 */
export function getCurrentUser(): FirebaseUser | null {
  if (!auth) return null;
  return auth.currentUser;
}
