'use client';

import { useState } from 'react';
import Scene3D from './Scene3D';
import GaussianSplattingLoader from './loaders/GaussianSplattingLoader';
import NeRFLoader from './loaders/NeRFLoader';
import { ModelType } from '@/types/database';

interface Model3DViewerProps {
  modelUrl: string;
  modelType: ModelType;
  controls?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

// Компонент для загрузки и отображения модели
function Model3DContent({ 
  modelUrl, 
  modelType, 
  onLoad, 
  onError 
}: {
  modelUrl: string;
  modelType: ModelType;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}) {
  if (modelType === 'gaussian-splatting') {
    return (
      <GaussianSplattingLoader
        url={modelUrl}
        onLoad={onLoad}
        onError={onError}
      />
    );
  } else if (modelType === 'nerf') {
    return (
      <NeRFLoader
        url={modelUrl}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  // Fallback для неизвестных типов
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#gray" />
    </mesh>
  );
}

// Основной компонент Model3DViewer
export default function Model3DViewer({
  modelUrl,
  modelType,
  controls = true,
  onLoad,
  onError,
  className = "w-full h-96"
}: Model3DViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setLoading(false);
    onLoad?.();
  };

  const handleError = (err: Error) => {
    setLoading(false);
    setError(err.message);
    onError?.(err);
  };

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm">Ошибка загрузки модели</p>
          <p className="text-gray-500 text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-600 text-sm">Загрузка 3D-модели...</p>
            <p className="text-gray-500 text-xs mt-1">Тип: {modelType}</p>
          </div>
        </div>
      )}
      
      <Scene3D enableControls={controls} className="w-full h-full rounded-lg overflow-hidden">
        <Model3DContent
          modelUrl={modelUrl}
          modelType={modelType}
          onLoad={handleLoad}
          onError={handleError}
        />
      </Scene3D>
      
      {/* Информационная панель */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        {modelType === 'gaussian-splatting' ? 'Gaussian Splatting' : 'NeRF'}
      </div>
    </div>
  );
}