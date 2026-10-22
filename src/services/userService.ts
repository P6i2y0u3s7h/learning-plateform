import {
  getDocData,
  setDocData,
  updateDocData,
  queryCollection,
  where,
  orderBy,
} from '../firebase/firestore';
import type { UserProfile, Enrollment, Notification } from '../types';

const USERS_COLLECTION = 'users';
const ENROLLMENTS_COLLECTION = 'enrollments';
const NOTIFICATIONS_COLLECTION = 'notifications';

export const userService = {
  /**
   * Fetch a user profile document from Firestore by user UID.
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    return getDocData<UserProfile>(USERS_COLLECTION, uid);
  },

  /**
   * Create a new user profile document in Firestore upon registration.
   */
  async createUserProfile(uid: string, profileData: Partial<UserProfile>): Promise<void> {
    const { role: _r, isSuperAdmin: _s, approvalStatus: _a, ...safeProfileData } = profileData;
    const newProfile: Partial<UserProfile> = {
      ...safeProfileData,
      uid,
      role: 'student',
      isSuperAdmin: false,
      emailVerified: false,
      enrolledCourseIds: [],
      completedLessonIds: [],
    };
    await setDocData<Partial<UserProfile>>(USERS_COLLECTION, uid, newProfile, true);
  },

  /**
   * Update fields on an existing user profile document.
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const { role: _r, isSuperAdmin: _s, approvalStatus: _a, uid: _u, ...safeUpdates } = updates;
    await updateDocData<UserProfile>(USERS_COLLECTION, uid, safeUpdates);
  },

  /**
   * Retrieve all course enrollments for a given user.
   */
  async getUserEnrollments(uid: string): Promise<Enrollment[]> {
    return queryCollection<Enrollment>(
      ENROLLMENTS_COLLECTION,
      where('userId', '==', uid),
      orderBy('enrolledAt', 'desc')
    );
  },

  /**
   * Fetch all notifications for a given user.
   */
  async getUserNotifications(uid: string): Promise<Notification[]> {
    return queryCollection<Notification>(
      NOTIFICATIONS_COLLECTION,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
  },
};

export default userService;
