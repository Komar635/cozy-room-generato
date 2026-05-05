import {
	type GenerativeModel,
	GoogleGenerativeAI,
} from "@google/generative-ai";

export interface ModificationSuggestion {
	type: "recolor" | "restoration" | "geometry_change";
	title: string;
	description: string;
	targetAreas?: string[];
	estimatedDifficulty: "easy" | "medium" | "hard";
	priority: number;
}

export interface MaterialSpecItem {
	name: string;
	brand: string;
	code: string;
	quantity: string;
	applicationArea: string;
	finish?: string;
	notes?: string;
}

export interface MaterialSpecificationResult {
	materials: MaterialSpecItem[];
	instructions: string;
	estimatedCoverage?: string;
	safetyNotes?: string[];
}

export interface StyleAnalysisResult {
	styleDescription: string;
	dominantColors: Array<{
		hex: string;
		name: string;
		percentage: number;
	}>;
	materials: Array<{
		name: string;
		type: string;
		confidence: number;
	}>;
	styleTags: string[];
	modificationSuggestions?: ModificationSuggestion[];
}

export class StyleAnalysisService {
	private genAI: GoogleGenerativeAI;
	private model: GenerativeModel;

	constructor(apiKey: string) {
		if (!apiKey) {
			throw new Error("GEMINI_API_KEY is required");
		}
		this.genAI = new GoogleGenerativeAI(apiKey);
		this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
	}

