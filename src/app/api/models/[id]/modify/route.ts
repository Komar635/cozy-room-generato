import type { Prisma } from "@prisma/client";
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
import {
	fromServiceModificationType,
	normalizeModificationRequestBody,
	toServiceModificationType,
} from "@/lib/modifications/contracts";
import { prisma } from "@/lib/prisma";

function getModificationServiceUrl() {
	const baseUrl = process.env.MODIFICATION_SERVICE_URL;

	if (!baseUrl) {
		throw createAppError(
			"modification",
			"SERVICE_UNAVAILABLE",
			"MODIFICATION_SERVICE_URL is not configured",
		);
	}

	return baseUrl.replace(/\/$/, "");
}

function getErrorMessage(payload: unknown, fallback: string) {
	if (payload && typeof payload === "object" && "detail" in payload) {
		const detail = payload.detail;
		if (typeof detail === "string") {
			return detail;
		}
	}

	if (payload && typeof payload === "object" && "error" in payload) {
		const error = payload.error;
		if (typeof error === "string") {
			return error;
		}
	}

	return fallback;
}

export async function POST(
	request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const validation = normalizeModificationRequestBody(await request.json());

		if (!validation.ok) {
			const error = createAppError(
				"modification",
				"INVALID_PARAMETERS",
				validation.error,
			);
			logError(error, { route: "POST /api/models/[id]/modify" });

			return NextResponse.json(errorResponse(error), { status: 400 });
		}

		const { modificationType, parameters } = validation.data;
		const jsonParameters = parameters as Prisma.InputJsonValue;

		const modelId = requireNonEmptyString(params.id, "modelId", "modification");

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const model = await prisma.model3D.findUnique({
			where: { id: modelId },
			include: {
				project: {
					select: {
						id: true,
						userId: true,
					},
				},
			},
		});

		if (!model) {
			return NextResponse.json({ error: "Model not found" }, { status: 404 });
		}

		if (model.project.userId !== user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const processingJobId = crypto.randomUUID();
		const startedAt = new Date();

		const pendingState = await prisma.$transaction(async (tx) => {
			const processingJob = await tx.processingJob.create({
				data: {
					id: processingJobId,
					jobType: "modify",
					projectId: model.project.id,
					status: "pending",
					progress: 0,
					startedAt,
				},
			});

			const modification = await tx.modification.create({
				data: {
					originalModelId: model.id,
					modificationType,
					parameters: jsonParameters,
					status: "pending",
					processingJobId,
				},
			});

			await tx.project.update({
				where: { id: model.project.id },
				data: { status: "modifying" },
			});

			return { processingJob, modification };
		});

		const serviceResponse = await withRetry(
			async () => {
				const response = await fetch(`${getModificationServiceUrl()}/modify`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						job_id: processingJobId,
						project_id: model.project.id,
						model_id: model.id,
						model_type: model.modelType,
						modification_type: toServiceModificationType(modificationType),
						parameters,
						preserve_original: true,
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
						`Modification service failed with ${response.status}`,
					);
				}

				return response;
			},
			{ attempts: 2, delayMs: 200 },
		);

		const payload = await serviceResponse.json().catch(() => null);

		if (!serviceResponse.ok) {
			const modificationError = createAppError(
				"modification",
				statusToErrorCode(serviceResponse.status),
				getErrorMessage(
					payload,
					"Не удалось выполнить модификацию через Python service",
				),
				{ context: { modelId, processingJobId, payload } },
			);
			logError(modificationError, { route: "POST /api/models/[id]/modify" });

			await prisma.$transaction(async (tx) => {
				await tx.processingJob.update({
					where: { id: processingJobId },
					data: {
						status: "failed",
						progress: 0,
						errorMessage: getErrorMessage(
							payload,
							"Modification service failed",
						),
						completedAt: new Date(),
					},
				});

				await tx.modification.update({
					where: { id: pendingState.modification.id },
					data: {
						status: "failed",
						completedAt: new Date(),
					},
				});

				await tx.project.update({
					where: { id: model.project.id },
					data: { status: "error" },
				});
			});

			return NextResponse.json(errorResponse(modificationError), {
				status: serviceResponse.status,
			});
		}

		const completedAt =
			payload && typeof payload === "object" && "completed_at" in payload
				? new Date(String(payload.completed_at))
				: new Date();

		const result = await prisma.$transaction(async (tx) => {
			const modifiedModel = await tx.model3D.create({
				data: {
					id:
						payload && typeof payload === "object" && "new_model_id" in payload
							? String(payload.new_model_id)
							: crypto.randomUUID(),
					projectId: model.project.id,
					parentModelId: model.id,
					modelType:
						payload && typeof payload === "object" && "model_type" in payload
							? String(payload.model_type)
							: model.modelType,
					storagePath:
						payload && typeof payload === "object" && "storage_path" in payload
							? String(payload.storage_path)
							: `${model.storagePath.replace(/\.[^./]+$/, "")}-${modificationType}`,
					url:
						payload && typeof payload === "object" && "url" in payload
							? String(payload.url)
							: model.url,
					isOriginal: false,
					processingJobId,
				},
			});

			const modification = await tx.modification.update({
				where: { id: pendingState.modification.id },
				data: {
					modifiedModelId: modifiedModel.id,
					modificationType:
						payload &&
						typeof payload === "object" &&
						"modification_type" in payload
							? fromServiceModificationType(String(payload.modification_type))
							: modificationType,
					status:
						payload && typeof payload === "object" && "status" in payload
							? String(payload.status)
							: "completed",
					parameters:
						payload && typeof payload === "object" && "parameters" in payload
							? (payload.parameters as Prisma.InputJsonValue)
							: jsonParameters,
					completedAt,
				},
			});

			await tx.processingJob.update({
				where: { id: processingJobId },
				data: {
					status:
						payload && typeof payload === "object" && "status" in payload
							? String(payload.status)
							: "completed",
					progress: 100,
					completedAt,
				},
			});

			await tx.project.update({
				where: { id: model.project.id },
				data: { status: "ready" },
			});

			return { modification, modifiedModel };
		});

		return NextResponse.json(
			{
				modificationId: result.modification.id,
				originalModelId: model.id,
				modifiedModelId: result.modifiedModel.id,
				processingJobId,
				status: result.modification.status,
				message:
					result.modification.status === "completed"
						? "Modification completed"
						: "Modification started",
			},
			{ status: 201 },
		);
	} catch (error) {
		logError(error, {
			route: "POST /api/models/[id]/modify",
			modelId: params.id,
		});
		await preserveCriticalState(error, {
			modelId: params.id,
			operation: "modify",
			status: "failed",
		});
		return NextResponse.json(
			errorResponse(
				error instanceof Error
					? error
					: createAppError("modification", "MODIFICATION_FAILED"),
			),
			{ status: 500 },
		);
	}
}
