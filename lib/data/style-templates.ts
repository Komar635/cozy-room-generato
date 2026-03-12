import { RoomStyle } from '../../types/room'

export const STYLE_TEMPLATES = {
  [RoomStyle.SCANDINAVIAN]: {
    wallColor: '#F5F5F5',
    floorColor: '#E8DCC4',
    lighting: {
      ambientIntensity: 0.7,
      directionalIntensity: 0.5
    },
    defaultFurniture: [
      { id: 'sofa-scandinavian-1', position: { x: 0.5, y: 0, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'rug-scandinavian-1', position: { x: 0.5, y: 0, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'plant-ficus-1', position: { x: 0.1, y: 0, z: 0.1 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'vase-ceramic-1', position: { x: 0.9, y: 0, z: 0.9 }, rotation: { x: 0, y: 0, z: 0 } }
    ]
  },
  [RoomStyle.LOFT]: {
    wallColor: '#4A4A4A',
    floorColor: '#333333',
    lighting: {
      ambientIntensity: 0.4,
      directionalIntensity: 0.6
    },
    defaultFurniture: [
      { id: 'bookshelf-loft-1', position: { x: 0.1, y: 0, z: 0.5 }, rotation: { x: 0, y: 1.57, z: 0 } },
      { id: 'floor-lamp-loft-1', position: { x: 0.1, y: 0, z: 0.1 }, rotation: { x: 0, y: 0.78, z: 0 } },
      { id: 'table_001', position: { x: 0.5, y: 0, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'painting-abstract-1', position: { x: 0.5, y: 0.6, z: 0.05 }, rotation: { x: 0, y: 0, z: 0 } }
    ]
  },
  [RoomStyle.CLASSIC]: {
    wallColor: '#E3DAC9',
    floorColor: '#5D4037',
    lighting: {
      ambientIntensity: 0.6,
      directionalIntensity: 0.4
    },
    defaultFurniture: [
      { id: 'armchair-classic-1', position: { x: 0.3, y: 0, z: 0.3 }, rotation: { x: 0, y: 0.5, z: 0 } },
      { id: 'dining-table-classic-1', position: { x: 0.7, y: 0, z: 0.3 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'curtains-classic-1', position: { x: 0.5, y: 0.5, z: 0.95 }, rotation: { x: 0, y: 0, z: 0 } }
    ]
  },
  [RoomStyle.MODERN]: {
    wallColor: '#FFFFFF',
    floorColor: '#D3D3D3',
    lighting: {
      ambientIntensity: 0.5,
      directionalIntensity: 0.5
    },
    defaultFurniture: [
      { id: 'sofa-scandinavian-1', position: { x: 0.5, y: 0, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'coffee-table-modern-1', position: { x: 0.5, y: 0, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'chandelier-modern-1', position: { x: 0.5, y: 0.9, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'tv-modern-55-1', position: { x: 0.5, y: 0.5, z: 0.05 }, rotation: { x: 0, y: 0, z: 0 } }
    ]
  },
  [RoomStyle.MINIMALIST]: {
    wallColor: '#FAFAFA',
    floorColor: '#F0F0F0',
    lighting: {
      ambientIntensity: 0.8,
      directionalIntensity: 0.4
    },
    defaultFurniture: [
      { id: 'coffee-table-modern-1', position: { x: 0.5, y: 0, z: 0.5 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'lamp_001', position: { x: 0.9, y: 0, z: 0.1 }, rotation: { x: 0, y: 0, z: 0 } },
      { id: 'vase-ceramic-1', position: { x: 0.1, y: 0, z: 0.9 }, rotation: { x: 0, y: 0, z: 0 } }
    ]
  }
}
