export type ErrorDomain =
	| "photo_upload"
	| "scanning"
	| "modification"
	| "network";

export type ErrorSeverity = "info" | "warning" | "error" | "critical";

export type AppErrorCode =
	| "INVALID_PARAMETERS"
	| "INVALID_FORMAT"
	| "FILE_TOO_LARGE"
	| "INSUFFICIENT_PHOTOS"
	| "UPLOAD_FAILED"
	| "SCAN_FAILED"
	| "MODIFICATION_FAILED"
	| "NETWORK_ERROR"
	| "SERVICE_UNAVAILABLE"
	| "TIMEOUT"
	| "UNAUTHORIZED"
	| "FORBIDDEN"
	| "NOT_FOUND"
	| "UNKNOWN_ERROR";

export interface AppErrorDetails {
	readonly field?: string;
	readonly cause?: unknown;
	readonly context?: Record<string, unknown>;
}

export interface ErrorExplanation {
	readonly code: AppErrorCode;
	readonly type: ErrorDomain;
	readonly message: string;
	readonly userMessage: string;
	readonly recommendations: readonly string[];
	readonly retryable: boolean;
	readonly severity: ErrorSeverity;
}

export class AppError extends Error {
	readonly code: AppErrorCode;
	readonly type: ErrorDomain;
	readonly userMessage: string;
	readonly recommendations: readonly string[];
	readonly retryable: boolean;
	readonly severity: ErrorSeverity;
	readonly details?: AppErrorDetails;

	constructor(explanation: ErrorExplanation, details?: AppErrorDetails) {
		super(explanation.message);
		this.name = new.target.name;
		this.code = explanation.code;
		this.type = explanation.type;
		this.userMessage = explanation.userMessage;
		this.recommendations = explanation.recommendations;
		this.retryable = explanation.retryable;
		this.severity = explanation.severity;
		this.details = details;
	}

	toJSON() {
		return explainError(this);
	}
}

export class PhotoUploadError extends AppError {}

export class ScanningError extends AppError {}

export class ModificationError extends AppError {}

export class NetworkError extends AppError {}

const explanations = {
	INVALID_PARAMETERS: {
		userMessage: "Проверьте параметры запроса и повторите действие.",
		recommendations: [
			"Убедитесь, что все обязательные поля заполнены",
			"Обновите страницу, если форма выглядит некорректно",
		],
		retryable: false,
		severity: "warning",
	},
	INVALID_FORMAT: {
		userMessage: "Формат файла не поддерживается.",
		recommendations: [
			"Используйте JPEG, PNG или WebP",
			"Конвертируйте изображение и загрузите его повторно",
		],
		retryable: false,
		severity: "warning",
	},
	FILE_TOO_LARGE: {
		userMessage: "Файл превышает допустимый размер.",
		recommendations: [
			"Сожмите изображение до 10 МБ или меньше",
			"Уменьшите разрешение изображения",
		],
		retryable: false,
		severity: "warning",
	},
	INSUFFICIENT_PHOTOS: {
		userMessage: "Для сканирования нужно минимум 10 фотографий.",
		recommendations: [
			"Добавьте фотографии объекта с разных ракурсов",
			"Проверьте освещение и четкость снимков",
		],
		retryable: false,
		severity: "warning",
	},
	UPLOAD_FAILED: {
		userMessage: "Не удалось загрузить фотографии.",
		recommendations: [
			"Проверьте интернет-соединение",
			"Попробуйте загрузить меньше фотографий за раз",
		],
		retryable: true,
		severity: "error",
	},
	SCAN_FAILED: {
		userMessage: "Не удалось запустить или завершить сканирование.",
		recommendations: [
			"Проверьте качество и количество фотографий",
			"Повторите сканирование через несколько минут",
		],
		retryable: true,
		severity: "error",
	},
	MODIFICATION_FAILED: {
		userMessage: "Не удалось применить модификацию модели.",
		recommendations: [
			"Проверьте параметры модификации",
			"Повторите действие или выберите другое предложение",
		],
		retryable: true,
		severity: "error",
	},
	NETWORK_ERROR: {
		userMessage: "Сетевое соединение временно недоступно.",
		recommendations: [
			"Проверьте подключение к интернету",
			"Повторите действие после восстановления соединения",
		],
		retryable: true,
		severity: "error",
	},
	SERVICE_UNAVAILABLE: {
		userMessage: "Сервис обработки временно недоступен.",
		recommendations: [
			"Повторите действие через несколько минут",
			"Если ошибка повторяется, сохраните проект и вернитесь позже",
		],
		retryable: true,
		severity: "critical",
	},
	TIMEOUT: {
		userMessage: "Операция заняла слишком много времени.",
		recommendations: [
			"Повторите действие",
			"Проверьте стабильность сети и размер входных данных",
		],
		retryable: true,
		severity: "error",
	},
	UNAUTHORIZED: {
		userMessage: "Для выполнения действия нужно войти в аккаунт.",
		recommendations: ["Войдите в аккаунт и повторите действие"],
		retryable: false,
		severity: "warning",
	},
	FORBIDDEN: {
		userMessage: "У вас нет доступа к этому ресурсу.",
		recommendations: ["Проверьте, что открыт ваш проект"],
		retryable: false,
		severity: "warning",
	},
	NOT_FOUND: {
		userMessage: "Запрошенный ресурс не найден.",
		recommendations: ["Обновите список проектов и повторите действие"],
		retryable: false,
		severity: "warning",
	},
	UNKNOWN_ERROR: {
		userMessage: "Произошла непредвиденная ошибка.",
		recommendations: [
			"Повторите действие",
			"Если ошибка повторяется, сохраните проект и обратитесь в поддержку",
		],
		retryable: false,
		severity: "critical",
	},
} as const satisfies Record<
	AppErrorCode,
	{
		userMessage: string;
		recommendations: readonly string[];
		retryable: boolean;
		severity: ErrorSeverity;
	}
