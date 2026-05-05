"use client";

import { useCallback, useEffect, useState } from "react";

export interface ProcessingJob {
	id: string;
	job_type: "scan" | "modify";
	project_id: string;
	status: "pending" | "processing" | "completed" | "failed";
	progress: number;
	error_message?: string;
	started_at?: string;
	completed_at?: string;
	created_at: string;
	elapsed_time?: number;
	estimated_time_remaining?: number;
}

type ProcessingJobType = "scan" | "modify";

function getStatusEndpoint(projectId: string, jobType: ProcessingJobType) {
	if (jobType === "modify") {
		return `/api/projects/${projectId}/modify/status`;
	}

	return `/api/projects/${projectId}/scan/status`;
}

export function useProcessingJobStatus(
	projectId: string | null,
	jobType: ProcessingJobType = "scan",
) {
	const [job, setJob] = useState<ProcessingJob | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCurrentJob = useCallback(
		async (suppressLoading = false) => {
			if (!projectId) {
				setJob(null);
				setError(null);
				setLoading(false);
				return;
			}

			if (!suppressLoading) {
				setLoading(true);
			}

			try {
				const response = await fetch(getStatusEndpoint(projectId, jobType), {
					cache: "no-store",
				});

				if (response.status === 404) {
					setJob(null);
					setError(null);
					setLoading(false);
					return;
				}

				if (!response.ok) {
					const payload = await response.json().catch(() => null);
					throw new Error(payload?.error || "Failed to fetch processing job");
				}

				const data = await response.json();

				setJob({
					id: data.jobId,
					job_type: jobType,
					project_id: projectId,
					status: data.status,
					progress: data.progress,
					error_message: data.errorMessage ?? undefined,
					started_at: data.startedAt ?? undefined,
					completed_at: data.completedAt ?? undefined,
					created_at:
						data.createdAt ?? data.startedAt ?? new Date().toISOString(),
					elapsed_time:
						typeof data.elapsedTime === "number" ? data.elapsedTime : undefined,
					estimated_time_remaining:
						typeof data.estimatedTimeRemaining === "number"
							? data.estimatedTimeRemaining
							: undefined,
				});
				setError(null);
			} catch (err) {
				console.error("Error fetching job:", err);
				setError(
					err instanceof Error ? err.message : "Failed to fetch processing job",
				);
			} finally {
				setLoading(false);
			}
		},
		[jobType, projectId],
	);

	useEffect(() => {
		if (!projectId) {
			setJob(null);
			setError(null);
			setLoading(false);
			return;
		}

		fetchCurrentJob();

		const interval = window.setInterval(() => {
			fetchCurrentJob(true);
		}, 3000);

		return () => {
			window.clearInterval(interval);
		};
	}, [fetchCurrentJob, projectId]);

	return {
		job,
		loading,
		error,
		refresh: () => fetchCurrentJob(true),
	};
}
