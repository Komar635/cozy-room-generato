'use client';

import { useEffect, useState } from 'react';
import { ProcessingJob } from '@/hooks/useProcessingJobStatus';

interface ProgressIndicatorProps {
  job: ProcessingJob | null;
  className?: string;
}

export function ProgressIndicator({ job, className = '' }: ProgressIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (job?.elapsed_time != null) {
      setElapsedTime(job.elapsed_time);
    }

    if (!job || !job.started_at || job.status === 'completed' || job.status === 'failed') {
      return;
    }

    // Обновляем время каждую секунду
    const interval = setInterval(() => {
      const startTime = new Date(job.started_at!).getTime();
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [job]);

  if (!job) {
    return null;
  }

  const displayElapsedTime = job.elapsed_time ?? elapsedTime;
  const estimatedTimeRemaining = job.estimated_time_remaining;
  const showExecutionTime = displayElapsedTime > 0;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'pending':
        return 'Ожидание начала обработки...';
      case 'processing':
        return 'Обработка в процессе...';
      case 'completed':
        return 'Обработка завершена!';
      case 'failed':
        return 'Ошибка обработки';
      default:
        return 'Неизвестный статус';
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'pending':
        return 'text-yellow-600';
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Статус */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {(job.status === 'processing' || job.status === 'completed' || job.status === 'failed') && showExecutionTime && (
          <span className="text-sm text-gray-500">
            {job.status === 'processing' ? formatTime(displayElapsedTime) : `Выполнено за ${formatTime(displayElapsedTime)}`}
          </span>
        )}
      </div>

      {/* Прогресс-бар */}
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-500 ease-out ${
            job.status === 'completed'
              ? 'bg-green-500'
              : job.status === 'failed'
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${job.progress}%` }}
        >
          {job.status === 'processing' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </div>
      </div>

      {/* Процент и детали */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          {job.progress}% завершено
        </span>
        {job.status === 'processing' && job.progress > 0 && (
          <span className="text-gray-500">
            {estimatedTimeRemaining != null
              ? `~${Math.max(1, Math.ceil(estimatedTimeRemaining / 60))} мин осталось`
              : `~${Math.floor((600 * (100 - job.progress)) / 100 / 60)} мин осталось`}
          </span>
        )}
      </div>

      {/* Сообщение об ошибке */}
      {job.status === 'failed' && job.error_message && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{job.error_message}</p>
        </div>
      )}

      {/* Анимация загрузки для pending/processing */}
      {(job.status === 'pending' || job.status === 'processing') && (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}
