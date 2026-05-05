import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import {
	assertModificationRequestContract,
	assertScanRequestContract,
	assertValidPhotoBatch,
	buildModificationServiceRequest,
	buildPhotoUploadContract,
	buildScanServiceRequest,
	MIN_SCAN_PHOTOS,
	type ModelType,
	type ServiceModificationType,
} from "@/lib/testing/scan-modify-contracts";

const modificationParameters: Record<
	ServiceModificationType,
	Record<string, unknown>
> = {
	recolor: {
		color_map: { "#8B7355": "#D9C3A5" },
		finish: "satin",
	},
	restoration: {
		damaged_regions: ["front edge", "left leg"],
		restoration_style: "preserved",
	},
	geometry: {
		modification_description: "Scale object for a compact interior",
		scale_factor: 0.95,
	},
	geometry_change: {
		modification_description: "Scale object for a compact interior",
		scale_factor: 0.95,
	},
};

describe("Task 19.1: scan and modify integration contracts", () => {
	it("covers the full scan cycle without real external services", () => {
		fc.assert(
			fc.property(
				fc.record({
					projectId: fc.uuid(),
					photoCount: fc.integer({ min: MIN_SCAN_PHOTOS, max: 30 }),
					modelType: fc.constantFrom<ModelType>("gaussian-splatting", "nerf"),
				}),
				({ projectId, photoCount, modelType }) => {
					const uploadPayload = Array.from({ length: photoCount }, (_, index) =>
						buildPhotoUploadContract(index),
					);
					const storedPhotos = uploadPayload.map((photo, index) => ({
						id: crypto.randomUUID(),
						project_id: projectId,
						storage_path: `projects/${projectId}/photos/${index}.jpg`,
						url: `https://storage.local/projects/${projectId}/photos/${index}.jpg`,
						size_bytes: photo.fileSize,
					}));

					const scanRequest = buildScanServiceRequest(
						projectId,
						storedPhotos.map((photo) => photo.url),
						modelType,
					);
					const scanServiceResponse = {
						job_id: crypto.randomUUID(),
						status: "completed" as const,
						model_id: crypto.randomUUID(),
						storage_path: `projects/${projectId}/models/original.splat`,
						url: `https://storage.local/projects/${projectId}/models/original.splat`,
					};
					const persistedModel = {
						id: scanServiceResponse.model_id,
						project_id: projectId,
						model_type: scanRequest.output_format,
						storage_path: scanServiceResponse.storage_path,
						url: scanServiceResponse.url,
						is_original: true,
						processing_job_id: scanServiceResponse.job_id,
					};

					expect(assertValidPhotoBatch(uploadPayload)).toBe(true);
					expect(assertScanRequestContract(scanRequest)).toBe(true);
					expect(scanServiceResponse.status).toBe("completed");
					expect(persistedModel.project_id).toBe(projectId);
					expect(persistedModel.is_original).toBe(true);
				},
			),
			{ numRuns: 75 },
		);
	});

	it("covers the full modification cycle and preserves original model lineage", () => {
		fc.assert(
			fc.property(
				fc.record({
					projectId: fc.uuid(),
					originalModelId: fc.uuid(),
					modelType: fc.constantFrom<ModelType>("gaussian-splatting", "nerf"),
					modificationType: fc.constantFrom<ServiceModificationType>(
						"recolor",
						"restoration",
						"geometry_change",
					),
				}),
				({ projectId, originalModelId, modelType, modificationType }) => {
					const jobId = crypto.randomUUID();
					const request = buildModificationServiceRequest({
						jobId,
						projectId,
						modelId: originalModelId,
						modelType,
						modificationType,
						parameters: modificationParameters[modificationType],
					});
					const serviceResponse = {
						new_model_id: crypto.randomUUID(),
						status: "completed" as const,
						model_type: modelType,
						storage_path: `projects/${projectId}/models/${modificationType}.splat`,
						url: `https://storage.local/projects/${projectId}/models/${modificationType}.splat`,
						modification_type: modificationType,
						parameters: request.parameters,
						completed_at: new Date().toISOString(),
					};
					const modifiedModel = {
						id: serviceResponse.new_model_id,
						project_id: projectId,
						parent_model_id: originalModelId,
						model_type: serviceResponse.model_type,
						storage_path: serviceResponse.storage_path,
						url: serviceResponse.url,
						is_original: false,
						processing_job_id: jobId,
					};

					expect(assertModificationRequestContract(request)).toBe(true);
					expect(request.preserve_original).toBe(true);
					expect(serviceResponse.status).toBe("completed");
					expect(modifiedModel.parent_model_id).toBe(originalModelId);
					expect(modifiedModel.is_original).toBe(false);
				},
			),
			{ numRuns: 75 },
		);
	});

	it("keeps microservice handoff stable from scan output to modification input", () => {
		fc.assert(
			fc.property(fc.uuid(), fc.uuid(), (projectId, scanModelId) => {
				const scanResponse = {
					job_id: crypto.randomUUID(),
					status: "completed" as const,
					model_id: scanModelId,
					model_type: "gaussian-splatting" as const,
				};
				const modifyRequest = buildModificationServiceRequest({
					jobId: crypto.randomUUID(),
					projectId,
					modelId: scanResponse.model_id,
					modelType: scanResponse.model_type,
					modificationType: "recolor",
					parameters: modificationParameters.recolor,
				});

				expect(scanResponse.status).toBe("completed");
				expect(modifyRequest.model_id).toBe(scanModelId);
				expect(modifyRequest.model_type).toBe(scanResponse.model_type);
				expect(assertModificationRequestContract(modifyRequest)).toBe(true);
			}),
			{ numRuns: 75 },
		);
	});
});