>;

const errorClassByDomain = {
	photo_upload: PhotoUploadError,
	scanning: ScanningError,
	modification: ModificationError,
	network: NetworkError,
} as const;

export function createAppError(
	type: ErrorDomain,
	code: AppErrorCode,
	message?: string,
	details?: AppErrorDetails,
) {
	const explanation = explanations[code] ?? explanations.UNKNOWN_ERROR;
	const ErrorClass = errorClassByDomain[type];

	return new ErrorClass(
		{
			code,
			type,
			message: message || explanation.userMessage,
			userMessage: explanation.userMessage,
			recommendations: explanation.recommendations,
			retryable: explanation.retryable,
			severity: explanation.severity,
		},
		details,
	);
}

export function explainError(error: unknown): ErrorExplanation {
	if (error instanceof AppError) {
		return {
			code: error.code,
			type: error.type,
			message: error.message,
			userMessage: error.userMessage,
			recommendations: error.recommendations,
			retryable: error.retryable,
			severity: error.severity,
		};
	}

	const message = error instanceof Error ? error.message : String(error || "");
	return {
		code: "UNKNOWN_ERROR",
		type: "network",
		message: message || explanations.UNKNOWN_ERROR.userMessage,
		userMessage: explanations.UNKNOWN_ERROR.userMessage,
		recommendations: explanations.UNKNOWN_ERROR.recommendations,
		retryable: false,
		severity: explanations.UNKNOWN_ERROR.severity,
	};
}

export function errorResponse(error: unknown) {
	const explanation = explainError(error);

	return {
		error: explanation.code,
		message: explanation.userMessage,
		details: explanation.message,
		recommendations: explanation.recommendations,
		retryable: explanation.retryable,
	};
}

export interface RetryOptions {
	readonly attempts?: number;
	readonly delayMs?: number;
	readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const wait = (delayMs: number) =>
	new Promise((resolve) => setTimeout(resolve, delayMs));

export async function withRetry<T>(
	operation: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const attempts = Math.max(1, options.attempts ?? 3);
	const delayMs = Math.max(0, options.delayMs ?? 150);
	let lastError: unknown;

	for (let attempt = 1; attempt <= attempts; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
			const retryable = options.shouldRetry
				? options.shouldRetry(error, attempt)
				: error instanceof AppError && error.retryable;

			if (!retryable || attempt >= attempts) {
				throw error;
			}

			await wait(delayMs * attempt);
		}
	}

	throw lastError;
}

export function requireNonEmptyString(
	value: unknown,
	field: string,
	type: ErrorDomain,
) {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw createAppError(type, "INVALID_PARAMETERS", `${field} is required`, {
			field,
		});
	}

	return value;
}

export function statusToErrorCode(status: number): AppErrorCode {
	if (status === 401) {
		return "UNAUTHORIZED";
	}

	if (status === 403) {
		return "FORBIDDEN";
	}

	if (status === 404) {
		return "NOT_FOUND";
	}

	if (status === 408 || status === 504) {
		return "TIMEOUT";
	}

	if (status === 429 || status >= 500) {
		return "SERVICE_UNAVAILABLE";
	}

	return "INVALID_PARAMETERS";
}
