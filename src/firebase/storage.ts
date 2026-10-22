import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadMetadata,
} from 'firebase/storage';
import { storage, isFirebaseConfigured } from './config';

/**
 * Throw a descriptive error if Firebase Storage is invoked without configuration.
 */
function assertStorageReady() {
  if (!isFirebaseConfigured || !storage) {
    throw new Error(
      'Firebase Storage is not configured. Please supply valid VITE_FIREBASE_* credentials in your .env file.'
    );
  }
  return storage;
}

/**
 * Upload a file/blob to Firebase Storage and return its public download URL.
 */
export async function uploadFile(
  path: string,
  file: Blob | Uint8Array | ArrayBuffer,
  metadata?: UploadMetadata
): Promise<string> {
  const storageInstance = assertStorageReady();
  const fileRef = ref(storageInstance, path);
  const snap = await uploadBytes(fileRef, file, metadata);
  return getDownloadURL(snap.ref);
}

/**
 * Upload a file with real-time percentage progress callback.
 */
export function uploadFileWithProgress(
  path: string,
  file: File | Blob,
  onProgress: (percentage: number) => void,
  metadata?: UploadMetadata
): Promise<string> {
  const storageInstance = assertStorageReady();
  const fileRef = ref(storageInstance, path);
  const uploadTask = uploadBytesResumable(fileRef, file, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          snapshot.totalBytes > 0
            ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            : 0;
        onProgress(Math.round(progress));
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (urlErr) {
          reject(urlErr);
        }
      }
    );
  });
}

/**
 * Retrieve the download URL for an existing file in Storage.
 */
export async function getFileDownloadUrl(path: string): Promise<string> {
  const storageInstance = assertStorageReady();
  const fileRef = ref(storageInstance, path);
  return getDownloadURL(fileRef);
}

/**
 * Delete a file by its Storage path.
 */
export async function deleteFile(path: string): Promise<void> {
  const storageInstance = assertStorageReady();
  const fileRef = ref(storageInstance, path);
  await deleteObject(fileRef);
}

export interface FileValidationOptions {
  maxSizeMb?: number;
  allowedTypes?: string[];
}

/**
 * Validate file before uploading to Storage.
 */
export function validateUploadFile(
  file: File,
  options?: FileValidationOptions
): string | null {
  const maxSizeMb = options?.maxSizeMb || 25; // Default 25 MB
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return `File size exceeds the ${maxSizeMb} MB limit (selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
  }

  const nameLower = file.name.toLowerCase();
  const allowedExtensions = [
    '.pdf',
    '.doc',
    '.docx',
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.gif',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.txt',
  ];
  const hasValidExt = allowedExtensions.some((ext) => nameLower.endsWith(ext));

  if (!hasValidExt && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
    return 'Invalid file format. Allowed formats: PDF, DOC, DOCX, JPEG, PNG, WEBP, XLS, PPT.';
  }

  return null;
}

/**
 * Upload study material file to Firebase Storage.
 * Falls back to safe mock if Storage is unavailable or offline.
 */
export async function uploadStudyMaterialFile(
  file: File,
  folder = 'general',
  onProgress?: (progress: number) => void
): Promise<{ downloadUrl: string; storagePath: string }> {
  const validationError = validateUploadFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const cleanFolder = folder.replace(/^(study[-_]materials\/)+/i, '').replace(/^\/+|\/+$/g, '') || 'general';
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `study-materials/${cleanFolder}/${Date.now()}_${cleanName}`;
  const contentType = file.type || 'application/pdf';

  if (!isFirebaseConfigured || !storage) {
    console.warn('[storage] Firebase not fully configured. Using local data fallback.');
    return new Promise((resolve) => {
      if (onProgress) onProgress(100);
      if (file.size < 750 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            downloadUrl: reader.result as string,
            storagePath,
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          downloadUrl: typeof URL !== 'undefined' ? URL.createObjectURL(file) : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          storagePath,
        });
      }
    });
  }

  try {
    const downloadUrl = onProgress
      ? await uploadFileWithProgress(storagePath, file, onProgress, {
          contentType,
        })
      : await uploadFile(storagePath, file, { contentType });

    return { downloadUrl, storagePath };
  } catch (err) {
    console.warn('[storage] Storage upload failed, falling back to local file reference:', err);
    return new Promise((resolve) => {
      if (file.size < 750 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            downloadUrl: reader.result as string,
            storagePath,
          });
        };
        reader.readAsDataURL(file);
      } else {
        resolve({
          downloadUrl: typeof URL !== 'undefined' ? URL.createObjectURL(file) : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          storagePath,
        });
      }
    });
  }
}

