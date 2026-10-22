import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp as firestoreServerTimestamp,
  type QueryConstraint,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

/**
 * Throw a descriptive error if Cloud Firestore is invoked without configuration.
 */
function assertDbReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      'Cloud Firestore is not configured. Please supply valid VITE_FIREBASE_* credentials in your .env file.'
    );
  }
  return db;
}

/**
 * Fetch a single document by ID from a collection.
 */
export async function getDocData<T = DocumentData>(
  collectionName: string,
  id: string
): Promise<T | null> {
  const dbInstance = assertDbReady();
  const docRef = doc(dbInstance, collectionName, id);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;

  return { id: snap.id, ...(snap.data() as object) } as T;
}

/**
 * Set (create or overwrite) a document at a specific ID.
 */
export async function setDocData<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: T,
  merge: boolean = true
): Promise<void> {
  const dbInstance = assertDbReady();
  const docRef = doc(dbInstance, collectionName, id);
  await setDoc(docRef, { ...data, updatedAt: firestoreServerTimestamp() }, { merge });
}

/**
 * Add a new document with an auto-generated ID to a collection.
 */
export async function addDocData<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> {
  const dbInstance = assertDbReady();
  const colRef = collection(dbInstance, collectionName);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: firestoreServerTimestamp(),
    updatedAt: firestoreServerTimestamp(),
  });
  return docRef.id;
}

/**
 * Update specific fields in an existing document.
 */
export async function updateDocData<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const dbInstance = assertDbReady();
  const docRef = doc(dbInstance, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: firestoreServerTimestamp(),
  });
}

/**
 * Delete a document by ID.
 */
export async function deleteDocData(
  collectionName: string,
  id: string
): Promise<void> {
  const dbInstance = assertDbReady();
  const docRef = doc(dbInstance, collectionName, id);
  await deleteDoc(docRef);
}

/**
 * Query documents in a collection with custom constraints (e.g. where, orderBy, limit).
 */
export async function queryCollection<T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const dbInstance = assertDbReady();
  const colRef = collection(dbInstance, collectionName);
  const q = query(colRef, ...constraints);
  const querySnap = await getDocs(q);

  return querySnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as T[];
}

/**
 * Realtime listener for a single document.
 */
export function subscribeToDoc<T = DocumentData>(
  collectionName: string,
  id: string,
  callback: (data: T | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    callback(null);
    return () => {};
  }

  const docRef = doc(db, collectionName, id);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({ id: snap.id, ...(snap.data() as object) } as T);
      }
    },
    onError
  );
}

/**
 * Realtime listener for a collection query.
 */
export function subscribeToCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  const colRef = collection(db, collectionName);
  const q = query(colRef, ...constraints);

  return onSnapshot(
    q,
    (querySnap) => {
      const items = querySnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as object),
      })) as T[];
      callback(items);
    },
    onError
  );
}

// Re-export query helpers for consumer convenience
export { where, orderBy, limit, firestoreServerTimestamp as serverTimestamp };
