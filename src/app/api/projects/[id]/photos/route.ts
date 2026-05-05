import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { serializePhoto } from "@/lib/api/serializers";
import { authOptions } from "@/lib/auth/nextauth";
import {
	createAppError,
	errorResponse,
	requireNonEmptyString,
	withRetry,
} from "@/lib/errors";
import { logError } from "@/lib/errors/logger";
import { preserveCriticalState } from "@/lib/errors/state";
import { prisma } from "@/lib/prisma";
import { deleteFile, uploadFile } from "@/lib/storage/yandex-storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const uploadPhotoSchema = z.object({
	fileName: z.string().min(1),
	fileSize: z
		.number()
		.max(
			MAX_FILE_SIZE,
			`Размер файла не должен превышать ${MAX_FILE_SIZE / 1024 / 1024} МБ`,
		),
	mimeType: z
		.enum(["image/jpeg", "image/jpg", "image/png", "image/webp"])
		.refine((val) => ALLOWED_FORMATS.includes(val), {
			message: "Поддерживаются только форматы: JPEG, PNG, WebP",
		}),
	base64Data: z.string().min(1),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Необходима авторизация" },
				{ status: 401 },
			);
		}

		const projectId = requireNonEmptyString(
			params.id,
			"projectId",
			"photo_upload",
		);

		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true, status: true },
		});

		if (!project) {
			return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
		}

		const body = await request.json();
		const { photos } = body;

		if (!Array.isArray(photos) || photos.length === 0) {
			const error = createAppError(
				"photo_upload",
				"INSUFFICIENT_PHOTOS",
				"Необходимо загрузить хотя бы одну фотографию",
			);
			logError(error, { route: "POST /api/projects/[id]/photos", projectId });

			return NextResponse.json(errorResponse(error), { status: 400 });
		}

		const validationErrors: string[] = [];
		for (let i = 0; i < photos.length; i++) {
			const result = uploadPhotoSchema.safeParse(photos[i]);
			if (!result.success) {
				validationErrors.push(
					`Фото ${i + 1}: ${result.error.issues[0].message}`,
				);
			}
		}

		if (validationErrors.length > 0) {
			const error = createAppError(
				"photo_upload",
				"INVALID_PARAMETERS",
				"Ошибки валидации фотографий",
				{ context: { validationErrors } },
			);
			logError(error, { route: "POST /api/projects/[id]/photos", projectId });

			return NextResponse.json(
				{ ...errorResponse(error), details: validationErrors },
				{ status: 400 },
			);
		}

		const uploadedPhotos = [];
		const uploadErrors = [];

		for (let i = 0; i < photos.length; i++) {
			const photo = photos[i];
			const timestamp = Date.now();
			const randomId = Math.random().toString(36).substring(7);
			const extension = photo.mimeType.split("/")[1];
			const storagePath = `projects/${projectId}/photos/${timestamp}-${randomId}.${extension}`;

			try {
				const base64Data = photo.base64Data.replace(
					/^data:image\/\w+;base64,/,
					"",
				);
				const buffer = Buffer.from(base64Data, "base64");

				const publicUrl = await withRetry(
					() =>
						uploadFile({
							file: buffer,
							key: storagePath,
							contentType: photo.mimeType,
						}),
					{ attempts: 2, delayMs: 150 },
				);

				try {
					const photoRecord = await prisma.photo.create({
						data: {
							projectId,
							storagePath,
							url: publicUrl,
							sizeBytes: photo.fileSize,
						},
					});

					uploadedPhotos.push(serializePhoto(photoRecord));
				} catch (dbError) {
					await deleteFile(storagePath).catch((deleteError) => {
						logError(deleteError, {
							route: "POST /api/projects/[id]/photos",
							projectId,
							storagePath,
						});
					});
					logError(dbError, {
						route: "POST /api/projects/[id]/photos",
						projectId,
					});
					uploadErrors.push(`Фото ${i + 1}: Ошибка сохранения метаданных`);
				}
			} catch (error) {
				logError(error, {
					route: "POST /api/projects/[id]/photos",
					projectId,
					photoIndex: i + 1,
				});
				uploadErrors.push(`Фото ${i + 1}: Внутренняя ошибка`);
			}
		}

		if (uploadedPhotos.length > 0) {
			await prisma.project.update({
				where: { id: projectId },
				data: { status: "uploading" },
			});
		}

		if (uploadErrors.length > 0 && uploadedPhotos.length === 0) {
			const error = createAppError(
				"photo_upload",
				"UPLOAD_FAILED",
				"Не удалось загрузить фотографии",
				{ context: { uploadErrors } },
			);
			logError(error, { route: "POST /api/projects/[id]/photos", projectId });
			await preserveCriticalState(error, {
				projectId,
				operation: "upload",
				status: "failed",
				payload: {
					uploaded: uploadedPhotos.length,
					failed: uploadErrors.length,
				},
			});

			return NextResponse.json(
				{ ...errorResponse(error), details: uploadErrors },
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				success: true,
				uploaded: uploadedPhotos.length,
				failed: uploadErrors.length,
				photos: uploadedPhotos,
				errors: uploadErrors.length > 0 ? uploadErrors : undefined,
			},
			{ status: 201 },
		);
	} catch (error) {
		logError(error, {
			route: "POST /api/projects/[id]/photos",
			projectId: params.id,
		});
		await preserveCriticalState(error, {
			projectId: params.id,
			operation: "upload",
			status: "failed",
		});
		return NextResponse.json(
			errorResponse(
				error instanceof Error
					? error
					: createAppError("photo_upload", "UNKNOWN_ERROR"),
			),
			{ status: 500 },
		);
	}
}

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Необходима авторизация" },
				{ status: 401 },
			);
		}

		const projectId = params.id;
		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true },
		});

		if (!project) {
			return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
		}

		const photos = await prisma.photo.findMany({
			where: { projectId },
			orderBy: { uploadedAt: "asc" },
		});

		return NextResponse.json(
			{
				photos: photos.map(serializePhoto),
				count: photos.length,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Ошибка в GET /api/projects/[id]/photos:", error);
		return NextResponse.json(
			{ error: "Внутренняя ошибка сервера" },
			{ status: 500 },
		);
	}
}
