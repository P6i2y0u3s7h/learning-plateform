import {
  ref,
  get,
  set,
  update,
  onValue,
  type DataSnapshot,
} from 'firebase/database';
import { database, isFirebaseConfigured } from './config';
import { ROUTES } from '../constants/routes';

export type AllowedRole = 'admin' | 'teacher' | 'student';
export type AccountStatus = 'active' | 'disabled';

export interface RtdbUserRecord {
  uid: string;
  name: string;
  email: string;
  role: AllowedRole;
  status: AccountStatus;
  createdAt: number;
  updatedAt?: number;
  phone?: string;
  classGrade?: string;
  subjectSpecialization?: string;
}

export type RoleVerificationStatus =
  | 'idle'
  | 'verifying'
  | 'verified'
  | 'missing_record'
  | 'invalid_role'
  | 'disabled'
  | 'error';

export interface RoleVerificationResult {
  verified: boolean;
  status: RoleVerificationStatus;
  role: AllowedRole | null;
  accountStatus: AccountStatus | null;
  record: RtdbUserRecord | null;
  error?: string;
  errorMessage?: string;
}

const ALLOWED_ROLES: ReadonlySet<string> = new Set(['admin', 'teacher', 'student']);
const ALLOWED_STATUSES: ReadonlySet<string> = new Set(['active', 'disabled']);

/**
 * Ensures the Realtime Database instance is initialized.
 */
function assertDatabaseReady() {
  if (!isFirebaseConfigured || !database) {
    throw new Error(
      'Firebase Realtime Database is not configured. Please supply valid VITE_FIREBASE_* credentials in your .env file.'
    );
  }
  return database;
}

/**
 * Normalize and validate a raw database record from /users/{uid}.
 */
export function validateAndNormalizeUserRecord(
  uid: string,
  raw: any
): RoleVerificationResult {
  if (!raw || typeof raw !== 'object') {
    return {
      verified: false,
      status: 'missing_record',
      role: null,
      accountStatus: null,
      record: null,
      error: 'User role profile does not exist in Realtime Database.',
      errorMessage: 'User role profile does not exist in Realtime Database.',
    };
  }

  // Ensure record UID matches authenticated user's UID
  const recordUid = String(raw.uid || '').trim();
  if (recordUid && recordUid !== uid) {
    return {
      verified: false,
      status: 'error',
      role: null,
      accountStatus: null,
      record: null,
      error: 'Database record UID mismatch with authenticated credentials.',
      errorMessage: 'Database record UID mismatch with authenticated credentials.',
    };
  }

  // Normalize and validate role
  const rawRole = String(raw.role || '').trim().toLowerCase();
  if (!ALLOWED_ROLES.has(rawRole)) {
    return {
      verified: false,
      status: 'invalid_role',
      role: null,
      accountStatus: null,
      record: null,
      error: `Unrecognized or invalid user role: "${raw.role}". Permitted roles: admin, teacher, student.`,
      errorMessage: `Unrecognized or invalid user role: "${raw.role}". Permitted roles: admin, teacher, student.`,
    };
  }
  const role = rawRole as AllowedRole;

  // Normalize and validate account status
  const rawStatus = String(raw.status || 'active').trim().toLowerCase();
  if (!ALLOWED_STATUSES.has(rawStatus)) {
    return {
      verified: false,
      status: 'error',
      role: null,
      accountStatus: null,
      record: null,
      error: `Invalid account status: "${raw.status}". Must be active or disabled.`,
      errorMessage: `Invalid account status: "${raw.status}". Must be active or disabled.`,
    };
  }
  const status = rawStatus as AccountStatus;

  // Enforce active status
  if (status === 'disabled') {
    return {
      verified: false,
      status: 'disabled',
      role,
      accountStatus: status,
      record: null,
      error: 'Your account has been disabled by an administrator. Please contact academic support.',
      errorMessage: 'Your account has been disabled by an administrator. Please contact academic support.',
    };
  }

  const record: RtdbUserRecord = {
    uid,
    name: String(raw.name || raw.displayName || 'User').trim(),
    email: String(raw.email || '').trim().toLowerCase(),
    role,
    status,
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: raw.updatedAt ? Number(raw.updatedAt) : undefined,
    phone: raw.phone ? String(raw.phone) : undefined,
    classGrade: raw.classGrade ? String(raw.classGrade) : undefined,
    subjectSpecialization: raw.subjectSpecialization ? String(raw.subjectSpecialization) : undefined,
  };

  return {
    verified: true,
    status: 'verified',
    role,
    accountStatus: status,
    record,
  };
}

/**
 * Fetch and verify the user's role from /users/{uid} in Firebase Realtime Database.
 */
