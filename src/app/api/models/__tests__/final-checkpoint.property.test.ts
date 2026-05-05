import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import {
	cloneOrbitState,
	orbitStatesEqual,
	syncOrbitViewState,
} from "@/components/3d/comparisonSync";
import {
	createLODPlan,
	estimateModelCreationTime,
	loadProgressiveModelAsset,
	resolveCompressedModelUrl,
} from "@/components/3d/modelPerformance";
import { createAppError, explainError } from "@/lib/errors";
import { buildFallbackMaterialSpec } from "@/lib/material-specifications";
import {
	type ModificationType,
	normalizeModificationRequestBody,
	toServiceModificationType,
} from "@/lib/modifications/contracts";

type ModelType = "gaussian-splatting" | "nerf";

const supportedPhotoMimeTypes = new Set([
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
]);
const maxPhotoSizeBytes = 10 * 1024 * 1024;
const minPhotoCount = 10;

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
	.map((parts) => `#${parts.join("")}`);

const materialTypeArbitrary = fc.constantFrom(
	"wood",
	"metal",
	"fabric",
	"glass",
	"plastic",
	"ceramic",
	"stone",
);

const styleAnalysisArbitrary = fc.record({
	styleDescription: fc.string({ minLength: 20, maxLength: 180 }),
	dominantColors: fc.array(
		fc.record({
			hex: hexColorArbitrary,
			name: fc.string({ minLength: 3, maxLength: 24 }),
			percentage: fc.float({
				min: Math.fround(1),
				max: Math.fround(100),
				noNaN: true,
			}),
		}),
		{ minLength: 1, maxLength: 5 },
	),
	materials: fc.array(
		fc.record({
			name: fc.string({ minLength: 3, maxLength: 24 }),
			type: materialTypeArbitrary,
			confidence: fc.float({
				min: Math.fround(0.2),
				max: Math.fround(1),
				noNaN: true,
			}),
		}),
		{ minLength: 1, maxLength: 5 },
	),
	styleTags: fc.array(fc.string({ minLength: 3, maxLength: 24 }), {
		minLength: 1,
		maxLength: 5,
	}),
});

const modificationParameters: Record<
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

function validateSelectedPhotos(
	photos: Array<{ size: number; mimeType: string }>,
) {
	return {
		accepted: photos.every(
			(photo) =>
				photo.size > 0 &&
				photo.size <= maxPhotoSizeBytes &&
				supportedPhotoMimeTypes.has(photo.mimeType),
		),
		canStartScan: photos.length >= minPhotoCount,
	};
}

describe("Feature: reality-digitizer-3d, Checkpoint 18: local final verification", () => {
	it("covers the core user journey contracts without browser, dev server or external calls", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.record({
					projectId: fc.uuid(),
					modelId: fc.uuid(),
					modificationId: fc.uuid(),
					modelType: fc.constantFrom<ModelType>("gaussian-splatting", "nerf"),
					photoCount: fc.integer({ min: 10, max: 40 }),
					photoSize: fc.integer({ min: 32_000, max: maxPhotoSizeBytes }),
					photoMimeType: fc.constantFrom(...supportedPhotoMimeTypes),
					analysis: styleAnalysisArbitrary,
					modificationType: fc.constantFrom<ModificationType>(
						"recolor",
						"restoration",
						"geometry",
					),
				}),
				async ({
					projectId,
					modelId,
					modificationId,
					modelType,
					photoCount,
					photoSize,
					photoMimeType,
					analysis,
					modificationType,
				}) => {
					const selectedPhotos = Array.from(
						{ length: photoCount },
						(_, index) => ({
							fileName: `photo-${index + 1}.jpg`,
							size: photoSize,
							mimeType: photoMimeType,
							url: `memory://projects/${projectId}/photos/${index + 1}`,
						}),
					);

					const uploadValidation = validateSelectedPhotos(selectedPhotos);
					expect(uploadValidation.accepted).toBe(true);
					expect(uploadValidation.canStartScan).toBe(true);

					const scanPayload = {
						project_id: projectId,
						photo_urls: selectedPhotos.map((photo) => photo.url),
						output_format: modelType,
					};
					expect(scanPayload.photo_urls).toHaveLength(photoCount);
					expect(scanPayload.output_format).toBe(modelType);

					const viewerUrl = `memory://models/${modelId}.${modelType === "nerf" ? "nerf" : "splat"}`;
					const compressed = resolveCompressedModelUrl(viewerUrl);
					const asset = await loadProgressiveModelAsset(
						compressed.url,
						modelType,
					);
					expect(asset.modelType).toBe(modelType);
					expect(asset.pointCount).toBeGreaterThan(0);
					expect(asset.triangleBudget).toBeGreaterThan(0);

					const modification = normalizeModificationRequestBody({
						modificationType,
						parameters: modificationParameters[modificationType],
					});
					expect(modification.ok).toBe(true);
					if (!modification.ok) {
						return;
					}

					const servicePayload = {
						job_id: crypto.randomUUID(),
						project_id: projectId,
						model_id: modelId,
						modification_id: modificationId,
						model_type: modelType,
						modification_type: toServiceModificationType(
							modification.data.modificationType,
						),
						parameters: modification.data.parameters,
						preserve_original: true,
					};
					expect(servicePayload.preserve_original).toBe(true);
					expect(servicePayload.modification_type).toBe(
						modificationType === "geometry"
							? "geometry_change"
							: modificationType,
					);

					const leftView = cloneOrbitState({
						position: [1, 2, 6],
						target: [0, 0, 0],
					});
					const rightView = syncOrbitViewState(leftView);
					expect(orbitStatesEqual(leftView, rightView)).toBe(true);

					const materialSpec = buildFallbackMaterialSpec(
						analysis,
						modification.data.modificationType,
						modification.data.parameters,
					);
					expect(materialSpec.materials.length).toBeGreaterThan(0);
					expect(materialSpec.instructions.length).toBeGreaterThan(0);

					const explainedError = explainError(
						createAppError(
							"network",
							"NETWORK_ERROR",
							"Simulated local retryable failure",
						),
					);
					expect(explainedError.retryable).toBe(true);
					expect(explainedError.recommendations.length).toBeGreaterThan(0);
				},
			),
			{ numRuns: 50 },
		);
	});

	it("checks performance budgets on local synthetic data", async () => {
		const start = performance.now();

		for (const modelType of ["gaussian-splatting", "nerf"] as const) {
			for (const viewportPixels of [320 * 240, 1280 * 720, 1920 * 1080]) {
				const lodPlan = createLODPlan(modelType, viewportPixels);
				expect(lodPlan.previewPointCount).toBeGreaterThan(0);
				expect(lodPlan.fullPointCount).toBeGreaterThanOrEqual(
					lodPlan.previewPointCount,
				);
				expect(lodPlan.triangleBudget).toBeGreaterThan(0);
			}

			const estimate = estimateModelCreationTime({
				photoCount: 120,
				averagePhotoMegapixels: 8,
				modelType,
				compressionRatio: 0.45,
				cacheHit: false,
			});

			expect(estimate.estimatedMs).toBeLessThanOrEqual(10 * 60 * 1000);
			expect(estimate.progressivePreviewMs).toBeLessThanOrEqual(110 * 1000);
			expect(estimate.compressedBytes).toBeGreaterThan(0);
		}

		const elapsedMs = performance.now() - start;
		expect(elapsedMs).toBeLessThan(2_500);
	});
});
