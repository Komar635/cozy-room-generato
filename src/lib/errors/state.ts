import { AppError, type ErrorSeverity, explainError } from "@/lib/errors";
import { logError } from "@/lib/errors/logger";

export interface CriticalStateSnapshot {
	readonly projectId?: string;
	readonly modelId?: string;
	readonly operation: "upload" | "scan" | "modify" | "unknown";
	readonly status: "draft" | "in_progress" | "failed";
	readonly payload?: unknown;
	readonly savedAt: string;
	readonly error: ReturnType<typeof explainError>;
}

export interface StateStorageAdapter {
	setItem(key: string, value: string): void | Promise<void>;
	getItem?(key: string): string | null | Promise<string | null>;
}

function isCriticalSeverity(severity: ErrorSeverity) {
	return severity === "critical" || severity === "error";
}

export function buildCriticalStateSnapshot(
	error: unknown,
	state: Omit<CriticalStateSnapshot, "savedAt" | "error">,
): CriticalStateSnapshot | null {
	const explanation = explainError(error);

	if (!isCriticalSeverity(explanation.severity)) {
		return null;
	}

	return {
		...state,
		savedAt: new Date().toISOString(),
		error: explanation,
	};
}

export async function preserveCriticalState(
	error: unknown,
	state: Omit<CriticalStateSnapshot, "savedAt" | "error">,
	storage?: StateStorageAdapter,
) {
	const snapshot = buildCriticalStateSnapshot(error, state);

	if (!snapshot) {
		return null;
	}

	const storageKey = `critical-state:${state.projectId ?? "global"}:${state.operation}`;

	try {
		await storage?.setItem(storageKey, JSON.stringify(snapshot));
	} catch (storageError) {
		logError(storageError instanceof AppError ? storageError : storageError, {
			operation: "preserveCriticalState",
			storageKey,
		});
	}

	return { storageKey, snapshot };
}
