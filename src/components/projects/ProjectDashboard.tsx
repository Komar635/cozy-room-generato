'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Project } from '@/types/database';
import { Button } from '@/components/ui/button';

interface ProjectDashboardProps {
  onCreateProject: () => void;
}

export function ProjectDashboard({ onCreateProject }: ProjectDashboardProps) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/projects');
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить проекты');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот проект?')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Не удалось удалить проект');
      }

      // Обновляем список проектов
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка при удалении');
    }
  };

  const getStatusLabel = (status: Project['status']) => {
    const labels: Record<Project['status'], string> = {
      created: 'Создан',
      uploading: 'Загрузка',
      scanning: 'Сканирование',
      ready: 'Готов',
      modifying: 'Модификация',
      error: 'Ошибка',
    };
    return labels[status];
  };

  const getStatusColor = (status: Project['status']) => {
    const colors: Record<Project['status'], string> = {
      created: 'bg-gray-100 text-gray-800',
      uploading: 'bg-blue-100 text-blue-800',
      scanning: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-green-100 text-green-800',
      modifying: 'bg-purple-100 text-purple-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Войдите, чтобы увидеть свои проекты</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchProjects}>Попробовать снова</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Мои проекты</h1>
        <Button onClick={onCreateProject}>
          Создать новый проект
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 text-lg">У вас пока нет проектов</p>
          <Button onClick={onCreateProject}>
            Создать первый проект
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Превью проекта */}
              <div className="aspect-video bg-gray-200 relative">
                {project.thumbnail_url ? (
                  <img
                    src={project.thumbnail_url}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <svg
                      className="w-16 h-16 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                
                {/* Статус */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </div>

              {/* Информация о проекте */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 truncate">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="text-xs text-gray-500 mb-4">
                  Создан: {new Date(project.created_at).toLocaleDateString('ru-RU')}
                </div>

                {/* Действия */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/projects/${project.id}`}
                  >
                    Открыть
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
