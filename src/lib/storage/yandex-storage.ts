import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Инициализация S3 клиента для Yandex Object Storage
const s3Client = new S3Client({
  region: process.env.YC_STORAGE_REGION || 'ru-central1',
  endpoint: process.env.YC_STORAGE_ENDPOINT || 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: process.env.YC_STORAGE_ACCESS_KEY || '',
    secretAccessKey: process.env.YC_STORAGE_SECRET_KEY || '',
  },
});

const BUCKET_NAME = process.env.YC_STORAGE_BUCKET || '';

export interface UploadFileParams {
  file: Buffer;
  key: string;
  contentType: string;
}

export interface GetFileUrlParams {
  key: string;
  expiresIn?: number; // в секундах, по умолчанию 3600 (1 час)
}

/**
 * Загрузить файл в Yandex Object Storage
 */
export async function uploadFile({ file, key, contentType }: UploadFileParams): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Возвращаем публичный URL (если bucket публичный) или ключ для получения signed URL
  return `https://${BUCKET_NAME}.storage.yandexcloud.net/${key}`;
}

/**
 * Получить подписанный URL для доступа к файлу
 */
export async function getSignedFileUrl({ key, expiresIn = 3600 }: GetFileUrlParams): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

/**
 * Удалить файл из Yandex Object Storage
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Генерировать уникальный ключ для файла
 */
export function generateFileKey(userId: string, projectId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/projects/${projectId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Генерировать ключ для 3D модели
 */
export function generateModelKey(userId: string, projectId: string, modelId: string, extension: string): string {
  return `users/${userId}/projects/${projectId}/models/${modelId}.${extension}`;
}