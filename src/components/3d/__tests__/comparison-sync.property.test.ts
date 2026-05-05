import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import {
	cloneOrbitState,
	type OrbitViewState,
	orbitStatesEqual,
	syncOrbitViewState,
} from "../comparisonSync";

type Interaction =
	| { type: "rotate"; deltaX: number; deltaY: number }
	| { type: "pan"; deltaX: number; deltaY: number }
	| { type: "zoom"; delta: number };

class SyncOrbitPair {
	private state: OrbitViewState;

	constructor(initialState: OrbitViewState) {
		this.state = cloneOrbitState(initialState);
	}

	apply(interaction: Interaction) {
		if (interaction.type === "rotate") {
			this.state.position = [
				this.state.position[0] + interaction.deltaX * 0.01,
				this.state.position[1] + interaction.deltaY * 0.01,
				this.state.position[2],
			];
			return;
		}

		if (interaction.type === "pan") {
			this.state.target = [
				this.state.target[0] + interaction.deltaX * 0.01,
				this.state.target[1] + interaction.deltaY * 0.01,
				this.state.target[2],
			];
			return;
		}

		const nextDistance = Math.min(
			20,
			Math.max(1, this.state.position[2] + interaction.delta),
		);
		this.state.position = [
			this.state.position[0],
			this.state.position[1],
			nextDistance,
		];
	}

	getLeftState() {
		return syncOrbitViewState(this.state);
	}

	getRightState() {
		return syncOrbitViewState(this.state);
	}
}

const orbitStateArbitrary = fc.record({
	position: fc.tuple(
		fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true }),
		fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true }),
		fc.float({ min: Math.fround(1), max: Math.fround(10), noNaN: true }),
	) as fc.Arbitrary<[number, number, number]>,
	target: fc.tuple(
		fc.float({ min: Math.fround(-2), max: Math.fround(2), noNaN: true }),
		fc.float({ min: Math.fround(-2), max: Math.fround(2), noNaN: true }),
		fc.float({ min: Math.fround(-2), max: Math.fround(2), noNaN: true }),
	) as fc.Arbitrary<[number, number, number]>,
});

const interactionArbitrary = fc.oneof(
	fc.record({
		type: fc.constant<"rotate">("rotate"),
		deltaX: fc.float({
			min: Math.fround(-50),
			max: Math.fround(50),
			noNaN: true,
		}),
		deltaY: fc.float({
			min: Math.fround(-50),
			max: Math.fround(50),
			noNaN: true,
		}),
	}),
	fc.record({
		type: fc.constant<"pan">("pan"),
		deltaX: fc.float({
			min: Math.fround(-50),
			max: Math.fround(50),
			noNaN: true,
		}),
		deltaY: fc.float({
			min: Math.fround(-50),
			max: Math.fround(50),
			noNaN: true,
		}),
	}),
	fc.record({
		type: fc.constant<"zoom">("zoom"),
		delta: fc.float({ min: Math.fround(-5), max: Math.fround(5), noNaN: true }),
	}),
);

describe("Feature: reality-digitizer-3d, Property 7: Синхронизация камер при сравнении версий", () => {
	it("keeps both comparison viewers in sync for any interaction sequence", async () => {
		await fc.assert(
			fc.asyncProperty(
				orbitStateArbitrary,
				fc.array(interactionArbitrary, { minLength: 1, maxLength: 40 }),
				async (initialState, interactions) => {
					const pair = new SyncOrbitPair(initialState);

					for (const interaction of interactions) {
						pair.apply(interaction);
					}

					const left = pair.getLeftState();
					const right = pair.getRightState();

					expect(left).toEqual(right);
					left.position.forEach((value) => {
						expect(Number.isFinite(value)).toBe(true);
					});
					left.target.forEach((value) => {
						expect(Number.isFinite(value)).toBe(true);
					});
					expect(left.position[2]).toBeGreaterThanOrEqual(1);
					expect(left.position[2]).toBeLessThanOrEqual(20);
				},
			),
			{ numRuns: 100 },
		);
	});

	it("clones synchronized state so panels cannot mutate each other", async () => {
		await fc.assert(
			fc.asyncProperty(orbitStateArbitrary, async (initialState) => {
				const left = syncOrbitViewState(initialState);
				const right = syncOrbitViewState(initialState);

				left.position[0] += 1;
				left.target[1] -= 1;

				expect(orbitStatesEqual(right, initialState)).toBe(true);
				expect(orbitStatesEqual(left, right)).toBe(false);
			}),
			{ numRuns: 100 },
		);
	});
});