	async analyzeStyle(imageUrl: string): Promise<StyleAnalysisResult> {
		try {
			const prompt = `Analyze this furniture or decor object image and provide a detailed style analysis in JSON format.

Return ONLY valid JSON with this exact structure:
{
  "styleDescription": "A detailed description of the object's style, design era, and aesthetic characteristics",
  "dominantColors": [
    {"hex": "#RRGGBB", "name": "color name", "percentage": 0-100}
  ],
  "materials": [
    {"name": "material name", "type": "wood|metal|fabric|glass|plastic|ceramic|stone", "confidence": 0-1}
  ],
  "styleTags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- Identify 3-5 dominant colors with hex codes
- List 2-4 materials with confidence scores
- Provide 5-8 style tags (e.g., "modern", "vintage", "minimalist", "rustic")
- Style description should be 2-3 sentences`;

			// Fetch image and convert to base64
			const imageResponse = await fetch(imageUrl);
			const imageBuffer = await imageResponse.arrayBuffer();
			const base64Image = Buffer.from(imageBuffer).toString("base64");
			const mimeType =
				imageResponse.headers.get("content-type") || "image/jpeg";

			const result = await this.model.generateContent([
				prompt,
				{
					inlineData: {
						data: base64Image,
						mimeType,
					},
				},
			]);

			const response = await result.response;
			const text = response.text();

			// Extract JSON from response (handle markdown code blocks)
			let jsonText = text.trim();
			if (jsonText.startsWith("```json")) {
				jsonText = jsonText.slice(7);
			} else if (jsonText.startsWith("```")) {
				jsonText = jsonText.slice(3);
			}
			if (jsonText.endsWith("```")) {
				jsonText = jsonText.slice(0, -3);
			}
			jsonText = jsonText.trim();

			const analysis = JSON.parse(jsonText);

			// Validate structure
			if (
				!analysis.styleDescription ||
				!Array.isArray(analysis.dominantColors) ||
				!Array.isArray(analysis.materials) ||
				!Array.isArray(analysis.styleTags)
			) {
				throw new Error("Invalid analysis structure returned from AI");
			}

			return analysis;
		} catch (error) {
			console.error("Style analysis error:", error);
			throw new Error(
				`Failed to analyze style: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async analyzeModelStyle(
		_modelId: string,
		renderUrl: string,
	): Promise<StyleAnalysisResult> {
		return this.analyzeStyle(renderUrl);
	}

	async generateSuggestions(
		analysis: StyleAnalysisResult,
	): Promise<ModificationSuggestion[]> {
		try {
			const prompt = `Based on this furniture analysis, generate modification suggestions in JSON format.

Current analysis:
- Style: ${analysis.styleDescription}
- Colors: ${analysis.dominantColors.map((c) => c.name).join(", ")}
- Materials: ${analysis.materials.map((m) => m.name).join(", ")}
- Tags: ${analysis.styleTags.join(", ")}

Return ONLY valid JSON with this exact structure:
{
  "suggestions": [
    {
      "type": "recolor|restoration|geometry_change",
      "title": "short title",
      "description": "detailed description",
      "targetAreas": ["area1", "area2"],
      "estimatedDifficulty": "easy|medium|hard",
      "priority": 1-5
    }
  ]
}

Generate 3-5 suggestions covering different modification types.`;

			const result = await this.model.generateContent([prompt]);
			const response = await result.response;
			const text = response.text();

			let jsonText = text.trim();
			if (jsonText.startsWith("```json")) {
				jsonText = jsonText.slice(7);
			} else if (jsonText.startsWith("```")) {
				jsonText = jsonText.slice(3);
			}
			if (jsonText.endsWith("```")) {
				jsonText = jsonText.slice(0, -3);
			}
			jsonText = jsonText.trim();

			const data = JSON.parse(jsonText);

			if (!data.suggestions || !Array.isArray(data.suggestions)) {
				throw new Error("Invalid suggestions structure returned from AI");
			}

			return data.suggestions;
		} catch (error) {
			console.error("Generate suggestions error:", error);
			throw new Error(
				`Failed to generate suggestions: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	async generateMaterialSpec(
		analysis: StyleAnalysisResult,
		modificationType: ModificationSuggestion["type"] | "geometry",
		parameters: Record<string, unknown> = {},
	): Promise<MaterialSpecificationResult> {
		try {
			const prompt = `Based on this furniture analysis and planned modification, generate a practical material specification in JSON format.

Current analysis:
- Style: ${analysis.styleDescription}
- Colors: ${analysis.dominantColors.map((c) => `${c.name} ${c.hex}`).join(", ")}
- Materials: ${analysis.materials.map((m) => `${m.name} (${m.type})`).join(", ")}
- Tags: ${analysis.styleTags.join(", ")}

Modification:
- Type: ${modificationType}
- Parameters: ${JSON.stringify(parameters)}

Return ONLY valid JSON with this exact structure:
{
  "materials": [
    {
      "name": "specific material product name",
      "brand": "realistic supplier or brand name",
      "code": "SKU or color/material code",
      "quantity": "amount with unit",
      "applicationArea": "where it is applied on the object",
      "finish": "matte|satin|glossy|natural|textured",
      "notes": "short practical note"
    }
  ],
  "instructions": "step-by-step application recommendations",
  "estimatedCoverage": "coverage or usable area estimate",
  "safetyNotes": ["safety note 1", "safety note 2"]
}

Guidelines:
- Generate 2-6 materials with concrete names, brands, codes and quantities
- Include preparation, application and curing recommendations
- Match materials to detected substrate types and requested modification
- Use concise, workshop-ready language`;

			const result = await this.model.generateContent([prompt]);
			const response = await result.response;
			const text = response.text();
			const data = JSON.parse(extractJsonText(text));
			const spec = normalizeMaterialSpecification(data);

			if (spec.materials.length === 0 || !spec.instructions) {
				throw new Error(
					"Invalid material specification structure returned from AI",
				);
			}

			return spec;
		} catch (error) {
			console.error("Generate material spec error:", error);
			throw new Error(
				`Failed to generate material specification: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}
}

function extractJsonText(text: string): string {
	let jsonText = text.trim();
	if (jsonText.startsWith("```json")) {
		jsonText = jsonText.slice(7);
	} else if (jsonText.startsWith("```")) {
		jsonText = jsonText.slice(3);
	}
	if (jsonText.endsWith("```")) {
		jsonText = jsonText.slice(0, -3);
	}

	return jsonText.trim();
}

function normalizeMaterialSpecification(
	data: unknown,
): MaterialSpecificationResult {
	const source =
		data && typeof data === "object" ? (data as Record<string, unknown>) : {};
	const materials = Array.isArray(source.materials) ? source.materials : [];
	const rawSafetyNotes = source.safetyNotes ?? source.safety_notes;

	return {
		materials: materials
			.map((item) => {
				const material =
					item && typeof item === "object"
						? (item as Record<string, unknown>)
						: {};
				return {
					name: String(material.name ?? "").trim(),
					brand: String(material.brand ?? "").trim(),
					code: String(material.code ?? "").trim(),
					quantity: String(material.quantity ?? "").trim(),
					applicationArea: String(
						material.applicationArea ?? material.application_area ?? "",
					).trim(),
					finish: material.finish ? String(material.finish).trim() : undefined,
					notes: material.notes ? String(material.notes).trim() : undefined,
				};
			})
			.filter(
				(material) =>
					material.name &&
					material.brand &&
					material.code &&
					material.quantity &&
					material.applicationArea,
			),
		instructions: String(source.instructions ?? "").trim(),
		estimatedCoverage:
			source.estimatedCoverage || source.estimated_coverage
				? String(source.estimatedCoverage ?? source.estimated_coverage).trim()
				: undefined,
		safetyNotes: Array.isArray(rawSafetyNotes)
			? rawSafetyNotes.map((note) => String(note)).filter(Boolean)
			: undefined,
	};
}

// Singleton instance
let styleAnalysisService: StyleAnalysisService | null = null;

export function getStyleAnalysisService(): StyleAnalysisService {
	if (!styleAnalysisService) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw new Error("GEMINI_API_KEY environment variable is not set");
		}
		styleAnalysisService = new StyleAnalysisService(apiKey);
	}
	return styleAnalysisService;
}
