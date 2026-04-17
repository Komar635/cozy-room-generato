'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Model3DViewer } from '@/components/3d';
import { PhotoUploader, PhotoUploadError } from '@/components/photos/PhotoUploader';
import { ProgressIndicator } from '@/components/processing';
import { Button } from '@/components/ui/button';
import { useProcessingJobStatus } from '@/hooks/useProcessingJobStatus';

interface ProjectPageProps {
  params: {
    id: string;
  };
}

interface ProjectResponse {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  thumbnail_url?: string;
  status: 'created' | 'uploading' | 'scanning' | 'ready' | 'modifying' | 'error';
  created_at: string;
  updated_at: string;
}

interface PhotoResponse {
  id: string;
  project_id: string;
  storage_path: string;
  url: string;
  size_bytes?: number;
  uploaded_at: string;
}

interface ModelResponse {
  id: string;
  project_id: string;
  parent_model_id?: string;
  model_type: 'gaussian-splatting' | 'nerf';
  storage_path: string;
  url: string;
  is_original: boolean;
  processing_job_id?: string;
  created_at: string;
}

const MIN_PHOTOS = 10;

const statusLabels: Record<ProjectResponse['status'], string> = {
  created: 'Проект создан',
  uploading: 'Фотографии загружены',
  scanning: 'Идет сканирование',
  ready: 'Модель готова',
  modifying: 'Идет модификация',
  error: 'Есть ошибка',
};

const statusClasses: Record<ProjectResponse['status'], string> = {
  created: 'bg-slate-100 text-slate-700',
  uploading: 'bg-sky-100 text-sky-700',
  scanning: 'bg-amber-100 text-amber-700',
  ready: 'bg-emerald-100 text-emerald-700',
  modifying: 'bg-indigo-100 text-indigo-700',
  error: 'bg-rose-100 text-rose-700',
};

