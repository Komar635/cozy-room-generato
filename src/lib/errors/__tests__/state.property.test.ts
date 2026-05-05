import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import { createAppError } from "@/lib/errors";
import {
	buildCriticalStateSnapshot,
	preserveCriticalState,
} from "@/lib/errors/state";

describe("Feature: reality-digitizer-3d, Property 14: Сохранение состояния при критических ошибках", () => {
	it("creates snapshots only for error and critical severities", () => {
		fc.assert(
			fc.property(
				fc.uuid(),
				fc.constantFrom("upload", "scan", "modify"),
				(projectId, operation) => {
					const critical = createAppError(
						"network",
						"SERVICE_UNAVAILABLE",
						"service down",
					);
					const warning = createAppError(
						"photo_upload",
						"INVALID_PARAMETERS",
						"bad input",
					);

					const criticalSnapshot = buildCriticalStateSnapshot(critical, {
						projectId,
						operation,
						status: "failed",
					});
					const warningSnapshot = buildCriticalStateSnapshot(warning, {
						projectId,
						operation,
						status: "failed",
					});

					expect(criticalSnapshot?.projectId).toBe(projectId);
					expect(criticalSnapshot?.operation).toBe(operation);
					expect(criticalSnapshot?.error.code).toBe("SERVICE_UNAVAILABLE");
					expect(warningSnapshot).toBeNull();
				},
			),
			{ numRuns: 100 },
		);
	});

	it("persists critical snapshots into provided storage adapter", async () => {
		await fc.assert(
			fc.asyncProperty(
				fc.uuid(),
				fc.constantFrom("upload", "scan", "modify"),
				async (projectId, operation) => {
					const saved = new Map<string, string>();
					const result = await preserveCriticalState(
						createAppError("network", "SERVICE_UNAVAILABLE", "service down"),
						{
							projectId,
							operation,
							status: "failed",
							payload: { checkpoint: projectId },
						},
						{
							setItem: (key, value) => {
								saved.set(key, value);
							},
						},
					);

					expect(result).not.toBeNull();
					if (!result) {
						throw new Error("Expected critical state snapshot to be persisted");
					}

					const persisted = saved.get(result.storageKey);
					expect(persisted).toBeDefined();
					if (!persisted) {
						throw new Error("Expected persisted snapshot payload");
					}
					expect(JSON.parse(persisted).projectId).toBe(projectId);
				},
			),
			{ numRuns: 50 },
		);
	});
});
