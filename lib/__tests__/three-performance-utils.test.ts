import { getLODLevel, getQualitySettings, getOptimizedTextureSettings } from '@/lib/three-utils'

describe('3d performance helpers', () => {
  test('selects LOD tiers by distance', () => {
    expect(getLODLevel(2)).toBe('high')
    expect(getLODLevel(10)).toBe('medium')
    expect(getLODLevel(25)).toBe('low')
  })

  test('returns lower quality settings for weaker devices', () => {
    expect(getQualitySettings('low')).toEqual(
      expect.objectContaining({ antialias: false, dpr: 1, maxLights: 2 })
    )
    expect(getQualitySettings('high')).toEqual(
      expect.objectContaining({ antialias: true, dpr: 2, maxLights: 6 })
    )
  })

  test('scales texture settings by device class', () => {
    expect(getOptimizedTextureSettings('low').quality).toBeLessThan(
      getOptimizedTextureSettings('high').quality
    )
    expect(getOptimizedTextureSettings('medium').anisotropy).toBe(4)
  })
})
