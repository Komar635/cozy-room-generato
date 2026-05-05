import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getStyleAnalysisService } from "@/lib/ai/style-analysis";
import { authOptions } from "@/lib/auth/nextauth";
import { prisma } from "@/lib/prisma";

function mapSuggestionParameters(
	type: "recolor" | "restoration" | "geometry_change",
	targetAreas?: string[],
) {
	switch (type) {
		case "recolor":
			return {
				color_map: {
					"#8B7355": "#D9C3A5",
					"#4A3728": "#7A5C43",
				},
				finish: "satin",
				target_areas: targetAreas || [],
			};
		case "restoration":
			return {
				damaged_regions: targetAreas || ["Опорные элементы", "Кромки"],
				restoration_style: "preserved",
			};
		case "geometry_change":
			return {
				modification_description: targetAreas?.length
					? `Адаптировать геометрию зон: ${targetAreas.join(", ")}`
					: "Сделать форму более компактной и пригодной для современного интерьера",
				scale_factor: 0.95,
			};
		default:
			return {};
	}
}

/**
 * GET /api/models/[id]/suggestions
 * Get modification suggestions for a 3D model
 */
export async function GET(
	_request: NextRequest,
	{ params }: { params: { id: string } },
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const modelId = params.id;

		// Verify model exists and user has access
		const model = await prisma.model3D.findUnique({
			where: { id: modelId },
			include: {
				project: {
					select: {
						userId: true,
					},
				},
			},
		});

		if (!model) {
			return NextResponse.json({ error: "Model not found" }, { status: 404 });
		}

		// Get user
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (!user || model.project.userId !== user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		let suggestions = await prisma.modificationSuggestion.findMany({
			where: { modelId },
			orderBy: { createdAt: "desc" },
		});

		if (suggestions.length === 0) {
			const analysis = await prisma.styleAnalysis.findFirst({
				where: { modelId },
				orderBy: { analyzedAt: "desc" },
			});

			if (!analysis) {
				return NextResponse.json(
					{
						error: "No suggestions found",
						message: "Run style analysis first to generate suggestions",
					},
					{ status: 404 },
				);
			}

			const styleService = getStyleAnalysisService();
			const generatedSuggestions = await styleService.generateSuggestions({
				styleDescription: analysis.styleDescription || "",
				dominantColors: Array.isArray(analysis.dominantColors)
					? (analysis.dominantColors as Array<{
							hex: string;
							name: string;
							percentage: number;
						}>)
					: [],
				materials: Array.isArray(analysis.materials)
					? (analysis.materials as Array<{
							name: string;
							type: string;
							confidence: number;
						}>)
					: [],
				styleTags: analysis.styleTags,
			});

			if (generatedSuggestions.length === 0) {
				return NextResponse.json([], { status: 200 });
			}

			await prisma.modificationSuggestion.createMany({
				data: generatedSuggestions.map((suggestion) => ({
					modelId,
					modificationType:
						suggestion.type === "geometry_change"
							? "geometry"
							: suggestion.type,
					description: suggestion.description,
					parameters: mapSuggestionParameters(
						suggestion.type,
						suggestion.targetAreas,
					),
				})),
			});

			suggestions = await prisma.modificationSuggestion.findMany({
				where: { modelId },
				orderBy: { createdAt: "desc" },
			});
		}

		return NextResponse.json(suggestions);
	} catch (error) {
		console.error("Error fetching suggestions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch suggestions" },
			{ status: 500 },
		);
	}
}