export default function ProjectPage({ params }: ProjectPageProps) {
  const projectId = params.id;
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [photos, setPhotos] = useState<PhotoResponse[]>([]);
  const [latestModel, setLatestModel] = useState<ModelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<PhotoUploadError | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelViewerError, setModelViewerError] = useState<string | null>(null);
  const [isStartingScan, setIsStartingScan] = useState(false);
  const {
    job,
    loading: jobLoading,
    error: jobError,
    refresh: refreshJob,
  } = useProcessingJobStatus(projectId);

  const fetchProject = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}`, { cache: 'no-store' });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || 'Не удалось загрузить проект');
    }

    const payload = await response.json();
    setProject(payload);
  }, [projectId]);

  const fetchPhotos = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}/photos`, { cache: 'no-store' });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || 'Не удалось загрузить фотографии');
    }

    const payload = await response.json();
    setPhotos(payload.photos || []);
  }, [projectId]);

  const fetchModels = useCallback(async () => {
    const response = await fetch(`/api/projects/${projectId}/models`, { cache: 'no-store' });

    if (response.status === 404) {
      setLatestModel(null);
      setModelError(null);
      return;
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || 'Не удалось загрузить модель проекта');
    }

    const payload = await response.json();
    setLatestModel(payload.latestModel || null);
    setModelError(null);
  }, [projectId]);

  const loadPageData = useCallback(
    async (background = false) => {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        setPageError(null);
        await Promise.all([fetchProject(), fetchPhotos(), fetchModels()]);
      } catch (error) {
        setPageError(error instanceof Error ? error.message : 'Не удалось загрузить страницу проекта');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchModels, fetchPhotos, fetchProject]
  );

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (job?.status === 'completed' || job?.status === 'failed') {
      loadPageData(true);
    }
  }, [job?.status, loadPageData]);

  const photoSlotsLeft = Math.max(MIN_PHOTOS - photos.length, 0);
  const hasEnoughPhotos = photos.length >= MIN_PHOTOS;
  const activeProcessing = job && (job.status === 'pending' || job.status === 'processing');
  const showViewer = Boolean(latestModel && project?.status === 'ready');

  const readinessText = useMemo(() => {
    if (activeProcessing) {
      return 'Обработка уже запущена. Следите за прогрессом ниже.';
    }

    if (hasEnoughPhotos) {
      return 'Фотографий достаточно, можно запускать сканирование.';
    }

    return `Добавьте еще ${photoSlotsLeft} фото, чтобы запустить сканирование.`;
  }, [activeProcessing, hasEnoughPhotos, photoSlotsLeft]);

  const handleUploadComplete = useCallback(async () => {
    setUploadError(null);
    setScanMessage('Фотографии загружены. Теперь можно запускать сканирование.');
    setModelViewerError(null);
    await loadPageData(true);
  }, [loadPageData]);

  const handleUploadError = useCallback((error: PhotoUploadError) => {
    setUploadError(error);
  }, []);

  const handleStartScan = useCallback(async () => {
    setIsStartingScan(true);
    setScanError(null);
    setScanMessage(null);
    setModelViewerError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/scan`, {
        method: 'POST',
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Не удалось запустить сканирование');
      }

      setScanMessage(payload?.message || 'Сканирование успешно запущено.');
      await Promise.all([loadPageData(true), refreshJob()]);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Не удалось запустить сканирование');
    } finally {
      setIsStartingScan(false);
    }
  }, [loadPageData, projectId, refreshJob]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
            <p className="text-sm text-slate-500">Загружаю проект...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!project || pageError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-rose-600">{pageError || 'Проект не найден'}</p>
          <div className="mt-4 flex gap-3">
            <Link href="/projects">
              <Button variant="outline">К проектам</Button>
            </Link>
            <Button onClick={() => loadPageData()}>Повторить</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef4f8_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.08),_transparent_45%),linear-gradient(135deg,#ffffff_0%,#f7fbff_100%)] px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Link href="/projects" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
                  &lt;- Все проекты
                </Link>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{project.name}</h1>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                    {refreshing && <span className="text-xs text-slate-400">Обновляю данные...</span>}
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-600">
                    {project.description || 'Добавьте фотографии предмета, проверьте количество кадров и запустите сборку 3D-модели.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Фото</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{photos.length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Мин. набор</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{MIN_PHOTOS}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 sm:col-span-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Создан</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {new Date(project.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Фотографии объекта</p>
                  <p className="text-sm text-slate-500">Загрузите минимум 10 кадров с разных ракурсов.</p>
                </div>
                <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                  {photos.length}/{MIN_PHOTOS}
                </div>
              </div>

              {uploadError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="font-medium">{uploadError.message}</p>
                  {uploadError.recommendations && uploadError.recommendations.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800">
                      {uploadError.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <PhotoUploader
                projectId={projectId}
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
              />
            </section>

            <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Сканирование и прогресс</p>
                <p className="text-sm text-slate-500">Как только кадров достаточно, можно запускать реконструкцию модели.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">Готовность к запуску</p>
                    <p className="mt-1 text-sm text-slate-600">{readinessText}</p>
                  </div>
                  <Button
                    onClick={handleStartScan}
                    disabled={!hasEnoughPhotos || Boolean(activeProcessing) || isStartingScan}
                  >
                    {isStartingScan ? 'Запуск...' : activeProcessing ? 'Сканирование идет' : 'Запустить сканирование'}
                  </Button>
                </div>
              </div>

              {scanMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {scanMessage}
                </div>
              )}

              {scanError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {scanError}
                </div>
              )}

              {jobError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {jobError}
                </div>
              )}

              {jobLoading && !job ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Проверяю статус обработки...
                </div>
              ) : job ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <ProgressIndicator job={job} className="progress-indicator" />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  После запуска сканирования здесь появится индикатор прогресса и расчет времени.
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,#fff8eb_0%,#fffefe_100%)] p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Что дальше</p>
                <p className="mt-2">
                  Когда задача завершится, проект перейдет в статус <span className="font-medium text-emerald-700">готов</span>. Следующим шагом можно будет подключить просмотр модели и дальнейший анализ.
                </p>
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">3D-модель проекта</h2>
              <p className="text-sm text-slate-500">После завершения сканирования здесь появляется текущая версия модели.</p>
            </div>
            {latestModel && (
              <p className="text-sm text-slate-400">
                Последняя модель: {new Date(latestModel.created_at).toLocaleString('ru-RU')}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {modelError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {modelError}
              </div>
            )}

            {modelViewerError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {modelViewerError}
              </div>
            )}

            {showViewer && latestModel ? (
              <>
                <div className="rounded-3xl border border-slate-200 bg-slate-950 p-3 shadow-inner">
                  <Model3DViewer
                    modelUrl={latestModel.url}
                    modelType={latestModel.model_type}
                    className="h-[28rem] w-full"
                    onError={(error) => setModelViewerError(error.message)}
                    onLoad={() => setModelViewerError(null)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Тип</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{latestModel.model_type}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Версия</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {latestModel.is_original ? 'Оригинальная' : 'Производная'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Источник</p>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-900">{latestModel.storage_path}</p>
                  </div>
                </div>
              </>
            ) : activeProcessing ? (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 py-10 text-center text-sm text-amber-800">
                Модель готовится. Как только сканирование завершится, просмотрщик появится автоматически.
              </div>
            ) : project.status === 'ready' ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Проект уже помечен как готовый, но модель пока не найдена. Обновите страницу или проверьте запись в `models_3d`.
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Сначала загрузите фотографии и завершите сканирование, чтобы увидеть 3D-предпросмотр объекта.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Загруженные фотографии</h2>
              <p className="text-sm text-slate-500">Все фотографии проекта, которые уже попали в хранилище.</p>
            </div>
            <p className="text-sm text-slate-400">
              Последнее обновление: {new Date(project.updated_at).toLocaleString('ru-RU')}
            </p>
          </div>

          {photos.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              Пока нет ни одной загруженной фотографии.
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <img src={photo.url} alt={`Фото проекта ${project.name}`} className="h-36 w-full object-cover" />
                  <div className="space-y-1 px-3 py-3">
                    <p className="text-xs font-medium text-slate-700">
                      {photo.size_bytes ? `${(photo.size_bytes / 1024 / 1024).toFixed(1)} МБ` : 'Размер неизвестен'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(photo.uploaded_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
