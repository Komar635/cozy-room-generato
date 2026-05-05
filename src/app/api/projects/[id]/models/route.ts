import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { serializeModel3D } from "@/lib/api/serializers";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma";

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

		const models = await prisma.model3D.findMany({
			where: { projectId },
			orderBy: { createdAt: "desc" },
		});

		const modelIds = models.map((model) => model.id);
		const latestModification =
			modelIds.length > 0
				? await prisma.modification.findFirst({
						where: {
							OR: [
								{ originalModelId: { in: modelIds } },
								{ modifiedModelId: { in: modelIds } },
							],
						},
						orderBy: { createdAt: "desc" },
					})
				: null;

		return NextResponse.json(
			{
				models: models.map(serializeModel3D),
				latestModel: models[0] ? serializeModel3D(models[0]) : null,
				latestModification: latestModification
					? {
							id: latestModification.id,
							originalModelId: latestModification.originalModelId,
							modifiedModelId: latestModification.modifiedModelId,
							modificationType: latestModification.modificationType,
							status: latestModification.status,
							createdAt: latestModification.createdAt.toISOString(),
							completedAt:
								latestModification.completedAt?.toISOString() ?? null,
						}
					: null,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Ошибка в GET /api/projects/[id]/models:", error);
		return NextResponse.json(
			{ error: "Внутренняя ошибка сервера" },
			{ status: 500 },
		);
	}
}
