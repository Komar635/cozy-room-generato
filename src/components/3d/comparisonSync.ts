export interface OrbitViewState {
	position: [number, number, number];
	target: [number, number, number];
}

export const DEFAULT_ORBIT_STATE: OrbitViewState = {
	position: [0, 0, 5],
	target: [0, 0, 0],
};

export function cloneOrbitState(state: OrbitViewState): OrbitViewState {
	return {
		position: [...state.position] as [number, number, number],
		target: [...state.target] as [number, number, number],
	};
}

export function orbitStatesEqual(a: OrbitViewState, b: OrbitViewState) {
	return (
		a.position.every(
			(value, index) => Math.abs(value - b.position[index]) < 0.0001,
		) &&
		a.target.every((value, index) => Math.abs(value - b.target[index]) < 0.0001)
	);
}

export function syncOrbitViewState(nextState: OrbitViewState): OrbitViewState {
	return cloneOrbitState(nextState);
}
