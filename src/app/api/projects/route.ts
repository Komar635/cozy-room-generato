import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { serializeProject } from "@/lib/api/serializers";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma";

const createProjectSchema = z.object({
	name: z.string().min(1, "Название проекта обязательно").max(255),
	description: z.string().optional(),
});

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Необходима авторизация" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const validationResult = createProjectSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{ error: "Неверные данные", details: validationResult.error.issues },
				{ status: 400 },
			);
		}

		const { name, description } = validationResult.data;

		const project = await prisma.project.create({
			data: {
				userId: session.user.id,
				name,
				description: description || null,
				status: "created",
			},
		});

		return NextResponse.json(serializeProject(project), { status: 201 });
	} catch (error) {
		console.error("Ошибка в POST /api/projects:", error);
		return NextResponse.json(
			{ error: "Внутренняя ошибка сервера" },
			{ status: 500 },
		);
	}
}

export async function GET(_request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			return NextResponse.json(
				{ error: "Необходима авторизация" },
				{ status: 401 },
			);
		}

		const projects = await prisma.project.findMany({
			where: { userId: session.user.id },
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json(projects.map(serializeProject), { status: 200 });
	} catch (error) {
		console.error("Ошибка в GET /api/projects:", error);
		return NextResponse.json(
			{ error: "Внутренняя ошибка сервера" },
			{ status: 500 },
		);
	}
}
