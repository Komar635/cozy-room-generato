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
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const projectId = params.id;

		const project = await prisma.project.findFirst({
			where: { id: projectId, userId: session.user.id },
			select: { id: true, status: true },
		});

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		const job = await prisma.processingJob.findFirst({
			where: {
				projectId,
				jobType: "scan",
			},
			orderBy: { createdAt: "desc" },
		});

		if (!job) {
			return NextResponse.json(
				{
					error: "No scanning job found",
					message: "Сканирование еще не запущено",
				},
				{ status: 404 },
			);
		}

		if (job.status === "completed" && project.status !== "ready") {
			await prisma.project.update({
				where: { id: projectId },
				data: { status: "ready" },
			});
		} else if (job.status === "failed" && project.status !== "error") {
			await prisma.project.update({
				where: { id: projectId },
				data: { status: "error" },
			});
		}

		let elapsedTime = null;
		if (job.startedAt) {
			const startTime = job.startedAt.getTime();
			const endTime = job.completedAt ? job.completedAt.getTime() : Date.now();
			elapsedTime = Math.floor((endTime - startTime) / 1000);
		}

		let estimatedTimeRemaining = null;
		if (job.status === "processing" && job.progress > 0) {
			const totalEstimatedTime = 600;
			const progressRatio = job.progress / 100;
			estimatedTimeRemaining = Math.floor(
				totalEstimatedTime * (1 - progressRatio),
			);
		}

		return NextResponse.json({
			jobId: job.id,
			status: job.status,
			progress: job.progress,
			errorMessage: job.errorMessage,
			startedAt: job.startedAt?.toISOString() ?? null,
			completedAt: job.completedAt?.toISOString() ?? null,
			createdAt: job.createdAt.toISOString(),
			elapsedTime,
			estimatedTimeRemaining,
		});
	} catch (error) {
		console.error("Error getting scan status:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
