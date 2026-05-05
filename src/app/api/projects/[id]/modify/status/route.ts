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

		const project = await prisma.project.findUnique({
			where: { id: params.id },
			select: {
				id: true,
				userId: true,
				status: true,
			},
		});

		if (!project) {
			return NextResponse.json({ error: "Project not found" }, { status: 404 });
		}

		if (project.userId !== user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const job = await prisma.processingJob.findFirst({
			where: {
				projectId: params.id,
				jobType: "modify",
			},
			orderBy: { createdAt: "desc" },
		});

		if (!job) {
			return NextResponse.json(
				{
					error: "No modification job found",
					message: "Модификация еще не запускалась",
				},
				{ status: 404 },
			);
		}

		let elapsedTime = null;
		if (job.startedAt) {
			const startTime = new Date(job.startedAt).getTime();
			const endTime = job.completedAt
				? new Date(job.completedAt).getTime()
				: Date.now();
			elapsedTime = Math.floor((endTime - startTime) / 1000);
		}

		return NextResponse.json({
			jobId: job.id,
			status: job.status,
			progress: job.progress,
			errorMessage: job.errorMessage,
			startedAt: job.startedAt,
			completedAt: job.completedAt,
			createdAt: job.createdAt,
			elapsedTime,
			estimatedTimeRemaining: job.status === "processing" ? 30 : 0,
		});
	} catch (error) {
		console.error("Error getting modification status:", error);
		return NextResponse.json(
			{ error: "Failed to fetch modification status" },
			{ status: 500 },
		);
	}
}
