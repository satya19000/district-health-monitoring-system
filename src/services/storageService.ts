import { insforge } from '../lib/insforge';
import {
  categorize, BUCKET_FOR_CATEGORY, type FileCategory,
} from '../lib/fileParser';

/**
 * Storage service — the single place that talks to InsForge object storage.
 *
 * Responsibilities:
 *  - choose the correct bucket for a file based on its category
 *  - upload a file and return a normalised descriptor (key, url, size, …)
 *  - list / remove objects and resolve public URLs
 *
 * Both the Uploads page and the AI Analysis page go through `uploadFile()` so
 * the upload behaviour stays consistent in one location.
 */

export interface StoredObject {
  bucket: string;
  category: FileCategory;
  objectKey: string;
  url: string;
  size: number;
  mimeType: string;
  name: string;
}

/** Build a collision-resistant, filesystem-safe object path. */
export function buildObjectPath(userId: string | undefined, fileName: string): string {
  const safe = fileName.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return `${userId ?? 'anon'}/${Date.now()}_${safe}`;
}

/**
 * Upload a file to the bucket appropriate for its type.
 * Throws on failure so callers can surface a clear error.
 */
export async function uploadFile(file: File, userId?: string): Promise<StoredObject> {
  const category = categorize(file);
  const bucket = BUCKET_FOR_CATEGORY[category];
  const objectKey = buildObjectPath(userId, file.name);

  const { data, error } = await insforge.storage.from(bucket).upload(objectKey, file);
  if (error) throw new Error(error.message);

  const key = data?.key ?? objectKey;
  const url = data?.url ?? insforge.storage.from(bucket).getPublicUrl(key);

  return {
    bucket,
    category,
    objectKey: key,
    url,
    size: data?.size ?? file.size,
    mimeType: file.type || 'application/octet-stream',
    name: file.name,
  };
}

/** Resolve a public URL for an object already in storage. */
export function getPublicUrl(bucket: string, objectKey: string): string {
  return insforge.storage.from(bucket).getPublicUrl(objectKey);
}

/** List objects in a bucket. */
export async function listObjects(bucket: string) {
  const { data, error } = await insforge.storage.from(bucket).list();
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Remove an object from a bucket. */
export async function removeObject(bucket: string, objectKey: string) {
  const { data, error } = await insforge.storage.from(bucket).remove(objectKey);
  if (error) throw new Error(error.message);
  return data;
}

/** Download an object's contents (Blob). */
export async function downloadObject(bucket: string, objectKey: string) {
  const { data, error } = await insforge.storage.from(bucket).download(objectKey);
  if (error) throw new Error(error.message);
  return data;
}
