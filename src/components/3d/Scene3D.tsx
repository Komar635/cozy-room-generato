"use client";

import {
	Environment,
	OrbitControls,
	PerspectiveCamera,
} from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { type OrbitViewState, orbitStatesEqual } from "./comparisonSync";

export type { OrbitViewState } from "./comparisonSync";

interface Scene3DProps {
	children: React.ReactNode;
	enableControls?: boolean;
	cameraPosition?: [number, number, number];
	orbitState?: OrbitViewState;
	onOrbitChange?: (state: OrbitViewState) => void;
	className?: string;
}

function SceneControls({
	orbitState,
	onOrbitChange,
}: {
	orbitState?: OrbitViewState;
	onOrbitChange?: (state: OrbitViewState) => void;
}) {
	const controlsRef = useRef<OrbitControlsImpl | null>(null);
	const { camera } = useThree();

	useEffect(() => {
		const controls = controlsRef.current;
		if (!controls || !orbitState) {
			return;
		}

		const nextState: OrbitViewState = {
			position: [camera.position.x, camera.position.y, camera.position.z],
			target: [controls.target.x, controls.target.y, controls.target.z],
		};

		if (orbitStatesEqual(nextState, orbitState)) {
			return;
		}

		camera.position.set(...orbitState.position);
		controls.target.set(...orbitState.target);
		controls.update();
	}, [camera, orbitState]);

	useEffect(() => {
		const controls = controlsRef.current;
		if (!controls || !onOrbitChange) {
			return;
		}

		const handleChange = () => {
			onOrbitChange({
				position: [camera.position.x, camera.position.y, camera.position.z],
				target: [controls.target.x, controls.target.y, controls.target.z],
			});
		};

		controls.addEventListener("change", handleChange);

		return () => {
			controls.removeEventListener("change", handleChange);
		};
	}, [camera, onOrbitChange]);

	return (
		<OrbitControls
			ref={controlsRef}
			enablePan={true}
			enableZoom={true}
			enableRotate={true}
			dampingFactor={0.05}
			enableDamping={true}
			maxDistance={20}
			minDistance={1}
		/>
	);
}

export default function Scene3D({
	children,
	enableControls = true,
	cameraPosition = [0, 0, 5],
	orbitState,
	onOrbitChange,
	className = "w-full h-full",
}: Scene3DProps) {
	return (
		<div className={className}>
			<Canvas
				frameloop="demand"
				dpr={[1, 1.5]}
				camera={{ position: cameraPosition, fov: 50 }}
				gl={{
					antialias: false,
					alpha: true,
					powerPreference: "high-performance",
				}}
			>
				{/* Камера */}
				<PerspectiveCamera makeDefault position={cameraPosition} />

				{/* Освещение */}
				<ambientLight intensity={0.4} />
				<directionalLight position={[10, 10, 5]} intensity={0.9} />
				<pointLight position={[-10, -10, -10]} intensity={0.5} />

				{/* Окружение для реалистичного освещения */}
				<Environment preset="studio" />

				{/* Контроллеры для взаимодействия */}
				{enableControls && (
					<SceneControls
						orbitState={orbitState}
						onOrbitChange={onOrbitChange}
					/>
				)}

				{/* Содержимое сцены */}
				<Suspense fallback={null}>{children}</Suspense>
			</Canvas>
		</div>
	);
}
