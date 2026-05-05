import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import { buildFallbackMaterialSpec } from "@/lib/material-specifications";

const hexColorArbitrary = fc
	.tuple(
		...Array.from({ length: 6 }, () =>
			fc.constantFrom(
				"0",
				"1",
				"2",
				"3",
				"4",
				"5",
				"6",
				"7",
				"8",
				"9",
				"A",
				"B",
				"C",
				"D",
				"E",
				"F",
			),
		),
	)
	.map((value) => `#${value.join("")}`);

const styleAnalysisArbitrary = fc.record({
	styleDescription: fc
		.string({ minLength: 20, maxLength: 240 })
		.filter((value) => value.trim().length >= 20),
	dominantColors: fc.array(
		fc.record({
			hex: hexColorArbitrary,
			name: fc
				.string({ minLength: 3, maxLength: 24 })
				.filter((value) => value.trim().length >= 3),
			percentage: fc.float({ min: 0, max: 100, noNaN: true }),
		}),
		{ minLength: 1, maxLength: 5 },
	),
	materials: fc.array(
		fc.record({
			name: fc
				.string({ minLength: 3, maxLength: 32 })
				.filter((value) => value.trim().length >= 3),
			type: fc.constantFrom(
				"wood",
				"metal",
				"fabric",
				"glass",
				"plastic",
				"ceramic",
				"stone",
			),
			confidence: fc.float({ min: 0, max: 1, noNaN: true }),
		}),
		{ minLength: 1, maxLength: 5 },
	),
	styleTags: fc.array(
		fc
			.string({ minLength: 3, maxLength: 24 })
			.filter((value) => value.trim().length >= 3),
		{
			minLength: 1,
			maxLength: 8,
		},
	),
});

describe("Feature: reality-digitizer-3d, Property 8: Генерация спецификации материалов с конкретными названиями", () => {
	it("returns concrete materials with brand, code, quantity and application instructions", () => {
		fc.assert(
			fc.property(
				styleAnalysisArbitrary,
				fc.constantFrom("recolor", "restoration", "geometry"),
				fc.record({
					finish: fc.option(fc.constantFrom("matte", "satin", "glossy"), {
						nil: undefined,
					}),
					color_map: fc.option(
						fc.dictionary(hexColorArbitrary, hexColorArbitrary),
						{ nil: undefined },
					),
				}),
				(analysis, modificationType, parameters) => {
					const spec = buildFallbackMaterialSpec(
						analysis,
						modificationType,
						parameters,
					);

					expect(spec.materials.length).toBeGreaterThan(0);
					expect(spec.materials.length).toBeLessThanOrEqual(6);
					expect(spec.instructions.length).toBeGreaterThan(20);

					for (const material of spec.materials) {
						expect(material.name.trim().length).toBeGreaterThan(3);
						expect(material.brand.trim().length).toBeGreaterThan(1);
						expect(material.code).toMatch(/^[A-Z]{3,4}-[A-Z]{3}-\d{3}$/);
						expect(material.quantity.trim().length).toBeGreaterThan(2);
						expect(material.applicationArea.trim().length).toBeGreaterThan(0);
					}
				},
			),
			{ numRuns: 100 },
		);
	});
});
