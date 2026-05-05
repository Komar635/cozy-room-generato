import { describe, expect, it } from "bun:test";
import {
	assertE2EHarnessContract,
	e2eContractHarness,
	MIN_SCAN_PHOTOS,
} from "@/lib/testing/scan-modify-contracts";

describe("Task 19.2: browserless E2E contract harness", () => {
	it("documents all required user scenarios without Playwright browser runtime", () => {
		expect(assertE2EHarnessContract(e2eContractHarness)).toBe(true);
		expect(e2eContractHarness.map((step) => step.id)).toEqual([
			"create-project",
			"upload-photos",
			"start-scan",
			"view-model",
			"apply-modification",
			"compare-versions",
		]);
	});

	it("keeps scan and visualization flow ordered around stable API contracts", () => {
		const uploadStep = e2eContractHarness.find(
			(step) => step.id === "upload-photos",
		);
		const scanStep = e2eContractHarness.find(
			(step) => step.id === "start-scan",
		);
		const modelStep = e2eContractHarness.find(
			(step) => step.id === "view-model",
		);

		expect(uploadStep?.method).toBe("POST");
		expect(uploadStep?.path).toBe("/api/projects/:projectId/photos");
		expect(scanStep?.method).toBe("POST");
		expect(scanStep?.path).toBe("/api/projects/:projectId/scan");
		expect(modelStep?.method).toBe("GET");
		expect(modelStep?.requiredUiSignals).toContain("3D-модель проекта");
		expect(MIN_SCAN_PHOTOS).toBe(10);
	});

	it("keeps modification and comparison flow discoverable by UI text contracts", () => {
		const modifyStep = e2eContractHarness.find(
			(step) => step.id === "apply-modification",
		);
		const compareStep = e2eContractHarness.find(
			(step) => step.id === "compare-versions",
		);

		expect(modifyStep?.path).toBe("/api/models/:modelId/modify");
		expect(modifyStep?.expectedStatus).toBe(201);
		expect(modifyStep?.requiredUiSignals).toContain("Применить модификацию");
		expect(compareStep?.requiredUiSignals).toEqual([
			"Сравнить версии",
			"Левая модель",
			"Правая модель",
		]);
	});
});
