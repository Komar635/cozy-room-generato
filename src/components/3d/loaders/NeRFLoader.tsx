"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import {
	createLODPlan,
	getNerfPreviewGeometry,
	getPointCloudGeometry,
	loadProgressiveModelAsset,
} from "../modelPerformance";

interface NeRFLoaderProps {
	url: string;
	onLoad?: () => void;
	onError?: (error: Error) => void;
}

export default function NeRFLoader({ url, onLoad, onError }: NeRFLoaderProps) {
	const groupRef = useRef<Group>(null);
	const meshRef = useRef<Mesh>(null);
	const [assetPlan, setAssetPlan] = useState(() => createLODPlan("nerf"));
	const [isLoaded, setIsLoaded] = useState(false);

	const volumeGeometry = useMemo(
		() => getNerfPreviewGeometry(url, assetPlan.triangleBudget),
		[url, assetPlan.triangleBudget],
	);
	const pointGeometry = useMemo(
		() =>
			getPointCloudGeometry(`${url}:nerf-volume`, assetPlan.fullPointCount, 3),
		[url, assetPlan.fullPointCount],
	);

	useEffect(() => {
		let cancelled = false;

		const loadNeRF = async () => {
			try {
				const asset = await loadProgressiveModelAsset(
					url,
					"nerf",
					(progress) => {
						if (!cancelled && progress >= 0.25) {
							setIsLoaded(true);
						}
					},
				);

				if (cancelled) {
					return;
				}

				setAssetPlan({
					previewPointCount: Math.max(128, Math.round(asset.pointCount * 0.5)),
					fullPointCount: asset.pointCount,
					triangleBudget: asset.triangleBudget,
				});
				setIsLoaded(true);
				onLoad?.();
			} catch (error) {
				if (!cancelled) {
					onError?.(error as Error);
				}
			}
		};

		loadNeRF();

		return () => {
			cancelled = true;
		};
	}, [url, onLoad, onError]);

	useFrame((state, delta) => {
		if (groupRef.current && isLoaded) {
			groupRef.current.rotation.x += delta * 0.04;
			groupRef.current.rotation.y += delta * 0.08;
		}

		if (meshRef.current && isLoaded) {
			const scale = 1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.04;
			meshRef.current.scale.setScalar(scale);
		}
	});

	if (!isLoaded) {
		return null;
	}

	return (
		<group ref={groupRef} frustumCulled>
			<mesh ref={meshRef} geometry={volumeGeometry} frustumCulled>
				<meshStandardMaterial
					color="#4ecdc4"
					transparent
					opacity={0.56}
					roughness={0.18}
					metalness={0.15}
					depthWrite={false}
				/>
			</mesh>

			<mesh frustumCulled>
				<icosahedronGeometry args={[1.2, 1]} />
				<meshStandardMaterial
					color="#45b7aa"
					transparent
					opacity={0.32}
					wireframe={true}
				/>
			</mesh>

			<points geometry={pointGeometry} frustumCulled>
				<pointsMaterial
					size={0.02}
					color="#4ecdc4"
					sizeAttenuation={true}
					transparent={true}
					opacity={0.58}
					depthWrite={false}
				/>
			</points>
		</group>
	);
}
