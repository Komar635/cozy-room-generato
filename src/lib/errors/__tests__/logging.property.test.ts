import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import {
	type AppErrorCode,
	createAppError,
	type ErrorDomain,
} from "@/lib/errors";
import { buildErrorLogEntry } from "@/lib/errors/logger";

const domains = fc.constantFrom<ErrorDomain>(
	"photo_upload",
	"scanning",
	"modification",
	"network",
);

const codes = fc.constantFrom<AppErrorCode>(
	"UPLOAD_FAILED",
	"SCAN_FAILED",
	"MODIFICATION_FAILED",
	"NETWORK_ERROR",
	"SERVICE_UNAVAILABLE",
);

describe("Feature: reality-digitizer-3d, Property 13: Логирование всех ошибок", () => {
	it("normalizes every logged error with timestamp and context", () => {
		fc.assert(
			fc.property(
				domains,
				codes,
				fc.dictionary(
					fc.string({ minLength: 1, maxLength: 20 }),
					fc.string({ maxLength: 50 }),
				),
				(domain, code, context) => {
					const error = createAppError(domain, code, `${domain}:${code}`);
					const entry = buildErrorLogEntry(error, context);

					expect(entry.explanation.type).toBe(domain);
					expect(entry.explanation.code).toBe(code);
					expect(entry.context).toEqual(context);
					expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
					expect(entry.explanation.recommendations.length).toBeGreaterThan(0);
				},
			),
			{ numRuns: 100 },
		);
	});
});
