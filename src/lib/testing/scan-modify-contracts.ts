export type ModelType = "gaussian-splatting" | "nerf";
export type ModificationType = "recolor" | "restoration" | "geometry";
export type ServiceModificationType = ModificationType | "geometry_change";
export type ProcessingStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed";

export interface PhotoUploadContract {
	fileName: string;
	fileSize: number;
	mimeType: "image/jpeg" | "image/jpg" | "image/png" | "image/webp";
	base64Data: string;
}

export interface ScanServiceRequestContract {
	project_id: string;
	photo_urls: string[];
	output_format: ModelType;
}

export interface ScanServiceResponseContract {
	job_id: string;
	status: ProcessingStatus;
	model_id?: string;
	storage_path?: string;
	url?: string;
}

export interface ModificationServiceRequestContract {
	job_id: string;
	project_id: string;
	model_id: string;
	model_type: ModelType;
	modification_type: ServiceModificationType;
	parameters: Record<string, unknown>;
	preserve_original: true;
}

export interface ModificationServiceResponseContract {
	new_model_id: string;
	status: ProcessingStatus;
	model_type: ModelType;
	storage_path: string;
	url: string;
	modification_type: ServiceModificationType;
	parameters: Record<string, unknown>;
	completed_at: string;
}

export interface E2EContractStep {
	id: string;
	label: string;
	method: "GET" | "POST" | "DELETE";
	path: string;
	expectedStatus: number | number[];
	requiredUiSignals: string[];
}

export const MIN_SCAN_PHOTOS = 10;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
export const SUPPORTED_PHOTO_MIME_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/webp",
] as const;

export const e2eContractHarness: E2EContractStep[] = [
	{
		id: "create-project",
		label: "Создание проекта",
		method: "POST",
		path: "/api/projects",
		expectedStatus: 201,
		requiredUiSignals: ["Создать новый проект", "Мои проекты"],
	},
	{
		id: "upload-photos",
		label: "Загрузка фотографий",
		method: "POST",
		path: "/api/projects/:projectId/photos",
		expectedStatus: 201,
		requiredUiSignals: ["Загрузить фотографии", "Фотографии объекта"],
	},
	{
		id: "start-scan",
		label: "Запуск сканирования",
		method: "POST",
		path: "/api/projects/:projectId/scan",
		expectedStatus: 200,
		requiredUiSignals: ["Запустить сканирование", "Сканирование и прогресс"],
	},
	{
		id: "view-model",
		label: "Визуализация модели",
		method: "GET",
		path: "/api/projects/:projectId/models",
		expectedStatus: 200,
		requiredUiSignals: ["3D-модель проекта", "Режим сравнения"],
	},
	{
		id: "apply-modification",
		label: "Применение модификации",
		method: "POST",
		path: "/api/models/:modelId/modify",
		expectedStatus: 201,
		requiredUiSignals: ["Предложения по модификации", "Применить модификацию"],
	},
	{
		id: "compare-versions",
		label: "Сравнение версий",
		method: "GET",
		path: "/api/projects/:projectId/models",
		expectedStatus: 200,
		requiredUiSignals: ["Сравнить версии", "Левая модель", "Правая модель"],
	},
];

export function buildPhotoUploadContract(index: number): PhotoUploadContract {
	return {
		fileName: `scan-frame-${index}.jpg`,
		fileSize: 512 * 1024,
		mimeType: "image/jpeg",
		base64Data: "data:image/jpeg;base64,c2Nhbi1mcmFtZQ==",
	};
}

export function buildScanServiceRequest(
	projectId: string,
	photoUrls: string[],
	outputFormat: ModelType = "gaussian-splatting",
): ScanServiceRequestContract {
	return {
		project_id: projectId,
		photo_urls: photoUrls,
		output_format: outputFormat,
	};
}

export function buildModificationServiceRequest(input: {
	jobId: string;
	projectId: string;
	modelId: string;
	modelType: ModelType;
	modificationType: ServiceModificationType;
	parameters: Record<string, unknown>;
}): ModificationServiceRequestContract {
	return {
		job_id: input.jobId,
		project_id: input.projectId,
		model_id: input.modelId,
		model_type: input.modelType,
		modification_type: input.modificationType,
		parameters: input.parameters,
		preserve_original: true,
	};
}

export function assertValidPhotoBatch(photos: PhotoUploadContract[]) {
	return (
		photos.length >= MIN_SCAN_PHOTOS &&
		photos.every(
			(photo) =>
				photo.fileName.length > 0 &&
				photo.fileSize > 0 &&
				photo.fileSize <= MAX_PHOTO_SIZE_BYTES &&
				SUPPORTED_PHOTO_MIME_TYPES.includes(photo.mimeType) &&
				photo.base64Data.startsWith("data:image/"),
		)
	);
}

export function assertScanRequestContract(request: ScanServiceRequestContract) {
	return (
		request.project_id.length > 0 &&
		request.photo_urls.length >= MIN_SCAN_PHOTOS &&
		request.photo_urls.every((url) => url.startsWith("http")) &&
		(request.output_format === "gaussian-splatting" ||
			request.output_format === "nerf")
	);
}

export function assertModificationRequestContract(
	request: ModificationServiceRequestContract,
) {
	return (
		request.job_id.length > 0 &&
		request.project_id.length > 0 &&
		request.model_id.length > 0 &&
		(request.model_type === "gaussian-splatting" ||
			request.model_type === "nerf") &&
		["recolor", "restoration", "geometry", "geometry_change"].includes(
			request.modification_type,
		) &&
		Object.keys(request.parameters).length > 0 &&
		request.preserve_original === true
	);
}

export function assertE2EHarnessContract(steps: E2EContractStep[]) {
	const ids = new Set(steps.map((step) => step.id));
	const requiredIds = [
		"create-project",
		"upload-photos",
		"start-scan",
		"view-model",
		"apply-modification",
		"compare-versions",
	];

	return (
		requiredIds.every((id) => ids.has(id)) &&
		steps.every(
			(step) =>
				step.path.startsWith("/") &&
				step.requiredUiSignals.length > 0 &&
				(Array.isArray(step.expectedStatus)
					? step.expectedStatus.every((status) => status >= 200 && status < 500)
					: step.expectedStatus >= 200 && step.expectedStatus < 500),
		)
	);
}
