import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma";

export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const modification = await prisma.modification.findUnique({
			where: { id: params.id },
			include: {
				originalModel: {
					include: {
						project: {
							select: { userId: true },
						},
					},
				},
				modifiedModel: true,
			},
		});

		if (!modification) {
			return NextResponse.json(
				{ error: "Modification not found" },
				{ status: 404 },
			);
		}

		if (modification.originalModel.project.userId !== user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const processingJob = modification.processingJobId
			? await prisma.processingJob.findUnique({
					where: { id: modification.processingJobId },
				})
			: null;

		return NextResponse.json({
			id: modification.id,
			originalModelId: modification.originalModelId,
			modifiedModelId: modification.modifiedModelId,
			modificationType: modification.modificationType,
			parameters: modification.parameters,
			status: modification.status,
			processingJobId: modification.processingJobId,
			createdAt: modification.createdAt,
			completedAt: modification.completedAt,
			modifiedModel: modification.modifiedModel,
			processingJob,
		});
	} catch (error) {
		console.error("Error fetching modification:", error);
		return NextResponse.json(
			{ error: "Failed to fetch modification" },
			{ status: 500 },
		);
	}
}
