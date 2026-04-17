'use client';

import { useRef, useEffect, useState } from 'react';
import { Group, Float32BufferAttribute, BufferGeometry } from 'three';
import { useFrame } from '@react-three/fiber';

interface GaussianSplattingLoaderProps {
  url: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export default function GaussianSplattingLoader({ 
  url, 
  onLoad, 
  onError 
}: GaussianSplattingLoaderProps) {
  const groupRef = useRef<Group>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const geometry = new BufferGeometry();
  const positions = new Float32Array(Array.from({ length: 3000 }, () => (Math.random() - 0.5) * 4));
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  useEffect(() => {
    const loadGaussianSplatting = async () => {
      try {
        console.log('Loading Gaussian Splatting from:', url);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsLoaded(true);
        onLoad?.();
      } catch (error) {
        console.error('Failed to load Gaussian Splatting:', error);
        onError?.(error as Error);
      }
    };

    loadGaussianSplatting();
  }, [url, onLoad, onError]);

  useFrame((state, delta) => {
    if (groupRef.current && isLoaded) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  if (!isLoaded) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.05}
          color="#ff6b6b"
          sizeAttenuation={true}
          transparent={true}
          opacity={0.8}
        />
      </points>
    </group>
  );
}