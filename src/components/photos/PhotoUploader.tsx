'use client';

import { useState, useCallback, useRef } from 'react';
import { Photo } from '@/types/database';

// Константы валидации
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ
const ALLOWED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MIN_PHOTOS = 10;

interface PhotoUploaderProps {
  projectId: string;
  onUploadComplete: (photos: Photo[]) => void;
  onError: (error: PhotoUploadError) => void;
}

export interface PhotoUploadError {
  type: 'invalid_format' | 'file_too_large' | 'insufficient_photos' | 'network_error' | 'upload_failed';
  message: string;
  recommendations?: string[];
}

interface PhotoPreview {
  file: File;
  preview: string;
  id: string;
}

export function PhotoUploader({ projectId, onUploadComplete, onError }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Валидация файла
  const validateFile = (file: File): { valid: boolean; error?: PhotoUploadError } => {
    // Проверка формата
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: {
          type: 'invalid_format',
          message: `Файл "${file.name}" имеет неподдерживаемый формат`,
          recommendations: [
            'Используйте форматы: JPEG, PNG или WebP',
            'Конвертируйте изображение в поддерживаемый формат'
          ]
        }
      };
    }

    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: {
          type: 'file_too_large',
          message: `Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(2)} МБ)`,
          recommendations: [
            `Максимальный размер файла: ${MAX_FILE_SIZE / 1024 / 1024} МБ`,
            'Сожмите изображение или уменьшите его разрешение'
          ]
        }
      };
    }

    return { valid: true };
  };

  // Обработка выбора файлов
  const handleFiles = useCallback((files: FileList | null) => {
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
  }, [onError]);

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [handleFiles]);

  // Обработка клика на input
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  }, [handleFiles]);

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
      onError({
        type: 'insufficient_photos',
        message: `Необходимо загрузить минимум ${MIN_PHOTOS} фотографий`,
        recommendations: [
          `Добавьте еще ${MIN_PHOTOS - photos.length} фотографий`,
          'Сделайте фотографии объекта с разных ракурсов',
          'Обеспечьте хорошее освещение и четкость снимков'
        ]
      });
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
        })
      );

      // Отправка на сервер
      const response = await fetch(`/api/projects/${projectId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photos: photosData }),
      });

      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки');
      }

      const result = await response.json();
      
      // Очистка превью
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      
      onUploadComplete(result.photos);
    } catch (error) {
      console.error('Ошибка загрузки фотографий:', error);
      onError({
        type: 'upload_failed',
        message: error instanceof Error ? error.message : 'Не удалось загрузить фотографии',
        recommendations: [
          'Проверьте интернет-соединение',
          'Попробуйте загрузить меньше фотографий за раз',
          'Убедитесь, что размер каждого файла не превышает 10 МБ'
        ]
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drag & Drop зона */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_FORMATS.join(',')}
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
            <span className="font-semibold text-blue-600">Нажмите для выбора</span> или перетащите файлы сюда
          </div>
          <p className="text-xs text-gray-500">
            JPEG, PNG, WebP до {MAX_FILE_SIZE / 1024 / 1024} МБ (минимум {MIN_PHOTOS} фотографий)
          </p>
        </div>
      </div>

      {/* Превью загруженных фотографий */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Выбрано фотографий: {photos.length} {photos.length < MIN_PHOTOS && `(минимум ${MIN_PHOTOS})`}
            </h3>
            <button
              onClick={() => {
                photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
                setPhotos([]);
              }}
              className="text-sm text-red-600 hover:text-red-700"
              disabled={isUploading}
            >
              Очистить все
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.preview}
                  alt={photo.file.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
        onClick={handleUpload}
        disabled={photos.length < MIN_PHOTOS || isUploading}
        className={`
          w-full py-3 px-4 rounded-lg font-medium transition-colors
          ${photos.length >= MIN_PHOTOS && !isUploading
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {isUploading ? 'Загрузка...' : `Загрузить фотографии (${photos.length}/${MIN_PHOTOS})`}
      </button>
    </div>
  );
}
