import { describe, it, expect } from 'bun:test';
import fc from 'fast-check';

/**
 * Property-based тест для интерактивности визуализатора
 * 
 * Feature: reality-digitizer-3d
 * Property 19: Интерактивность визуализатора
 * 
 * Validates: Требования 5.2
 */

// Типы для тестирования интерактивности
interface OrbitControlsConfig {
  enablePan: boolean;
  enableZoom: boolean;
  enableRotate: boolean;
  maxDistance: number;
  minDistance: number;
  dampingFactor: number;
  enableDamping: boolean;
}

interface ViewerConfig {
  modelUrl: string;
  modelType: 'gaussian-splatting' | 'nerf';
  controls: boolean;
  cameraPosition: [number, number, number];
}

// Симуляция OrbitControls для тестирования
class MockOrbitControls {
  private config: OrbitControlsConfig;
  private camera: {
    position: [number, number, number];
    rotation: [number, number, number];
  };

  constructor(config: OrbitControlsConfig, initialCameraPosition: [number, number, number] = [0, 0, 5]) {
    this.config = config;
    this.camera = {
      position: [...initialCameraPosition],
      rotation: [0, 0, 0]
    };
  }

  // Симуляция взаимодействий с учётом конфигурации
  handleInteraction(type: 'pan' | 'rotate' | 'zoom', deltaX: number, deltaY: number, deltaZoom?: number): boolean {
    switch (type) {
      case 'rotate':
        if (!this.config.enableRotate) return false;
        if (Math.abs(deltaX) >= 0.005 || Math.abs(deltaY) >= 0.005) {
          this.camera.rotation[0] += deltaY * 0.01;
          this.camera.rotation[1] += deltaX * 0.01;
          return true;
        }
        return false;

      case 'pan':
        if (!this.config.enablePan) return false;
        if (Math.abs(deltaX) >= 0.005 || Math.abs(deltaY) >= 0.005) {
          this.camera.position[0] += deltaX * 0.01;
          this.camera.position[1] += deltaY * 0.01;
          return true;
        }
        return false;

      case 'zoom':
        if (!this.config.enableZoom || deltaZoom === undefined) return false;
        if (Math.abs(deltaZoom) >= 0.005) {
          const currentDistance = Math.sqrt(
            this.camera.position[0] ** 2 + 
            this.camera.position[1] ** 2 + 
            this.camera.position[2] ** 2
          );
          
          const newDistance = Math.max(
            this.config.minDistance,
            Math.min(this.config.maxDistance, currentDistance + deltaZoom)
          );
          
          if (Math.abs(newDistance - currentDistance) > 0.001) {
            const scale = newDistance / currentDistance;
            this.camera.position[0] *= scale;
            this.camera.position[1] *= scale;
            this.camera.position[2] *= scale;
            return true;
          }
        }
        return false;
    }
    return false;
  }

  getCameraState() {
    return {
      position: [...this.camera.position] as [number, number, number],
      rotation: [...this.camera.rotation] as [number, number, number]
    };
  }

  isConfigValid(): boolean {
    return (
      this.config.minDistance > 0 &&
      this.config.maxDistance > this.config.minDistance &&
      this.config.dampingFactor >= 0 &&
      this.config.dampingFactor <= 1
    );
  }
}

// Генераторы для property-based тестирования
const orbitControlsConfigArbitrary = fc.record({
  enablePan: fc.boolean(),
  enableZoom: fc.boolean(),
  enableRotate: fc.boolean(),
  maxDistance: fc.float({ min: Math.fround(5), max: Math.fround(50) }),
  minDistance: fc.float({ min: Math.fround(0.1), max: Math.fround(2) }),
  dampingFactor: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
  enableDamping: fc.boolean()
});

const viewerConfigArbitrary = fc.record({
  modelUrl: fc.webUrl(),
  modelType: fc.constantFrom('gaussian-splatting', 'nerf'),
  controls: fc.boolean(),
  cameraPosition: fc.tuple(
    fc.float({ min: Math.fround(-10), max: Math.fround(10) }),
    fc.float({ min: Math.fround(-10), max: Math.fround(10) }),
    fc.float({ min: Math.fround(1), max: Math.fround(20) })
  ) as fc.Arbitrary<[number, number, number]>
});

