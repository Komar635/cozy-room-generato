'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';

interface Scene3DProps {
  children: React.ReactNode;
  enableControls?: boolean;
  cameraPosition?: [number, number, number];
  className?: string;
}

export default function Scene3D({ 
  children, 
  enableControls = true, 
  cameraPosition = [0, 0, 5],
  className = "w-full h-full"
}: Scene3DProps) {
  return (
    <div className={className}>
      <Canvas
        shadows
        camera={{ position: cameraPosition, fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        {/* Камера */}
        <PerspectiveCamera makeDefault position={cameraPosition} />
        
        {/* Освещение */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Окружение для реалистичного освещения */}
        <Environment preset="studio" />
        
        {/* Контроллеры для взаимодействия */}
        {enableControls && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            dampingFactor={0.05}
            enableDamping={true}
            maxDistance={20}
            minDistance={1}
          />
        )}
        
        {/* Содержимое сцены */}
        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
}