import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, type Functions } from 'firebase/functions';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { getDatabase, connectDatabaseEmulator, type Database } from 'firebase/database';

/**
 * Public Firebase Client Configuration.
 * Loaded from Vite environment variables (prefixed with VITE_).
 * NOTE: Private API keys, server secrets, and Service Account keys
 * MUST NEVER be placed in frontend environment variables.
 */
const globalEnv = (typeof globalThis !== 'undefined' ? (globalThis as any) : {})?.process?.env || {};
const env: Record<string, any> =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : globalEnv;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || (env.VITE_FIREBASE_PROJECT_ID ? `https://${env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com` : ''),
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

/**
 * Functions Region for 2nd Gen Cloud Functions.
 * Default is us-central1 or can be customized via VITE_FIREBASE_FUNCTIONS_REGION.
 */
export const FIREBASE_FUNCTIONS_REGION =
  env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1';

/**
 * Determine if valid Firebase credentials are configured.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

export const useEmulators =
  env.VITE_USE_FIREBASE_EMULATOR === 'true';

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let database: Database | null = null;
let functions: Functions | null = null;
let messaging: Messaging | null = null;

// Track emulator connection to prevent re-attaching on HMR
let emulatorsConnected = false;

if (isFirebaseConfigured) {
  try {
    // 1. Initialize Firebase only once
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // 2. Initialize Core Services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    database = getDatabase(app);
    functions = getFunctions(app, FIREBASE_FUNCTIONS_REGION);

    // 3. Initialize Firebase Cloud Messaging (in browser environments supporting Service Workers)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        messaging = getMessaging(app);
      } catch (msgErr) {
        // Expected when FCM is disabled, vapidKey is missing, or in unsupported browsers
        console.info('[Firebase] FCM messaging is prepared for production use.');
      }
    }

    // 4. Configure Firebase Local Emulators for development
    if (useEmulators && !emulatorsConnected) {
      const emulatorHost = import.meta.env.VITE_FIREBASE_EMULATOR_HOST || '127.0.0.1';

      if (auth) {
        connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
      }
      if (db) {
        connectFirestoreEmulator(db, emulatorHost, 8080);
      }
      if (storage) {
        connectStorageEmulator(storage, emulatorHost, 9199);
      }
      if (database) {
        connectDatabaseEmulator(database, emulatorHost, 9000);
      }
      if (functions) {
        connectFunctionsEmulator(functions, emulatorHost, 5001);
      }

      emulatorsConnected = true;
      console.info('[Firebase] Connected to local Firebase Emulators (Auth: 9099, Firestore: 8080, Storage: 9199, Database: 9000, Functions: 5001).');
    }
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
} else {
  // Graceful development notice when environment variables are not yet provided
  if (env.DEV) {
    console.warn(
      '[Firebase] Configuration credentials are missing or incomplete in environment. ' +
      'Please check .env.example and populate your VITE_FIREBASE_* keys in .env.local to activate real Firebase services.'
    );
  }
}

export { app, auth, db, storage, database, database as rtdb, functions, messaging };
