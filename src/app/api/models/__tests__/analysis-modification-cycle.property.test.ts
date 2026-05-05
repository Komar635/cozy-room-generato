import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import {
	fromServiceModificationType,
	type ModificationType,
	normalizeModificationRequestBody,
	toServiceModificationType,
} from "@/lib/modifications/contracts";

type ModelType = "gaussian-splatting" | "nerf";

interface StyleAnalysisContract {
	styleDescription: string;
	dominantColors: Array<{
		hex: string;
		name: string;
		percentage: number;
	}>;
	materials: Array<{
		name: string;
		type:
			| "wood"
			| "metal"
			| "fabric"
			| "glass"
			| "plastic"
			| "ceramic"
			| "stone";
		confidence: number;
	}>;
	styleTags: string[];
}

const hexColorArbitrary = fc
	.tuple(
		...Array.from({ length: 6 }, () =>
			fc.constantFrom(
				"0",
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				"A",
				"B",
				"C",
				"D",
				"E",
				"F",
			),
		),
	)
	.map((value) => `#${value.join("")}`);

const styleAnalysisArbitrary: fc.Arbitrary<StyleAnalysisContract> = fc.record({
	styleDescription: fc.string({ minLength: 20, maxLength: 240 }),
	dominantColors: fc.array(
		fc.record({
			hex: hexColorArbitrary,
			name: fc.string({ minLength: 3, maxLength: 24 }),
			percentage: fc.float({ min: 0, max: 100, noNaN: true }),
		}),
		{ minLength: 1, maxLength: 5 },
	),
	materials: fc.array(
		fc.record({
			name: fc.string({ minLength: 3, maxLength: 24 }),
			type: fc.constantFrom(
				"wood",
				"metal",
				"fabric",
				"glass",
				"plastic",
				"ceramic",
				"stone",
			),
			confidence: fc.float({ min: 0, max: 1, noNaN: true }),
		}),
		{ minLength: 1, maxLength: 5 },
	),
	styleTags: fc.array(fc.string({ minLength: 3, maxLength: 24 }), {
		minLength: 1,
		maxLength: 8,
	}),
});

const modificationParametersByType: Record<
	ModificationType,
	Record<string, unknown>
> = {
	recolor: {
		color_map: { "#8B7355": "#D9C3A5" },
		finish: "satin",
	},
	restoration: {
		damaged_regions: ["surface scratches"],
		restoration_style: "preserved",
	},
	geometry: {
		modification_description: "Adjust proportions for a compact interior",
		scale_factor: 0.95,
	},
};

describe("Feature: reality-digitizer-3d, Checkpoint 13: scan-analysis-suggestions-modify contract", () => {
	it("preserves local API contracts through the full cycle without external services", () => {
		fc.assert(
			fc.property(
				fc.record({
					projectId: fc.uuid(),
					modelId: fc.uuid(),
					photoUrls: fc.array(fc.webUrl(), { minLength: 10, maxLength: 30 }),
					modelType: fc.constantFrom<ModelType>("gaussian-splatting", "nerf"),
					analysis: styleAnalysisArbitrary,
					modificationType: fc.constantFrom<ModificationType>(
						"recolor",
						"restoration",
						"geometry",
					),
				}),
				({
					projectId,
					modelId,
					photoUrls,
					modelType,
					analysis,
					modificationType,
				}) => {
					const scanRequest = {
						project_id: projectId,
						photo_urls: photoUrls,
						output_format: modelType,
					};

					expect(scanRequest.photo_urls.length).toBeGreaterThanOrEqual(10);
					expect(scanRequest.output_format).toBe(modelType);
					expect(analysis.dominantColors.length).toBeGreaterThan(0);
					expect(analysis.materials.length).toBeGreaterThan(0);

					const suggestionFromApi = {
						id: crypto.randomUUID(),
						modelId,
						modificationType,
						description: `Apply ${modificationType} to ${analysis.styleTags[0]}`,
						parameters: modificationParametersByType[modificationType],
					};

					const normalized = normalizeModificationRequestBody({
						modificationType: suggestionFromApi.modificationType,
						parameters: suggestionFromApi.parameters,
					});

					expect(normalized.ok).toBe(true);
					if (!normalized.ok) {
						return;
					}

					const serviceModificationType = toServiceModificationType(
						normalized.data.modificationType,
					);
					const serviceRequest = {
						job_id: crypto.randomUUID(),
						project_id: projectId,
						model_id: modelId,
						model_type: modelType,
						modification_type: serviceModificationType,
						parameters: normalized.data.parameters,
						preserve_original: true,
					};

					expect(serviceRequest.modification_type).toBe(
						modificationType === "geometry"
							? "geometry_change"
							: modificationType,
					);
					expect(
						fromServiceModificationType(serviceRequest.modification_type),
					).toBe(modificationType);
					expect(serviceRequest.preserve_original).toBe(true);
				},
			),
			{ numRuns: 100 },
		);
	});

	it("accepts both snake_case API payloads and camelCase UI suggestion payloads", () => {
		fc.assert(
			fc.property(
				fc.constantFrom<ModificationType>("recolor", "restoration", "geometry"),
				(modificationType) => {
					const parameters = modificationParametersByType[modificationType];
					const snakeCase = normalizeModificationRequestBody({
						modification_type: modificationType,
						parameters,
					});
					const camelCase = normalizeModificationRequestBody({
						modificationType,
						parameters,
					});

					expect(snakeCase.ok).toBe(true);
					expect(camelCase.ok).toBe(true);
				},
			),
		);
	});
});
