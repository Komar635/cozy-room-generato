"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
	type BufferGeometry,
	Color,
	Float32BufferAttribute,
	type Group,
} from "three";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader.js";

interface GaussianSplattingLoaderProps {
	url: string;
	onLoad?: () => void;
	onError?: (error: Error) => void;
}

export default function GaussianSplattingLoader({
	url,
	onLoad,
	onError,
}: GaussianSplattingLoaderProps) {
	const groupRef = useRef<Group>(null);
	const [geometry, setGeometry] = useState<BufferGeometry | null>(null);

	useEffect(() => {
		let cancelled = false;

		const loadGaussianSplattingPreview = async () => {
			try {
				const loadedGeometry = await new Promise<BufferGeometry>(
					(resolve, reject) => {
						new PLYLoader().load(url, resolve, undefined, (error) => {
							reject(
								error instanceof Error
									? error
									: new Error("Failed to load PLY model"),
							);
						});
					},
				);

				if (cancelled) {
					loadedGeometry.dispose();
					return;
				}

				loadedGeometry.computeBoundingSphere();
				loadedGeometry.computeVertexNormals();
				ensureVertexColors(loadedGeometry);

				setGeometry(loadedGeometry);
				onLoad?.();
			} catch (error) {
				if (!cancelled) {
					onError?.(error as Error);
				}
			}
		};

		loadGaussianSplattingPreview();

		return () => {
			cancelled = true;
			setGeometry((currentGeometry) => {
				currentGeometry?.dispose();
				return null;
			});
		};
	}, [url, onLoad, onError]);

	useFrame((_, delta) => {
		if (groupRef.current && geometry) {
			groupRef.current.rotation.y += delta * 0.12;
		}
	});

	if (!geometry) {
		return null;
	}

	return (
		<group ref={groupRef} frustumCulled>
			<points geometry={geometry} frustumCulled>
				<pointsMaterial
					size={0.025}
					vertexColors={true}
					sizeAttenuation={true}
					transparent={true}
					opacity={0.95}
					depthWrite={false}
				/>
			</points>
		</group>
	);
}

function ensureVertexColors(geometry: BufferGeometry) {
	if (geometry.getAttribute("color")) {
		return;
	}

	const position = geometry.getAttribute("position");
	if (!position) {
		return;
	}

	const colors = new Float32Array(position.count * 3);
	const defaultColor = new Color("#d97757");
	for (let index = 0; index < position.count; index += 1) {
		const offset = index * 3;
		colors[offset] = defaultColor.r;
		colors[offset + 1] = defaultColor.g;
		colors[offset + 2] = defaultColor.b;
	}

	geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}
