import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import {
	type AppErrorCode,
	createAppError,
	type ErrorDomain,
	explainError,
	withRetry,
} from "@/lib/errors";

const domains = fc.constantFrom<ErrorDomain>(
	"photo_upload",
	"scanning",
	"modification",
	"network",
);

const codes = fc.constantFrom<AppErrorCode>(
	"INVALID_PARAMETERS",
	"INVALID_FORMAT",
	"FILE_TOO_LARGE",
	"INSUFFICIENT_PHOTOS",
	"UPLOAD_FAILED",
	"SCAN_FAILED",
	"MODIFICATION_FAILED",
	"NETWORK_ERROR",
	"SERVICE_UNAVAILABLE",
	"TIMEOUT",
	"UNAUTHORIZED",
	"FORBIDDEN",
	"NOT_FOUND",
	"UNKNOWN_ERROR",
);

describe("Feature: reality-digitizer-3d, Property 12: Обработка ошибок с объяснениями", () => {
	it("returns stable explanations with recommendations for every centralized error", () => {
		fc.assert(
			fc.property(
				domains,
				codes,
				fc.string({ minLength: 1, maxLength: 120 }),
				(domain, code, message) => {
					const error = createAppError(domain, code, message);
					const explanation = explainError(error);

					expect(explanation.type).toBe(domain);
					expect(explanation.code).toBe(code);
					expect(explanation.message).toBe(message);
					expect(explanation.userMessage.length).toBeGreaterThan(0);
					expect(explanation.recommendations.length).toBeGreaterThan(0);
					expect(typeof explanation.retryable).toBe("boolean");
					expect(["info", "warning", "error", "critical"]).toContain(
						explanation.severity,
					);
				},
			),
			{ numRuns: 100 },
		);
	});

	it("retries only retryable temporary errors", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.integer({ min: 1, max: 3 }),
				async (failuresBeforeSuccess) => {
					let attempts = 0;
					const result = await withRetry(
						async () => {
							attempts += 1;
							if (attempts <= failuresBeforeSuccess) {
								throw createAppError(
									"network",
									"NETWORK_ERROR",
									"temporary network error",
								);
							}

							return "ok";
						},
						{ attempts: failuresBeforeSuccess + 1, delayMs: 0 },
					);

					expect(result).toBe("ok");
					expect(attempts).toBe(failuresBeforeSuccess + 1);
				},
			),
			{ numRuns: 20 },
		);
	});
});
