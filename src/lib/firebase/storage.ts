// FR8X-CON Firebase Storage Helpers

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadMetadata,
  type UploadTaskSnapshot,
} from "firebase/storage";
import { firebaseStorage } from "./config";

/**
 * Upload a file to Firebase Storage.
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  metadata?: UploadMetadata
): Promise<string> {
  const storageRef = ref(firebaseStorage, path);
  await uploadBytes(storageRef, file, metadata);
  return getDownloadURL(storageRef);
}

/**
 * Upload a file with progress tracking.
 */
export function uploadFileWithProgress(
  path: string,
  file: File | Blob,
  onProgress: (progress: number) => void,
  metadata?: UploadMetadata
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(firebaseStorage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
}

/**
 * Delete a file from Firebase Storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(firebaseStorage, path);
  await deleteObject(storageRef);
}

/**
 * Get the download URL for a file.
 */
export async function getFileURL(path: string): Promise<string> {
  const storageRef = ref(firebaseStorage, path);
  return getDownloadURL(storageRef);
}

/**
 * Generate a storage path for profile photos.
 */
export function getProfilePhotoPath(userId: string): string {
  return `profiles/${userId}/photo`;
}

/**
 * Generate a storage path for company logos.
 */
export function getCompanyLogoPath(companyId: string): string {
  return `companies/${companyId}/logo`;
}
