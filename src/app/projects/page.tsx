'use client';

import { useState } from 'react';
import { ProjectDashboard } from '@/components/projects/ProjectDashboard';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleProjectCreated = () => {
    // Обновляем список проектов
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <ProjectDashboard
        key={refreshKey}
        onCreateProject={() => setIsModalOpen(true)}
      />
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
}
