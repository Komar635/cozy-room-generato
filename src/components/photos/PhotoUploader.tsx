"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import {
	createAppError,
	type ErrorExplanation,
	explainError,
} from "@/lib/errors";
import { logError } from "@/lib/errors/logger";
import { preserveCriticalState } from "@/lib/errors/state";
import type { Photo } from "@/types/database";

// Константы валидации
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MIN_PHOTOS = 10;

interface PhotoUploaderProps {
	projectId: string;
	onUploadComplete: (photos: Photo[]) => void;
	onError: (error: PhotoUploadError) => void;
}

export type PhotoUploadError = ErrorExplanation;

interface PhotoPreview {
	file: File;
	preview: string;
	id: string;
}

export function PhotoUploader({
	projectId,
	onUploadComplete,
	onError,
}: PhotoUploaderProps) {
	const [photos, setPhotos] = useState<PhotoPreview[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Валидация файла
	const validateFile = useCallback(
		(file: File): { valid: boolean; error?: PhotoUploadError } => {
			// Проверка формата
			if (!ALLOWED_FORMATS.includes(file.type)) {
				return {
					valid: false,
					error: explainError(
						createAppError(
							"photo_upload",
							"INVALID_FORMAT",
							`Файл "${file.name}" имеет неподдерживаемый формат`,
						),
					),
				};
			}

			// Проверка размера
			if (file.size > MAX_FILE_SIZE) {
				return {
					valid: false,
					error: explainError(
						createAppError(
							"photo_upload",
							"FILE_TOO_LARGE",
							`Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(2)} МБ)`,
						),
					),
				};
			}

			return { valid: true };
		},
		[],
	);

	const clearSelectedPhotos = useCallback(() => {
		for (const photo of photos) {
			URL.revokeObjectURL(photo.preview);
		}
		setPhotos([]);
	}, [photos]);

	// Обработка выбора файлов
	const handleFiles = useCallback(
		(files: FileList | null) => {
			if (!files || files.length === 0) return;

			const newPhotos: PhotoPreview[] = [];
			const errors: PhotoUploadError[] = [];

			Array.from(files).forEach((file) => {
				const validation = validateFile(file);

				if (!validation.valid && validation.error) {
					errors.push(validation.error);
					return;
				}

				// Создание превью
				const preview = URL.createObjectURL(file);
				const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

				newPhotos.push({ file, preview, id });
			});

			if (errors.length > 0) {
				onError(errors[0]); // Показываем первую ошибку
			}

			if (newPhotos.length > 0) {
				setPhotos((prev) => [...prev, ...newPhotos]);
			}
		},
		[onError, validateFile],
	);

	// Drag & Drop обработчики
	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const files = e.dataTransfer.files;
			handleFiles(files);
		},
		[handleFiles],
	);

	// Обработка клика на input
	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			handleFiles(e.target.files);
		},
		[handleFiles],
	);

	// Удаление фото из списка
	const removePhoto = useCallback((id: string) => {
		setPhotos((prev) => {
			const photo = prev.find((p) => p.id === id);
			if (photo) {
				URL.revokeObjectURL(photo.preview);
			}
			return prev.filter((p) => p.id !== id);
		});
	}, []);

	// Конвертация файла в base64
	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = (error) => reject(error);
		});
	};

	// Загрузка фотографий на сервер
	const handleUpload = async () => {
		if (photos.length < MIN_PHOTOS) {
			onError(
				explainError(
					createAppError(
						"photo_upload",
						"INSUFFICIENT_PHOTOS",
						`Необходимо загрузить минимум ${MIN_PHOTOS} фотографий`,
						{ context: { missingPhotos: MIN_PHOTOS - photos.length } },
					),
				) as PhotoUploadError,
			);
			return;
		}

		setIsUploading(true);
		setUploadProgress(0);

		try {
			// Конвертация всех файлов в base64
			const photosData = await Promise.all(
				photos.map(async (photo, index) => {
					const base64Data = await fileToBase64(photo.file);
					setUploadProgress(Math.round(((index + 1) / photos.length) * 50)); // 0-50% для конвертации

					return {
						fileName: photo.file.name,
						fileSize: photo.file.size,
						mimeType: photo.file.type,
						base64Data,
					};
				}),
			);

			// Отправка на сервер
			const response = await fetch(`/api/projects/${projectId}/photos`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ photos: photosData }),
			});

			setUploadProgress(100);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw createAppError(
					response.status >= 500 ? "network" : "photo_upload",
					response.status >= 500 ? "NETWORK_ERROR" : "UPLOAD_FAILED",
					errorData?.message || errorData?.error || "Ошибка загрузки",
					{ context: { status: response.status } },
				);
			}

			const result = await response.json();

			// Очистка превью
			clearSelectedPhotos();

			onUploadComplete(result.photos);
		} catch (error) {
			logError(error, { component: "PhotoUploader", projectId });
			const uploadError =
				error instanceof Error
					? error
					: createAppError(
							"photo_upload",
							"UPLOAD_FAILED",
							"Не удалось загрузить фотографии",
						);
			await preserveCriticalState(
				uploadError,
				{
					projectId,
					operation: "upload",
					status: "failed",
					payload: { queuedPhotos: photos.length },
				},
				typeof window !== "undefined" ? window.localStorage : undefined,
			);
			onError(explainError(uploadError) as PhotoUploadError);
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const openFileDialog = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleDropZoneKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLButtonElement>) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				openFileDialog();
			}
		},
		[openFileDialog],
	);

	return (
		<div className="w-full space-y-4">
			{/* Drag & Drop зона */}
			<button
				type="button"
				className={`
          relative w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
        `}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={openFileDialog}
				onKeyDown={handleDropZoneKeyDown}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					accept={ALLOWED_FORMATS.join(",")}
					onChange={handleFileInputChange}
					className="hidden"
					disabled={isUploading}
				/>

				<div className="space-y-2">
					<svg
						className="mx-auto h-12 w-12 text-gray-400"
						stroke="currentColor"
						fill="none"
						viewBox="0 0 48 48"
						aria-hidden="true"
					>
						<path
							d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
							strokeWidth={2}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<div className="text-sm text-gray-600">
						<span className="font-semibold text-blue-600">
							Нажмите для выбора
						</span>{" "}
						или перетащите файлы сюда
					</div>
					<p className="text-xs text-gray-500">
						JPEG, PNG, WebP до {MAX_FILE_SIZE / 1024 / 1024} МБ (минимум{" "}
						{MIN_PHOTOS} фотографий)
					</p>
				</div>
			</button>

			{/* Превью загруженных фотографий */}
			{photos.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-medium text-gray-700">
							Выбрано фотографий: {photos.length}{" "}
							{photos.length < MIN_PHOTOS && `(минимум ${MIN_PHOTOS})`}
						</h3>
						<button
							type="button"
							onClick={clearSelectedPhotos}
							className="text-sm text-red-600 hover:text-red-700"
							disabled={isUploading}
						>
							Очистить все
						</button>
					</div>

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
						{photos.map((photo) => (
							<div key={photo.id} className="relative group">
								<Image
									src={photo.preview}
									alt={photo.file.name}
									width={240}
									height={128}
									unoptimized
									className="w-full h-32 object-cover rounded-lg"
								/>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										removePhoto(photo.id);
									}}
									className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
									disabled={isUploading}
								>
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
								<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
									{photo.file.name}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Индикатор прогресса */}
			{isUploading && (
				<div className="space-y-2">
					<div className="flex items-center justify-between text-sm text-gray-600">
						<span>Загрузка фотографий...</span>
						<span>{uploadProgress}%</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
				</div>
			)}

			{/* Кнопка загрузки */}
			<button
				type="button"
				onClick={handleUpload}
				disabled={photos.length < MIN_PHOTOS || isUploading}
				className={`
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          ${
						photos.length >= MIN_PHOTOS && !isUploading
							? "bg-blue-600 text-white hover:bg-blue-700"
							: "bg-gray-300 text-gray-500 cursor-not-allowed"
					}
        `}
			>
				{isUploading
					? "Загрузка..."
					: `Загрузить фотографии (${photos.length}/${MIN_PHOTOS})`}
			</button>
		</div>
	);
}
