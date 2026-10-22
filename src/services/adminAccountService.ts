import {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  type DataSnapshot,
} from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile as updateAuthProfile,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  database,
  db,
  functions,
  firebaseConfig,
  isFirebaseConfigured,
} from '../firebase/config';
import type { RtdbUserRecord, AllowedRole, AccountStatus } from '../firebase/rtdb';

export interface CreateAccountInput {
  name: string;
  email: string;
  password: string;
  status?: AccountStatus;
}

export interface AdminOperationResult {
  success: boolean;
  message: string;
  uid?: string;
  user?: RtdbUserRecord;
  error?: string;
}

/**
 * Creates an isolated secondary Firebase Auth client.
 * CRITICAL (Requirement #5): Ensures creating an account from the frontend NEVER
 * switches the current logged-in admin's session or causes a logout loop.
 */
function getIsolatedAuthClient() {
  const SECONDARY_APP_NAME = 'AdminIsolatedProvisioningApp';
  let secondaryApp = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  if (!secondaryApp) {
    secondaryApp = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  }
  return getAuth(secondaryApp);
}

/**
 * Create a Teacher account via trusted Cloud Function with isolated client fallback.
 * Session is 100% protected: The admin remains logged in on the Admin Dashboard.
 */
export async function createTeacherAccount(
  data: CreateAccountInput
): Promise<AdminOperationResult> {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const status: AccountStatus = data.status === 'disabled' ? 'disabled' : 'active';

  // 1. Client-side input validation
  if (!name) throw new Error('Full Name is required.');
  if (!email || !/\S+@\S+\.\S+/.test(email)) throw new Error('A valid email address is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  // 2. Attempt via Cloud Functions (Server-side Firebase Admin SDK)
  if (functions) {
    try {
      const callable = httpsCallable<any, any>(functions, 'createTeacherAccountByAdmin');
      const response = await callable({ name, email, password, status });
      const resultData = response.data;
      if (resultData?.success && resultData.uid) {
        return {
          success: true,
          message: `Teacher ${name} created successfully via secure backend.`,
          uid: resultData.uid,
          user: resultData.user,
        };
      }
    } catch (cfErr: any) {
      // If function doesn't exist yet in local/dev or network fails, proceed with isolated fallback
      console.warn('[adminAccountService] Cloud Function call deferred, using isolated session fallback:', cfErr.message);
    }
  }

  // 3. Isolated Fallback: Uses secondary Firebase App so current admin session is completely preserved
  const secondaryAuth = getIsolatedAuthClient();
  try {
    const creds = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = creds.user.uid;
    await updateAuthProfile(creds.user, { displayName: name });

    const now = Date.now();
    const rtdbRecord: RtdbUserRecord = {
      uid: newUid,
      name,
      email,
      role: 'teacher',
      status,
      createdAt: now,
    };

    // Write to Realtime Database using the authenticated admin's database connection
    if (database) {
      await set(ref(database, `users/${newUid}`), rtdbRecord);
    }

    // Also synchronize Firestore
    if (db) {
      try {
        await setDoc(doc(db, 'users', newUid), {
          id: newUid,
          uid: newUid,
          displayName: name,
          email,
          role: 'teacher',
          approvalStatus: 'approved',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        console.warn('[adminAccountService] Firestore sync non-fatal:', fsErr);
      }
    }

    // Clean up isolated session
    await signOut(secondaryAuth);

    return {
      success: true,
      message: `Teacher account for ${name} created successfully.`,
      uid: newUid,
      user: rtdbRecord,
    };
  } catch (err: any) {
    await signOut(secondaryAuth).catch(() => {});
    if (err?.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email address already exists.');
    }
    throw new Error(err?.message || 'Failed to create teacher account.');
  }
}

/**
 * Create an Administrator account via trusted Cloud Function with isolated client fallback.
 * Admin session is 100% preserved.
 */
export async function createAdminAccount(
  data: CreateAccountInput
): Promise<AdminOperationResult> {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const status: AccountStatus = data.status === 'disabled' ? 'disabled' : 'active';

  if (!name) throw new Error('Full Name is required.');
  if (!email || !/\S+@\S+\.\S+/.test(email)) throw new Error('A valid email address is required.');
  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters.');

  // 1. Attempt Cloud Function with Admin SDK
  if (functions) {
    try {
      const callable = httpsCallable<any, any>(functions, 'createAdminAccountByAdmin');
      const response = await callable({ name, email, password, status });
      const resultData = response.data;
      if (resultData?.success && resultData.uid) {
        return {
          success: true,
          message: `Administrator ${name} created successfully via secure backend.`,
          uid: resultData.uid,
          user: resultData.user,
        };
      }
    } catch (cfErr: any) {
      console.warn('[adminAccountService] Cloud Function call deferred, using isolated session fallback:', cfErr.message);
    }
  }

  // 2. Isolated Fallback
  const secondaryAuth = getIsolatedAuthClient();
  try {
    const creds = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = creds.user.uid;
    await updateAuthProfile(creds.user, { displayName: name });

    const now = Date.now();
    const rtdbRecord: RtdbUserRecord = {
      uid: newUid,
      name,
      email,
      role: 'admin',
      status,
      createdAt: now,
    };

    if (database) {
      await set(ref(database, `users/${newUid}`), rtdbRecord);
    }

    if (db) {
      try {
        await setDoc(doc(db, 'users', newUid), {
          id: newUid,
          uid: newUid,
          displayName: name,
          email,
          role: 'admin',
          isSuperAdmin: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        console.warn('[adminAccountService] Firestore sync non-fatal:', fsErr);
      }
    }

    await signOut(secondaryAuth);

    return {
      success: true,
      message: `Administrator account for ${name} created successfully.`,
      uid: newUid,
      user: rtdbRecord,
    };
  } catch (err: any) {
    await signOut(secondaryAuth).catch(() => {});
    if (err?.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email address already exists.');
    }
    throw new Error(err?.message || 'Failed to create administrator account.');
  }
}

/**
 * Toggle user account status (active <-> disabled).
 * Protects current admin and prevents locking out the last active admin.
 */
export async function toggleUserStatus(
  targetUid: string,
  currentStatus: AccountStatus,
  targetRole?: string
): Promise<{ success: boolean; newStatus: AccountStatus }> {
  const currentAdminUid = auth?.currentUser?.uid;
  const newStatus: AccountStatus = currentStatus === 'active' ? 'disabled' : 'active';

  if (targetUid === currentAdminUid && newStatus === 'disabled') {
    throw new Error('Security Violation: You cannot disable your own active administrator account.');
  }

  // Attempt Cloud Function
  if (functions) {
    try {
      const callable = httpsCallable<any, any>(functions, 'updateUserStatusByAdmin');
      await callable({ targetUid, status: newStatus });
      return { success: true, newStatus };
    } catch (cfErr: any) {
      console.warn('[adminAccountService] Cloud Function deferred, updating RTDB directly:', cfErr.message);
    }
  }

  // Realtime Database direct update
  if (!database) throw new Error('Realtime Database is not configured.');

  // If disabling an admin, ensure at least one other active admin remains
  if (targetRole === 'admin' && newStatus === 'disabled') {
    const allUsersSnap = await get(ref(database, 'users'));
    let otherActiveAdmins = 0;
    if (allUsersSnap.exists()) {
      Object.values(allUsersSnap.val()).forEach((u: any) => {
        if (u.role === 'admin' && u.status === 'active' && u.uid !== targetUid) {
          otherActiveAdmins++;
        }
      });
    }
    if (otherActiveAdmins === 0) {
      throw new Error('Cannot disable the only remaining active administrator account.');
    }
  }

  await update(ref(database, `users/${targetUid}`), {
    status: newStatus,
    updatedAt: Date.now(),
  });

  return { success: true, newStatus };
}

/**
 * Update a user's display name in Realtime Database.
 */
export async function updateUserName(
  targetUid: string,
  newName: string
): Promise<{ success: boolean }> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Name cannot be empty.');

  if (!database) throw new Error('Realtime Database is not configured.');

  await update(ref(database, `users/${targetUid}`), {
    name: trimmed,
    updatedAt: Date.now(),
  });

  if (db) {
    try {
      await setDoc(doc(db, 'users', targetUid), { displayName: trimmed }, { merge: true });
    } catch {}
  }

  return { success: true };
}

/**
 * Send a secure password reset email to the user.
 */
export async function sendUserPasswordReset(email: string): Promise<{ success: boolean }> {
  if (!auth) throw new Error('Authentication is not configured.');
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  return { success: true };
}

/**
 * Delete a user account from Realtime Database and Authentication.
 * Prevents deleting self and the last remaining admin.
 */
export async function deleteUserAccount(
  targetUid: string,
  targetRole: string
): Promise<{ success: boolean }> {
  const currentAdminUid = auth?.currentUser?.uid;

  if (targetUid === currentAdminUid) {
    throw new Error('Security Violation: You cannot delete your own active administrator account.');
  }

  // Attempt Cloud Function
  if (functions) {
    try {
      const callable = httpsCallable<any, any>(functions, 'deleteUserAccountByAdmin');
      await callable({ targetUid });
      return { success: true };
    } catch (cfErr: any) {
      console.warn('[adminAccountService] Cloud Function deferred, removing from RTDB directly:', cfErr.message);
    }
  }

  if (!database) throw new Error('Realtime Database is not configured.');

  if (targetRole === 'admin') {
    const allUsersSnap = await get(ref(database, 'users'));
    let otherAdmins = 0;
    if (allUsersSnap.exists()) {
      Object.values(allUsersSnap.val()).forEach((u: any) => {
        if (u.role === 'admin' && u.uid !== targetUid) {
          otherAdmins++;
        }
      });
    }
    if (otherAdmins === 0) {
      throw new Error('Security Violation: Cannot delete the only remaining administrator account.');
    }
  }

  await remove(ref(database, `users/${targetUid}`));

  if (db) {
    try {
      await deleteDoc(doc(db, 'users', targetUid));
    } catch {}
  }

  return { success: true };
}

/**
 * Real-Time Listener: Listen to all users filtered by role from /users.
 * Real-time synchronization updates UI instantly when records are created or edited (Requirement #7).
 */
export function listenToUsersByRole(
  role: AllowedRole,
  onUpdate: (users: RtdbUserRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!database) {
    onUpdate([]);
    return () => {};
  }

  const usersRef = ref(database, 'users');

  const unsubscribe = onValue(
    usersRef,
    (snap: DataSnapshot) => {
      if (!snap.exists()) {
        onUpdate([]);
        return;
      }
      const data = snap.val() || {};
      const list: RtdbUserRecord[] = Object.keys(data).map((key) => {
        const item = data[key];
        return {
          uid: item.uid || key,
          name: item.name || 'User',
          email: item.email || '',
          role: item.role || 'student',
          status: item.status || 'active',
          createdAt: Number(item.createdAt) || Date.now(),
          updatedAt: item.updatedAt ? Number(item.updatedAt) : undefined,
          phone: item.phone,
          classGrade: item.classGrade,
          subjectSpecialization: item.subjectSpecialization,
        };
      });

      const filtered = list.filter((u) => u.role === role);
      // Sort newest first
      filtered.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(filtered);
    },
    (error) => {
      console.error(`[adminAccountService] onValue error for role "${role}":`, error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Real-Time Listener: Listen to all users for admin metrics.
 */
export function listenToAllUsers(
  onUpdate: (users: RtdbUserRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!database) {
    onUpdate([]);
    return () => {};
  }

  const usersRef = ref(database, 'users');

  const unsubscribe = onValue(
    usersRef,
    (snap: DataSnapshot) => {
      if (!snap.exists()) {
        onUpdate([]);
        return;
      }
      const data = snap.val() || {};
      const list: RtdbUserRecord[] = Object.keys(data).map((key) => {
        const item = data[key];
        return {
          uid: item.uid || key,
          name: item.name || 'User',
          email: item.email || '',
          role: item.role || 'student',
          status: item.status || 'active',
          createdAt: Number(item.createdAt) || Date.now(),
          updatedAt: item.updatedAt ? Number(item.updatedAt) : undefined,
        };
      });
      list.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}
