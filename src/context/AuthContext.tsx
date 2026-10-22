import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToAuthState,
  getUserProfileDoc,
  loginWithEmail,
  loginWithGoogle as firebaseLoginWithGoogle,
  registerStudentAccount,
  registerTeacherApplication,
  logoutCurrentUser,
  sendPasswordReset as firebaseSendPasswordReset,
  resendEmailVerification as firebaseResendEmailVerification,
  updateUserProfileFields,
  getFriendlyAuthErrorMessage,
} from '../firebase/auth';
import {
  fetchUserRoleRecord,
  listenToUserRoleRecord,
  createStudentRtdbProfile,
  type RtdbUserRecord,
  type RoleVerificationStatus,
  type AllowedRole,
} from '../firebase/rtdb';
import type {
  UserProfile,
  UserRole,
  StudentRegistrationData,
  TeacherRegistrationData,
} from '../types';

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  rtdbRecord: RtdbUserRecord | null;
  role: UserRole;
  accountStatus: 'active' | 'disabled' | null;
  verificationStatus: RoleVerificationStatus;
  verificationError: string | null;
  isAuthenticated: boolean;
  isTeacherApproved: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, desiredRole?: 'student' | 'teacher' | 'admin') => Promise<UserProfile | null>;
  loginWithGoogle: (desiredRole?: 'student' | 'teacher' | 'admin') => Promise<UserProfile>;
  loginAsDemoStudent: (name?: string) => Promise<UserProfile>;
  loginAsDemoTeacher: (name?: string) => Promise<UserProfile>;
  loginAsDemoAdmin: () => Promise<UserProfile>;
  registerStudent: (data: StudentRegistrationData) => Promise<UserProfile>;
  registerTeacher: (data: TeacherRegistrationData) => Promise<UserProfile>;
  logout: () => Promise<void>;
  retryVerification: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  updateProfile: (updates: {
    displayName?: string;
    phone?: string;
    classGrade?: string;
    targetExam?: string;
    bio?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem('brainstorm_session');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialSession = getStoredSession();
  const [user, setUser] = useState<FirebaseUser | null>(initialSession?.user || null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialSession?.profile || null);
  const [rtdbRecord, setRtdbRecord] = useState<RtdbUserRecord | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<RoleVerificationStatus>('idle');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!initialSession);
  const [error, setError] = useState<string | null>(null);

  // Active RTDB subscription unsubscribe ref
  const rtdbUnsubscribeRef = useRef<(() => void) | null>(null);

  // Synchronize Firebase Auth state and establish authoritative RTDB role listener
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuthState(async (firebaseUser) => {
      // Clean up any existing RTDB listener before attaching a new one
      if (rtdbUnsubscribeRef.current) {
        rtdbUnsubscribeRef.current();
        rtdbUnsubscribeRef.current = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        setVerificationStatus('verifying');
        setVerificationError(null);

        // 1. Attach Realtime Database live listener for role and status
        // Case K: Live role change by an administrator is immediately propagated
        const unsubscribeRtdb = listenToUserRoleRecord(firebaseUser.uid, (result) => {
          if (result.verified && result.record) {
            setRtdbRecord(result.record);
            setVerificationStatus('verified');
            setVerificationError(null);
          } else {
            setRtdbRecord(result.record || null);
            setVerificationStatus(result.status);
            setVerificationError(result.error || null);
          }
        });
        rtdbUnsubscribeRef.current = unsubscribeRtdb;

        // 2. Fetch supplementary profile doc from Firestore asynchronously
        try {
          const profile = await getUserProfileDoc(firebaseUser.uid);
          setUserProfile(profile);
          if (profile) {
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
          }
        } catch (fetchErr) {
          console.error('[AuthContext] Error fetching profile metadata:', fetchErr);
        }
      } else {
        // User logged out or unauthenticated
        const stored = getStoredSession();
        if (stored?.user && stored?.profile && stored.user.uid?.startsWith('demo_')) {
          setUser(stored.user);
          setUserProfile(stored.profile);
          setVerificationStatus('verified');
        } else {
          setUser(null);
          setUserProfile(null);
          setRtdbRecord(null);
          setVerificationStatus('idle');
          setVerificationError(null);
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (rtdbUnsubscribeRef.current) {
        rtdbUnsubscribeRef.current();
        rtdbUnsubscribeRef.current = null;
      }
    };
  }, []);

  const clearError = () => setError(null);

  // Manual retry function for temporary network or database failures (Case G)
  const retryVerification = async () => {
    if (!user) return;
    setVerificationStatus('verifying');
    setVerificationError(null);
    const result = await fetchUserRoleRecord(user.uid);
    if (result.verified && result.record) {
      setRtdbRecord(result.record);
      setVerificationStatus('verified');
      setVerificationError(null);
    } else {
      setRtdbRecord(result.record || null);
      setVerificationStatus(result.status);
      setVerificationError(result.error || null);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      await user.reload();
      const profile = await getUserProfileDoc(user.uid);
      setUser(user);
      setUserProfile(profile);
      await retryVerification();
    } catch (err) {
      console.error('[AuthContext] Error refreshing profile:', err);
    }
  };

  const login = async (
    email: string,
    password: string,
    _desiredRole?: 'student' | 'teacher' | 'admin'
  ): Promise<UserProfile | null> => {
    setError(null);
    try {
      const { user: loggedInUser, profile } = await loginWithEmail(email, password);
      setUser(loggedInUser);

      // Verify role directly from Realtime Database
      setVerificationStatus('verifying');
      const rtdbResult = await fetchUserRoleRecord(loggedInUser.uid);
      if (rtdbResult.verified && rtdbResult.record) {
        setRtdbRecord(rtdbResult.record);
        setVerificationStatus('verified');
        setVerificationError(null);
      } else {
        setRtdbRecord(rtdbResult.record || null);
        setVerificationStatus(rtdbResult.status);
        setVerificationError(rtdbResult.error || null);
      }

      setUserProfile(profile);
      return profile;
    } catch (err) {
      const msg = getFriendlyAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async (_desiredRole?: 'student' | 'teacher' | 'admin'): Promise<UserProfile> => {
    setError(null);
    try {
      const { user: loggedInUser, profile } = await firebaseLoginWithGoogle();
      setUser(loggedInUser);

      // Verify role directly from Realtime Database
      setVerificationStatus('verifying');
      const rtdbResult = await fetchUserRoleRecord(loggedInUser.uid);
      if (rtdbResult.verified && rtdbResult.record) {
        setRtdbRecord(rtdbResult.record);
        setVerificationStatus('verified');
        setVerificationError(null);
      } else {
        setRtdbRecord(rtdbResult.record || null);
        setVerificationStatus(rtdbResult.status);
        setVerificationError(rtdbResult.error || null);
      }

      setUserProfile(profile);
      return profile;
    } catch (err) {
      const msg = getFriendlyAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  // Demo accounts have been decommissioned for production security
  const loginAsDemoStudent = async (_name?: string): Promise<UserProfile> => {
    throw new Error('Demo login is disabled for security. Please sign in with registered credentials.');
  };

  const loginAsDemoTeacher = async (_name?: string): Promise<UserProfile> => {
    throw new Error('Demo login is disabled for security. Please sign in with registered credentials.');
  };

  const loginAsDemoAdmin = async (): Promise<UserProfile> => {
    throw new Error('Demo login is disabled for security. Please sign in with registered credentials.');
  };

  const registerStudent = async (data: StudentRegistrationData): Promise<UserProfile> => {
    setError(null);
    try {
      const { user: registeredUser, profile } = await registerStudentAccount(data);

      // Create strictly-verified student role record in Realtime Database
      try {
        await createStudentRtdbProfile(registeredUser.uid, {
          name: data.fullName.trim(),
          email: registeredUser.email || data.email.trim(),
          classGrade: data.classOrExamPreference,
          phone: data.phone?.trim(),
        });
      } catch (rtdbErr) {
        console.warn('[AuthContext] RTDB student registration write warning:', rtdbErr);
      }

      try {
        localStorage.setItem('brainstorm_session', JSON.stringify({ user: registeredUser, profile }));
      } catch {}

      setUser(registeredUser);
      setUserProfile(profile);
      return profile;
    } catch (err) {
      const msg = getFriendlyAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerTeacher = async (_data: TeacherRegistrationData): Promise<UserProfile> => {
    throw new Error('Public teacher registration is disabled. Teacher accounts must be provisioned by an administrator.');
  };

  const logout = async (): Promise<void> => {
    setError(null);
    try {
      localStorage.removeItem('brainstorm_session');
      if (rtdbUnsubscribeRef.current) {
        rtdbUnsubscribeRef.current();
        rtdbUnsubscribeRef.current = null;
      }
      await logoutCurrentUser();
      setUser(null);
      setUserProfile(null);
      setRtdbRecord(null);
      setVerificationStatus('idle');
      setVerificationError(null);
    } catch (err) {
      localStorage.removeItem('brainstorm_session');
      setUser(null);
      setUserProfile(null);
      setRtdbRecord(null);
      setVerificationStatus('idle');
      setVerificationError(null);
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    setError(null);
    try {
      await firebaseSendPasswordReset(email);
    } catch (err) {
      const msg = getFriendlyAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const resendVerification = async (): Promise<void> => {
    setError(null);
    try {
      await firebaseResendEmailVerification();
    } catch (err) {
      const msg = getFriendlyAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (updates: {
    displayName?: string;
    phone?: string;
    classGrade?: string;
    targetExam?: string;
    bio?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }): Promise<void> => {
    if (!user) throw new Error('You must be logged in to update your profile.');
    setError(null);
    try {
      await updateUserProfileFields(user.uid, updates);
      await refreshProfile();
    } catch (err) {
      const msg = getFriendlyAuthErrorMessage(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  // Derive authoritative role and permissions from Realtime Database record
  // Never trust client form inputs, URLs, or email conventions
  const role: UserRole =
    rtdbRecord?.role || (userProfile?.role as UserRole) || (user ? 'student' : 'guest');
  const accountStatus = rtdbRecord?.status || 'active';
  const isTeacherApproved =
    role === 'teacher' &&
    (userProfile?.approvalStatus === 'approved' || rtdbRecord?.role === 'teacher');
  const isAdmin = role === 'admin' || Boolean(userProfile?.isSuperAdmin);
  const isEmailVerified = user?.emailVerified ?? false;

  const value = useMemo(
    () => ({
      user,
      userProfile,
      rtdbRecord,
      role,
      accountStatus,
      verificationStatus,
      verificationError,
      isAuthenticated: Boolean(user),
      isTeacherApproved,
      isAdmin,
      isEmailVerified,
      loading,
      error,
      login,
      loginWithGoogle,
      loginAsDemoStudent,
      loginAsDemoTeacher,
      loginAsDemoAdmin,
      registerStudent,
      registerTeacher,
      logout,
      retryVerification,
      sendPasswordReset,
      resendVerification,
      updateProfile,
      refreshProfile,
      clearError,
    }),
    [
      user,
      userProfile,
      rtdbRecord,
      role,
      accountStatus,
      verificationStatus,
      verificationError,
      isTeacherApproved,
      isAdmin,
      isEmailVerified,
      loading,
      error,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
