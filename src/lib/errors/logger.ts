import { type ErrorExplanation, explainError } from "@/lib/errors";

export interface ErrorLogEntry {
	readonly explanation: ErrorExplanation;
	readonly context?: Record<string, unknown>;
	readonly timestamp: string;
}

type SentryLike = {
	captureException?: (error: unknown, context?: unknown) => void;
	captureMessage?: (message: string, context?: unknown) => void;
};

function getOptionalSentry(): SentryLike | null {
	const maybeGlobal = globalThis as typeof globalThis & {
		Sentry?: SentryLike;
		__SENTRY__?: SentryLike;
	};

	return maybeGlobal.Sentry ?? maybeGlobal.__SENTRY__ ?? null;
}

export function buildErrorLogEntry(
	error: unknown,
	context?: Record<string, unknown>,
): ErrorLogEntry {
	return {
		explanation: explainError(error),
		context,
		timestamp: new Date().toISOString(),
	};
}

export function logError(error: unknown, context?: Record<string, unknown>) {
	const entry = buildErrorLogEntry(error, context);
	const sentry = getOptionalSentry();

	if (sentry?.captureException) {
		sentry.captureException(error, { extra: entry });
	} else if (sentry?.captureMessage) {
		sentry.captureMessage(entry.explanation.message, { extra: entry });
	}

	if (entry.explanation.severity === "critical") {
		console.error("[critical]", entry);
		return entry;
	}

	if (entry.explanation.severity === "warning") {
		console.warn("[warning]", entry);
		return entry;
	}

	console.error("[error]", entry);
	return entry;
}
