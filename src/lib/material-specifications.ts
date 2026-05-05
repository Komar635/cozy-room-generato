import type {
	MaterialSpecificationResult,
	StyleAnalysisResult,
} from "@/lib/ai/style-analysis";

type ModificationType =
	| "recolor"
	| "restoration"
	| "geometry"
	| "geometry_change";

const materialPresets: Record<
	string,
	Array<{
		name: string;
		brand: string;
		codePrefix: string;
		finish: string;
	}>
> = {
	wood: [
		{
			name: "Hardwood oil-wax finish",
			brand: "Osmo",
			codePrefix: "WOOD-OIL",
			finish: "satin",
		},
		{
			name: "Water-based wood primer",
			brand: "Tikkurila",
			codePrefix: "WOOD-PRM",
			finish: "matte",
		},
	],
	metal: [
		{
			name: "Anti-corrosion metal primer",
			brand: "Hammerite",
			codePrefix: "MET-PRM",
			finish: "matte",
		},
		{
			name: "Direct-to-rust enamel",
			brand: "Hammerite",
			codePrefix: "MET-ENM",
			finish: "glossy",
		},
	],
	fabric: [
		{
			name: "Upholstery textile cleaner",
			brand: "Karcher",
			codePrefix: "FAB-CLN",
			finish: "textured",
		},
		{
			name: "Performance upholstery fabric",
			brand: "Kvadrat",
			codePrefix: "FAB-UPH",
			finish: "textured",
		},
	],
	glass: [
		{
			name: "Low-odor glass cleaner",
			brand: "HG",
			codePrefix: "GLS-CLN",
			finish: "glossy",
		},
	],
	plastic: [
		{
			name: "Plastic adhesion primer",
			brand: "Motip",
			codePrefix: "PLS-PRM",
			finish: "matte",
		},
	],
	ceramic: [
		{
			name: "Ceramic repair compound",
			brand: "Cramer",
			codePrefix: "CER-RPR",
			finish: "glossy",
		},
	],
	stone: [
		{
			name: "Natural stone sealer",
			brand: "Lithofin",
			codePrefix: "STN-SEL",
			finish: "natural",
		},
	],
};

function getFinish(parameters: Record<string, unknown>) {
	return typeof parameters.finish === "string" ? parameters.finish : undefined;
}

function getTargetColor(parameters: Record<string, unknown>) {
	const colorMap = parameters.color_map;
	if (!colorMap || typeof colorMap !== "object") {
		return undefined;
	}

	return Object.values(colorMap as Record<string, unknown>).find(
		(value): value is string => typeof value === "string" && value.length > 0,
	);
}

export function buildFallbackMaterialSpec(
	analysis: StyleAnalysisResult,
	modificationType: ModificationType,
	parameters: Record<string, unknown> = {},
): MaterialSpecificationResult {
	const materialTypes = [
		...new Set(analysis.materials.map((material) => material.type)),
	];
	const targetTypes = materialTypes.length > 0 ? materialTypes : ["wood"];
	const targetColor = getTargetColor(parameters);
	const preferredFinish = getFinish(parameters);
	const materials = targetTypes.flatMap((type, typeIndex) => {
		const presets = materialPresets[type] ?? materialPresets.wood;

		return presets
			.slice(0, modificationType === "restoration" ? 2 : 1)
			.map((preset, presetIndex) => ({
				name:
					targetColor && modificationType === "recolor"
						? `${preset.name} ${targetColor}`
						: preset.name,
				brand: preset.brand,
				code: `${preset.codePrefix}-${String(typeIndex + 1).padStart(2, "0")}${presetIndex + 1}`,
				quantity: type === "fabric" ? "1.5 linear m" : "0.75 l",
				applicationArea:
					analysis.materials.find((material) => material.type === type)?.name ??
					type,
				finish: preferredFinish ?? preset.finish,
				notes: `Подходит для ${analysis.styleTags.slice(0, 2).join(", ") || "выбранного стиля"}`,
			}));
	});

	return {
		materials: materials.slice(0, 6),
		instructions: [
			"Очистить поверхность от пыли и старых непрочных покрытий.",
			"Проверить совместимость материала на незаметном участке.",
			"Нанести материалы тонкими слоями с промежуточной сушкой.",
			"Выдержать изделие до полной полимеризации перед эксплуатацией.",
		].join(" "),
		estimatedCoverage:
			"Достаточно для локальной модификации объекта среднего размера",
		safetyNotes: [
			"Работать в проветриваемом помещении.",
			"Использовать перчатки, защитные очки и респиратор при шлифовании.",
		],
	};
}
