import type {
	Model3D,
	Modification,
	Photo,
	ProcessingJob,
	Project,
} from "@prisma/client";

export function serializeProject(project: Project) {
	return {
		id: project.id,
		user_id: project.userId,
		name: project.name,
		description: project.description,
		thumbnail_url: project.thumbnailUrl,
		status: project.status,
		created_at: project.createdAt.toISOString(),
		updated_at: project.updatedAt.toISOString(),
	};
}

export function serializePhoto(photo: Photo) {
	return {
		id: photo.id,
		project_id: photo.projectId,
		storage_path: photo.storagePath,
		url: photo.url,
		size_bytes: photo.sizeBytes,
		uploaded_at: photo.uploadedAt.toISOString(),
	};
}

export function serializeModel3D(model: Model3D) {
	return {
		id: model.id,
		project_id: model.projectId,
		parent_model_id: model.parentModelId,
		model_type: model.modelType,
		storage_path: model.storagePath,
		url: model.url,
		is_original: model.isOriginal,
		processing_job_id: model.processingJobId,
		created_at: model.createdAt.toISOString(),
	};
}

export function serializeModification(modification: Modification) {
	return {
		id: modification.id,
		original_model_id: modification.originalModelId,
		modified_model_id: modification.modifiedModelId,
		modification_type: modification.modificationType,
		parameters: modification.parameters,
		status: modification.status,
		processing_job_id: modification.processingJobId,
		created_at: modification.createdAt.toISOString(),
		completed_at: modification.completedAt?.toISOString() ?? null,
	};
}

export function serializeProcessingJob(job: ProcessingJob) {
	return {
		id: job.id,
		job_type: job.jobType,
		project_id: job.projectId,
		status: job.status,
		progress: job.progress,
		error_message: job.errorMessage,
		started_at: job.startedAt?.toISOString() ?? null,
		completed_at: job.completedAt?.toISOString() ?? null,
		created_at: job.createdAt.toISOString(),
	};
}
