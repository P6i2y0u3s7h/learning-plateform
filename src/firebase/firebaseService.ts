import { auth, db, storage, isFirebaseConfigured } from './config';

/**
 * Service contracts for Firebase services prepared for future development phases.
 * (Authentication, Firestore documents, Cloud Storage uploads)
 */
export const FirebaseService = {
  isReady: () => isFirebaseConfigured,
  getAuthInstance: () => auth,
  getDbInstance: () => db,
  getStorageInstance: () => storage,
};

export default FirebaseService;