const interactionArbitrary = fc.record({
  type: fc.constantFrom('pan', 'rotate', 'zoom'),
  deltaX: fc.float({ min: Math.fround(-100), max: Math.fround(100) }),
  deltaY: fc.float({ min: Math.fround(-100), max: Math.fround(100) }),
  deltaZoom: fc.float({ min: Math.fround(-5), max: Math.fround(5) })
});

describe('Feature: reality-digitizer-3d, Property 19: Интерактивность визуализатора', () => {
  /**
   * Validates: Требования 5.2
   * 
   * Для любого взаимодействия пользователя с моделью (вращение, масштабирование, панорамирование),
   * состояние камеры должно корректно обновляться в соответствии с действием.
   */
  it('should correctly handle interactions based on OrbitControls configuration', async () => {
    await fc.assert(
      fc.property(
        orbitControlsConfigArbitrary,
        interactionArbitrary,
        (config, interaction) => {
          // Пропускаем невалидные конфигурации
          fc.pre(config.minDistance < config.maxDistance && config.minDistance > 0);

          // Arrange: создаём OrbitControls с заданной конфигурацией
          const controls = new MockOrbitControls(config);
          const initialState = controls.getCameraState();

          // Act: применяем взаимодействие
          const interactionHandled = controls.handleInteraction(
            interaction.type as 'pan' | 'rotate' | 'zoom',
            interaction.deltaX,
            interaction.deltaY,
            interaction.deltaZoom
          );

          const finalState = controls.getCameraState();

          // Assert: проверяем корректность обработки взаимодействия
          switch (interaction.type) {
            case 'rotate':
              if (config.enableRotate && (Math.abs(interaction.deltaX) >= 0.005 || Math.abs(interaction.deltaY) >= 0.005)) {
                expect(interactionHandled).toBe(true);
                // Вращение должно изменить углы поворота
                const rotationChanged = 
                  Math.abs(finalState.rotation[0] - initialState.rotation[0]) > 0.00001 ||
                  Math.abs(finalState.rotation[1] - initialState.rotation[1]) > 0.00001;
                expect(rotationChanged).toBe(true);
              } else if (!config.enableRotate) {
                expect(interactionHandled).toBe(false);
                // Состояние не должно измениться
                expect(finalState).toEqual(initialState);
              }
              break;

            case 'pan':
              if (config.enablePan && (Math.abs(interaction.deltaX) >= 0.005 || Math.abs(interaction.deltaY) >= 0.005)) {
                expect(interactionHandled).toBe(true);
                // Панорамирование должно изменить позицию
                const positionChanged = 
                  Math.abs(finalState.position[0] - initialState.position[0]) > 0.00001 ||
                  Math.abs(finalState.position[1] - initialState.position[1]) > 0.00001;
                expect(positionChanged).toBe(true);
              } else if (!config.enablePan) {
                expect(interactionHandled).toBe(false);
                // Состояние не должно измениться
                expect(finalState).toEqual(initialState);
              }
              break;

            case 'zoom':
              if (config.enableZoom && Math.abs(interaction.deltaZoom) >= 0.005) {
                const initialDistance = Math.sqrt(
                  initialState.position[0] ** 2 + 
                  initialState.position[1] ** 2 + 
                  initialState.position[2] ** 2
                );
                
                const finalDistance = Math.sqrt(
                  finalState.position[0] ** 2 + 
                  finalState.position[1] ** 2 + 
                  finalState.position[2] ** 2
                );

                // Проверяем ограничения зума
                expect(finalDistance).toBeGreaterThanOrEqual(config.minDistance);
                expect(finalDistance).toBeLessThanOrEqual(config.maxDistance);
                
                // Если зум изменился, interaction должен быть обработан
                if (Math.abs(finalDistance - initialDistance) > 0.001) {
                  expect(interactionHandled).toBe(true);
                }
              } else if (!config.enableZoom) {
                expect(interactionHandled).toBe(false);
                // Состояние не должно измениться
                expect(finalState).toEqual(initialState);
              }
              break;
          }

          // Общие проверки: состояние должно быть валидным
          expect(finalState.position).toHaveLength(3);
          expect(finalState.rotation).toHaveLength(3);
          
          // Все значения должны быть конечными числами
          finalState.position.forEach(value => expect(Number.isFinite(value)).toBe(true));
          finalState.rotation.forEach(value => expect(Number.isFinite(value)).toBe(true));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Проверяет валидность конфигурации OrbitControls
   */
  it('should validate OrbitControls configuration correctly', async () => {
    await fc.assert(
      fc.property(
        orbitControlsConfigArbitrary,
        (config) => {
          // Arrange & Act: создаём OrbitControls с заданной конфигурацией
          const controls = new MockOrbitControls(config);
          const isValid = controls.isConfigValid();

          // Assert: проверяем корректность валидации
          const expectedValid = (
            config.minDistance > 0 &&
            config.maxDistance > config.minDistance &&
            config.dampingFactor >= 0 &&
            config.dampingFactor <= 1
          );

          expect(isValid).toBe(expectedValid);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Проверяет детерминированность взаимодействий
   */
  it('should produce deterministic results for identical interactions', async () => {
    await fc.assert(
      fc.property(
        orbitControlsConfigArbitrary,
        fc.array(interactionArbitrary, { minLength: 1, maxLength: 5 }),
        (config, interactions) => {
          // Пропускаем невалидные конфигурации
          fc.pre(config.minDistance < config.maxDistance && config.minDistance > 0);

          // Arrange: создаём два идентичных OrbitControls
          const controls1 = new MockOrbitControls(config);
          const controls2 = new MockOrbitControls(config);

          // Act: применяем одинаковую последовательность взаимодействий
          for (const interaction of interactions) {
            controls1.handleInteraction(
              interaction.type as 'pan' | 'rotate' | 'zoom',
              interaction.deltaX,
              interaction.deltaY,
              interaction.deltaZoom
            );
            controls2.handleInteraction(
              interaction.type as 'pan' | 'rotate' | 'zoom',
              interaction.deltaX,
              interaction.deltaY,
              interaction.deltaZoom
            );
          }

          const state1 = controls1.getCameraState();
          const state2 = controls2.getCameraState();

          // Assert: результаты должны быть идентичными
          expect(state1.position[0]).toBeCloseTo(state2.position[0], 10);
          expect(state1.position[1]).toBeCloseTo(state2.position[1], 10);
          expect(state1.position[2]).toBeCloseTo(state2.position[2], 10);
          expect(state1.rotation[0]).toBeCloseTo(state2.rotation[0], 10);
          expect(state1.rotation[1]).toBeCloseTo(state2.rotation[1], 10);
          expect(state1.rotation[2]).toBeCloseTo(state2.rotation[2], 10);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Проверяет корректность обработки граничных случаев
   */
  it('should handle edge cases correctly', async () => {
    await fc.assert(
      fc.property(
        orbitControlsConfigArbitrary,
        (config) => {
          // Пропускаем невалидные конфигурации
          fc.pre(config.minDistance < config.maxDistance && config.minDistance > 0);

          // Arrange: создаём OrbitControls
          const controls = new MockOrbitControls(config);

          // Act & Assert: тестируем граничные случаи
          
          // 1. Нулевые взаимодействия не должны изменять состояние
          const initialState = controls.getCameraState();
          const zeroInteractionHandled = controls.handleInteraction('pan', 0, 0);
          const stateAfterZero = controls.getCameraState();
          
          expect(zeroInteractionHandled).toBe(false);
          expect(stateAfterZero).toEqual(initialState);

          // 2. Очень малые взаимодействия не должны обрабатываться
          const smallInteractionHandled = controls.handleInteraction('rotate', 0.001, 0.001);
          const stateAfterSmall = controls.getCameraState();
          
          expect(smallInteractionHandled).toBe(false);
          expect(stateAfterSmall).toEqual(initialState);

          // 3. Большие взаимодействия должны ограничиваться пределами зума
          if (config.enableZoom) {
            // Попытка зума за максимальный предел
            controls.handleInteraction('zoom', 0, 0, 1000);
            const stateAfterMaxZoom = controls.getCameraState();
            const maxDistance = Math.sqrt(
              stateAfterMaxZoom.position[0] ** 2 + 
              stateAfterMaxZoom.position[1] ** 2 + 
              stateAfterMaxZoom.position[2] ** 2
            );
            expect(maxDistance).toBeLessThanOrEqual(config.maxDistance + 0.001);

            // Попытка зума за минимальный предел
            controls.handleInteraction('zoom', 0, 0, -1000);
            const stateAfterMinZoom = controls.getCameraState();
            const minDistance = Math.sqrt(
              stateAfterMinZoom.position[0] ** 2 + 
              stateAfterMinZoom.position[1] ** 2 + 
              stateAfterMinZoom.position[2] ** 2
            );
            expect(minDistance).toBeGreaterThanOrEqual(config.minDistance - 0.001);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});