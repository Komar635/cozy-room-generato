import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import {
	createAppError,
	errorResponse,
	requireNonEmptyString,
	statusToErrorCode,
	withRetry,
} from "@/lib/errors";
import { logError } from "@/lib/errors/logger";
import { preserveCriticalState } from "@/lib/errors/state";
import { prisma } from "@/lib/prisma";

function getPhotogrammetryServiceUrl() {
	const baseUrl = process.env.PHOTOGRAMMETRY_SERVICE_URL;

	if (!baseUrl) {
		throw createAppError(
			"scanning",
			"SERVICE_UNAVAILABLE",
			"PHOTOGRAMMETRY_SERVICE_URL is not configured",
		);
	}

	return baseUrl.replace(/\/$/, "");
}

function getErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === "string") {
		return payload;
	}

	if (payload && typeof payload === "object") {
		const maybePayload = payload as {
			error?: string;
			message?: string;
			detail?:
				| string
				| { error_type?: string; message?: string; recommendations?: string[] };
		};

		if (typeof maybePayload.message === "string") {
			return maybePayload.message;
		}

		if (typeof maybePayload.error === "string") {
			return maybePayload.error;
		}

		if (typeof maybePayload.detail === "string") {
			return maybePayload.detail;
		}

		if (
			maybePayload.detail &&
			typeof maybePayload.detail === "object" &&
			typeof maybePayload.detail.message === "string"
		) {
			return maybePayload.detail.message;
		}
	}

	return fallback;
}

function getErrorCode(payload: unknown, fallback: string) {
	if (!payload || typeof payload !== "object") {
		return fallback;
	}

	const maybePayload = payload as {
		error?: string;
		detail?: string | { error_type?: string };
	};

	if (typeof maybePayload.error === "string") {
		return maybePayload.error;
	}

	if (
		maybePayload.detail &&
		typeof maybePayload.detail === "object" &&
		typeof maybePayload.detail.error_type === "string"
	) {
		return maybePayload.detail.error_type;
	}

	return fallback;
}

export async function POST(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const projectId = requireNonEmptyString(params.id, "projectId", "scanning");

		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true, status: true },
		});

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		const photos = await prisma.photo.findMany({
			where: { projectId },
			select: { id: true, url: true },
			orderBy: { uploadedAt: "asc" },
		});

		if (photos.length < 10) {
			const error = createAppError(
				"scanning",
				"INSUFFICIENT_PHOTOS",
				"Необходимо минимум 10 фотографий для сканирования",
				{ context: { projectId, photoCount: photos.length } },
			);
			logError(error, { route: "POST /api/projects/[id]/scan" });

			return NextResponse.json(errorResponse(error), { status: 400 });
		}

		await prisma.project.update({
			where: { id: projectId },
			data: { status: "scanning" },
		});

		const serviceResponse = await withRetry(
			async () => {
				const response = await fetch(`${getPhotogrammetryServiceUrl()}/scan`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						project_id: projectId,
						photo_urls: photos.map((photo) => photo.url),
						output_format: "gaussian-splatting",
					}),
				});

				if (
					response.status === 408 ||
					response.status === 429 ||
					response.status >= 500
				) {
					throw createAppError(
						"network",
						statusToErrorCode(response.status),
						`Photogrammetry service failed with ${response.status}`,
					);
				}

				return response;
			},
			{ attempts: 2, delayMs: 200 },
		);

		const payload = await serviceResponse.json().catch(() => null);

		if (!serviceResponse.ok) {
			const scanError = createAppError(
				"scanning",
				statusToErrorCode(serviceResponse.status),
				getErrorMessage(payload, "Не удалось запустить реальное сканирование"),
				{ context: { projectId, payload } },
			);
			logError(scanError, { route: "POST /api/projects/[id]/scan" });

			await prisma.project.update({
				where: { id: projectId },
				data: { status: "error" },
			});

			return NextResponse.json(
				{
					...errorResponse(scanError),
					serviceError: getErrorCode(payload, "Failed to start scan"),
				},
				{ status: serviceResponse.status },
			);
		}

		return NextResponse.json({
			jobId:
				payload && typeof payload === "object" && "job_id" in payload
					? payload.job_id
					: null,
			status:
				payload && typeof payload === "object" && "status" in payload
					? payload.status
					: "pending",
			progress: 0,
			message: getErrorMessage(payload, "Сканирование запущено"),
		});
	} catch (error) {
		logError(error, {
			route: "POST /api/projects/[id]/scan",
			projectId: params.id,
		});
		await preserveCriticalState(error, {
			projectId: params.id,
			operation: "scan",
			status: "failed",
		});
		return NextResponse.json(
			errorResponse(
				error instanceof Error
					? error
					: createAppError(
							"scanning",
							"UNKNOWN_ERROR",
							"Internal server error",
						),
			),
			{ status: 500 },
		);
	}
}
