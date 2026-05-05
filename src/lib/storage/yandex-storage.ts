import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Инициализация S3 клиента для Yandex Object Storage
const s3Client = new S3Client({
	region: process.env.YC_STORAGE_REGION || "ru-central1",
	endpoint:
		process.env.YC_STORAGE_ENDPOINT || "https://storage.yandexcloud.net",
	credentials: {
		accessKeyId: process.env.YC_STORAGE_ACCESS_KEY || "",
		secretAccessKey: process.env.YC_STORAGE_SECRET_KEY || "",
	},
});

const BUCKET_NAME = process.env.YC_STORAGE_BUCKET || "";
const PUBLIC_BASE_URL = process.env.YC_STORAGE_PUBLIC_URL?.replace(/\/$/, "");

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
export async function uploadFile({
	file,
	key,
	contentType,
}: UploadFileParams): Promise<string> {
	assertStorageConfigured();

	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		Body: file,
		ContentType: contentType,
	});

	await s3Client.send(command);

	return getPublicFileUrl(key);
}

/**
 * Получить подписанный URL для доступа к файлу
 */
export async function getSignedFileUrl({
	key,
	expiresIn = 3600,
}: GetFileUrlParams): Promise<string> {
	assertStorageConfigured();

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
	assertStorageConfigured();

	const command = new DeleteObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
	});

	await s3Client.send(command);
}

export async function objectExists(key: string): Promise<boolean> {
	assertStorageConfigured();

	try {
		await s3Client.send(
			new HeadObjectCommand({
				Bucket: BUCKET_NAME,
				Key: key,
			}),
		);
		return true;
	} catch {
		return false;
	}
}

export function getPublicFileUrl(key: string): string {
	assertStorageConfigured();

	if (PUBLIC_BASE_URL) {
		return `${PUBLIC_BASE_URL}/${key}`;
	}

	return `https://${BUCKET_NAME}.storage.yandexcloud.net/${key}`;
}

export function getStorageBucketName(): string {
	assertStorageConfigured();
	return BUCKET_NAME;
}

function assertStorageConfigured() {
	if (!BUCKET_NAME) {
		throw new Error("YC_STORAGE_BUCKET is not configured");
	}

	if (
		!process.env.YC_STORAGE_ACCESS_KEY ||
		!process.env.YC_STORAGE_SECRET_KEY
	) {
		throw new Error("Yandex Object Storage credentials are not configured");
	}
}

/**
 * Генерировать уникальный ключ для файла
 */
export function generateFileKey(
	userId: string,
	projectId: string,
	fileName: string,
): string {
	const timestamp = Date.now();
	const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
	return `users/${userId}/projects/${projectId}/${timestamp}-${sanitizedFileName}`;
}

/**
 * Генерировать ключ для 3D модели
 */
export function generateModelKey(
	userId: string,
	projectId: string,
	modelId: string,
	extension: string,
): string {
	return `users/${userId}/projects/${projectId}/models/${modelId}.${extension}`;
}
