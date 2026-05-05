import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from "three";

export type ViewerModelType = "gaussian-splatting" | "nerf";

export interface ProgressiveModelAsset {
	url: string;
	modelType: ViewerModelType;
	compressed: boolean;
	lodLevel: number;
	pointCount: number;
	triangleBudget: number;
	byteSize: number;
	loadedAt: number;
}

export interface ModelCreationInput {
	photoCount: number;
	averagePhotoMegapixels: number;
	modelType: ViewerModelType;
	compressionRatio: number;
	cacheHit: boolean;
}

export interface ModelCreationEstimate {
	estimatedMs: number;
	compressedBytes: number;
	progressivePreviewMs: number;
}

const modelAssetCache = new Map<string, ProgressiveModelAsset>();
const geometryCache = new Map<string, BufferGeometry>();

export function getModelAssetCacheSize() {
	return modelAssetCache.size;
}

export function clearModelPerformanceCaches() {
	modelAssetCache.clear();
	for (const geometry of geometryCache.values()) {
		geometry.dispose();
	}
	geometryCache.clear();
}

export function resolveCompressedModelUrl(url: string) {
	if (/\.(br|gz)$/i.test(url) || url.startsWith("data:")) {
		return { url, compressed: /\.(br|gz)$/i.test(url) };
	}

	if (/\.(splat|ply|ksplat|nerf|json)$/i.test(url)) {
		return { url: `${url}.br`, compressed: true };
	}

	return { url, compressed: false };
}

export function createLODPlan(
	modelType: ViewerModelType,
	viewportPixels = 1280 * 720,
) {
	const viewportFactor = Math.min(
		1,
		Math.max(0.35, viewportPixels / (1920 * 1080)),
	);
	const basePointCount = modelType === "gaussian-splatting" ? 3000 : 500;
	const baseTriangleBudget = modelType === "nerf" ? 2048 : 256;

	return {
		previewPointCount: Math.max(
			128,
			Math.round(basePointCount * 0.25 * viewportFactor),
		),
		fullPointCount: Math.max(256, Math.round(basePointCount * viewportFactor)),
		triangleBudget: Math.max(
			128,
			Math.round(baseTriangleBudget * viewportFactor),
		),
	};
}

export function estimateModelCreationTime(
	input: ModelCreationInput,
): ModelCreationEstimate {
	const photoWork = input.photoCount * input.averagePhotoMegapixels * 850;
	const typeFactor = input.modelType === "gaussian-splatting" ? 1 : 1.25;
	const cacheFactor = input.cacheHit ? 0.12 : 1;
	const safeCompressionRatio = Math.min(
		0.95,
		Math.max(0.25, input.compressionRatio),
	);
	const compressionFactor = 0.8 + safeCompressionRatio * 0.35;
	const estimatedMs = Math.min(
		10 * 60 * 1000,
		Math.round(photoWork * typeFactor * cacheFactor * compressionFactor),
	);
	const rawBytes = input.photoCount * input.averagePhotoMegapixels * 450_000;
	const compressedBytes = Math.round(rawBytes * safeCompressionRatio);

	return {
		estimatedMs,
		compressedBytes,
		progressivePreviewMs: Math.max(150, Math.round(estimatedMs * 0.18)),
	};
}

export async function loadProgressiveModelAsset(
	url: string,
	modelType: ViewerModelType,
	onProgress?: (progress: number) => void,
) {
	const { url: assetUrl, compressed } = resolveCompressedModelUrl(url);
	const cacheKey = `${modelType}:${assetUrl}`;
	const cached = modelAssetCache.get(cacheKey);

	if (cached) {
		onProgress?.(1);
		return { ...cached };
	}

	const lod = createLODPlan(modelType);
	onProgress?.(0.25);
	await new Promise((resolve) => setTimeout(resolve, 1));
	onProgress?.(0.65);
	await new Promise((resolve) => setTimeout(resolve, 1));

	const asset: ProgressiveModelAsset = {
		url: assetUrl,
		modelType,
		compressed,
		lodLevel: 1,
		pointCount: lod.fullPointCount,
		triangleBudget: lod.triangleBudget,
		byteSize: Math.round(lod.fullPointCount * (compressed ? 18 : 32)),
		loadedAt: Date.now(),
	};

	modelAssetCache.set(cacheKey, asset);
	onProgress?.(1);
	return { ...asset };
}

function seededValue(index: number, salt: number) {
	const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
	return value - Math.floor(value);
}

export function getPointCloudGeometry(
	cacheKey: string,
	pointCount: number,
	radius: number,
) {
	const key = `points:${cacheKey}:${pointCount}:${radius}`;
	const cached = geometryCache.get(key);

	if (cached) {
		return cached;
	}

	const geometry = new BufferGeometry();
	const positions = new Float32Array(pointCount * 3);

	for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
		const offset = pointIndex * 3;
		positions[offset] = (seededValue(pointIndex, 1) - 0.5) * radius;
		positions[offset + 1] = (seededValue(pointIndex, 2) - 0.5) * radius;
		positions[offset + 2] = (seededValue(pointIndex, 3) - 0.5) * radius;
	}

	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
	geometry.computeBoundingSphere();
	geometryCache.set(key, geometry);
	return geometry;
}

export function getNerfPreviewGeometry(
	cacheKey: string,
	triangleBudget: number,
) {
	const widthSegments = Math.max(
		16,
		Math.min(32, Math.round(Math.sqrt(triangleBudget))),
	);
	const heightSegments = Math.max(8, Math.round(widthSegments / 2));
	const key = `nerf:${cacheKey}:${widthSegments}:${heightSegments}`;
	const cached = geometryCache.get(key);

	if (cached) {
		return cached;
	}

	const geometry = new SphereGeometry(1.8, widthSegments, heightSegments);
	geometry.computeBoundingSphere();
	geometryCache.set(key, geometry);
	return geometry;
}
