export const allowedModificationTypes = [
	"recolor",
	"restoration",
	"geometry",
] as const;

export type ModificationType = (typeof allowedModificationTypes)[number];

export type ServiceModificationType =
	| "recolor"
	| "restoration"
	| "geometry_change";

export interface NormalizedModificationRequestBody {
	modificationType: ModificationType;
	parameters: Record<string, unknown>;
}

export type ModificationRequestValidationResult =
	| {
			ok: true;
			data: NormalizedModificationRequestBody;
	  }
	| {
			ok: false;
			error: string;
	  };

export function isModificationType(value: unknown): value is ModificationType {
	return (
		typeof value === "string" &&
		allowedModificationTypes.includes(value as ModificationType)
	);
}

export function normalizeModificationRequestBody(
	body: unknown,
): ModificationRequestValidationResult {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		return { ok: false, error: "Invalid modification request body" };
	}

	const requestBody = body as {
		modification_type?: unknown;
		modificationType?: unknown;
		parameters?: unknown;
	};
	const modificationType =
		requestBody.modification_type ?? requestBody.modificationType;

	if (!isModificationType(modificationType)) {
		return { ok: false, error: "Unsupported modification type" };
	}

	if (
		!requestBody.parameters ||
		typeof requestBody.parameters !== "object" ||
		Array.isArray(requestBody.parameters)
	) {
		return { ok: false, error: "Invalid modification parameters" };
	}

	return {
		ok: true,
		data: {
			modificationType,
			parameters: requestBody.parameters as Record<string, unknown>,
		},
	};
}

export function toServiceModificationType(
	type: ModificationType,
): ServiceModificationType {
	return type === "geometry" ? "geometry_change" : type;
}

export function fromServiceModificationType(type: string): ModificationType {
	return type === "geometry_change" ? "geometry" : (type as ModificationType);
}
