import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
	getStyleAnalysisService,
	type StyleAnalysisResult,
} from "@/lib/ai/style-analysis";
import { authOptions } from "@/lib/auth/nextauth";
import { buildFallbackMaterialSpec } from "@/lib/material-specifications";
import { prisma } from "@/lib/prisma";

function toRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
}

function toStyleAnalysisResult(analysis: {
	styleDescription: string | null;
	dominantColors: Prisma.JsonValue;
	materials: Prisma.JsonValue;
	styleTags: string[];
}): StyleAnalysisResult {
	return {
		styleDescription: analysis.styleDescription || "",
		dominantColors: Array.isArray(analysis.dominantColors)
			? (analysis.dominantColors as StyleAnalysisResult["dominantColors"])
			: [],
		materials: Array.isArray(analysis.materials)
			? (analysis.materials as StyleAnalysisResult["materials"])
			: [],
		styleTags: analysis.styleTags,
	};
}

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
				materialSpecs: {
					orderBy: { createdAt: "desc" },
					take: 1,
				},
				originalModel: {
					include: {
						project: {
							select: { userId: true },
						},
						styleAnalyses: {
							orderBy: { analyzedAt: "desc" },
							take: 1,
						},
					},
				},
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

		const existingSpec = modification.materialSpecs[0];
		if (existingSpec) {
			return NextResponse.json({
				id: existingSpec.id,
				modificationId: existingSpec.modificationId,
				materials: existingSpec.materials,
				instructions: existingSpec.instructions,
				createdAt: existingSpec.createdAt,
			});
		}

		const analysis = modification.originalModel.styleAnalyses[0];
		if (!analysis) {
			return NextResponse.json(
				{
					error: "Style analysis not found",
					message:
						"Run style analysis before generating material specification",
				},
				{ status: 404 },
			);
		}

		const analysisResult = toStyleAnalysisResult(analysis);
		const parameters = toRecord(modification.parameters);
		let spec = buildFallbackMaterialSpec(
			analysisResult,
			modification.modificationType as "recolor" | "restoration" | "geometry",
			parameters,
		);

		try {
			const styleService = getStyleAnalysisService();
			spec = await styleService.generateMaterialSpec(
				analysisResult,
				modification.modificationType as "recolor" | "restoration" | "geometry",
				parameters,
			);
		} catch (error) {
			console.warn(
				"AI material specification unavailable, using deterministic fallback",
				error,
			);
		}

		const materialSpec = await prisma.materialSpecification.create({
			data: {
				modificationId: modification.id,
				materials: spec.materials as unknown as Prisma.InputJsonValue,
				instructions: spec.instructions,
			},
		});

		return NextResponse.json(
			{
				id: materialSpec.id,
				modificationId: materialSpec.modificationId,
				materials: spec.materials,
				instructions: spec.instructions,
				estimatedCoverage: spec.estimatedCoverage,
				safetyNotes: spec.safetyNotes,
				createdAt: materialSpec.createdAt,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error generating material specification:", error);
		return NextResponse.json(
			{ error: "Failed to generate material specification" },
			{ status: 500 },
		);
	}
}
