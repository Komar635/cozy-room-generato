import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { serializeProject } from "@/lib/api/serializers";
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

		const project = await prisma.project.findFirst({
			where: {
				id: params.id,
				userId: session.user.id,
			},
		});

		if (!project) {
			return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
		}

		return NextResponse.json(serializeProject(project), { status: 200 });
	} catch (error) {
		console.error("Ошибка в GET /api/projects/[id]:", error);
		return NextResponse.json(
			{ error: "Внутренняя ошибка сервера" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
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

		const project = await prisma.project.findFirst({
			where: {
				id: params.id,
				userId: session.user.id,
			},
			select: { id: true },
		});

		if (!project) {
			return NextResponse.json({ error: "Проект не найден" }, { status: 404 });
		}

		await prisma.project.delete({ where: { id: project.id } });

		return NextResponse.json(
			{ message: "Проект успешно удалён" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("Ошибка в DELETE /api/projects/[id]:", error);
		return NextResponse.json(
			{ error: "Внутренняя ошибка сервера" },
			{ status: 500 },
		);
	}
}