export async function fetchUserRoleRecord(
  uid: string,
  timeoutMs = 7000
): Promise<RoleVerificationResult> {
  if (!uid) {
    return {
      verified: false,
      status: 'error',
      role: null,
      accountStatus: null,
      record: null,
      error: 'Cannot verify role: Missing authentication UID.',
      errorMessage: 'Cannot verify role: Missing authentication UID.',
    };
  }

  let dbInstance;
  try {
    dbInstance = assertDatabaseReady();
  } catch (err: any) {
    return {
      verified: false,
      status: 'error',
      role: null,
      accountStatus: null,
      record: null,
      error: err?.message || 'Realtime Database is not configured.',
      errorMessage: err?.message || 'Realtime Database is not configured.',
    };
  }

  const userRef = ref(dbInstance, `users/${uid}`);

  const timeoutPromise = new Promise<RoleVerificationResult>((resolve) => {
    setTimeout(() => {
      resolve({
        verified: false,
        status: 'error',
        role: null,
        accountStatus: null,
        record: null,
        error: 'Network timeout while verifying permissions with Realtime Database. Please check your connection and retry.',
        errorMessage: 'Network timeout while verifying permissions with Realtime Database. Please check your connection and retry.',
      });
    }, timeoutMs);
  });

  const fetchPromise = (async (): Promise<RoleVerificationResult> => {
    try {
      let snap: DataSnapshot = await get(userRef);
      if (!snap.exists()) {
        return {
          verified: false,
          status: 'missing_record',
          role: null,
          accountStatus: null,
          record: null,
          error: `No permission record found at /users/${uid}. Please contact support or complete account setup.`,
          errorMessage: `No permission record found at /users/${uid}. Please contact support or complete account setup.`,
        };
      }
      return validateAndNormalizeUserRecord(uid, snap.val());
    } catch (err: any) {
      console.error('[rtdb] Error fetching user role from Realtime Database:', err);
      return {
        verified: false,
        status: 'error',
        role: null,
        accountStatus: null,
        record: null,
        error: err?.message || 'Failed to communicate with Realtime Database.',
        errorMessage: err?.message || 'Failed to communicate with Realtime Database.',
      };
    }
  })();

  return Promise.race([fetchPromise, timeoutPromise]);
}

/**
 * Subscribe to real-time role and status changes at /users/{uid}.
 * Immediately notifies on role updates, status updates, or account disabling.
 */
export function listenToUserRoleRecord(
  uid: string,
  onUpdate: (result: RoleVerificationResult) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const dbInstance = assertDatabaseReady();
    const userRef = ref(dbInstance, `users/${uid}`);

    const unsubscribe = onValue(
      userRef,
      (snap) => {
        if (!snap.exists()) {
          onUpdate({
            verified: false,
            status: 'missing_record',
            role: null,
            accountStatus: null,
            record: null,
            error: 'User role record removed from Realtime Database.',
            errorMessage: 'User role record removed from Realtime Database.',
          });
          return;
        }
        const result = validateAndNormalizeUserRecord(uid, snap.val());
        onUpdate(result);
      },
      (error) => {
        console.warn('[rtdb] onValue listener error:', error);
        if (onError) onError(error);
        onUpdate({
          verified: false,
          status: 'error',
          role: null,
          accountStatus: null,
          record: null,
          error: error.message || 'Realtime sync disconnected.',
          errorMessage: error.message || 'Realtime sync disconnected.',
        });
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('[rtdb] Could not attach listener:', err);
    return () => {};
  }
}

/**
 * Create a new student profile in Realtime Database upon registration.
 * Role is strictly locked to 'student' and status to 'active'.
 */
export async function createStudentRtdbProfile(
  uid: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    classGrade?: string;
  }
): Promise<RtdbUserRecord> {
  const dbInstance = assertDatabaseReady();
  const userRef = ref(dbInstance, `users/${uid}`);

  const record: RtdbUserRecord = {
    uid,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    role: 'student', // Public registration strictly assigns 'student'
    status: 'active',
    phone: data.phone?.trim() || undefined,
    classGrade: data.classGrade || undefined,
    createdAt: Date.now(),
  };

  await set(userRef, record);
  return record;
}

/**
 * Update non-sensitive user profile fields in Realtime Database.
 * Role and status are stripped to prevent self-escalation.
 */
export async function updateUserRtdbProfile(
  uid: string,
  updates: Partial<Omit<RtdbUserRecord, 'role' | 'status' | 'uid'>>
): Promise<void> {
  const dbInstance = assertDatabaseReady();
  const userRef = ref(dbInstance, `users/${uid}`);

  // Strip forbidden fields
  const { role: _r, status: _s, uid: _u, ...safeUpdates } = updates as any;
  await update(userRef, {
    ...safeUpdates,
    updatedAt: Date.now(),
  });
}

/**
 * Map verified user role to their authorized dashboard route.
 */
export function getDashboardRoute(role: AllowedRole | string | null | undefined): string {
  if (!role) return ROUTES.LOGIN;
  const normalized = String(role).trim().toLowerCase();

  switch (normalized) {
    case 'admin':
      return '/admin/dashboard';
    case 'teacher':
      return '/teacher/dashboard';
    case 'student':
      return '/student/dashboard';
    default:
      return ROUTES.LOGIN;
  }
}

/**
 * Check if a user's verified role satisfies the route requirements.
 */
export function checkUserAccess(
  userRole: AllowedRole | string | null | undefined,
  allowedRoles?: AllowedRole[] | string[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;

  const normalizedUserRole = String(userRole).trim().toLowerCase();
  const normalizedAllowed = allowedRoles.map((r) => String(r).trim().toLowerCase());

  return normalizedAllowed.includes(normalizedUserRole);
}
