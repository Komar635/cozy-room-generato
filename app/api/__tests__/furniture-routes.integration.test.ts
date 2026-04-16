/** @jest-environment node */

import { GET as furnitureGet, POST as furniturePost } from '@/app/api/furniture/route'
import { GET as furnitureSearchGet } from '@/app/api/furniture/search/route'
import { GET as furnitureCategoriesGet } from '@/app/api/furniture/categories/route'
import { GET as furnitureItemGet } from '@/app/api/furniture/[id]/route'
import { GET as roomSaveGet, POST as roomSavePost } from '@/app/api/room/save/route'
import { FurnitureAPI } from '@/lib/services/furniture-api'
import { FurnitureCategory, RoomStyle, type RoomProject } from '@/types/room'

jest.mock('@/lib/services/furniture-api', () => ({
  FurnitureAPI: {
    getFurnitureItems: jest.fn(),
    searchFurniture: jest.fn(),
    getCategories: jest.fn(),
    getFurnitureItem: jest.fn()
  }
}))

const mockedFurnitureApi = FurnitureAPI as jest.Mocked<typeof FurnitureAPI>

const createGetRequest = (url: string) => new Request(url, { method: 'GET' }) as any

const createPostRequest = (url: string, body: unknown, headers?: Record<string, string>) =>
  new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(body)
  }) as any

const createProject = (overrides: Partial<RoomProject> = {}): RoomProject => ({
  id: overrides.id ?? 'project-1',
  name: overrides.name ?? 'Demo project',
  roomDimensions: overrides.roomDimensions ?? { width: 4, height: 3, depth: 5 },
  furniture: overrides.furniture ?? [],
  budget: overrides.budget ?? 100000,
  style: overrides.style ?? RoomStyle.MODERN,
  createdAt: overrides.createdAt ?? new Date('2026-04-01T10:00:00.000Z'),
  updatedAt: overrides.updatedAt ?? new Date('2026-04-01T10:00:00.000Z'),
  wallColor: overrides.wallColor,
  floorColor: overrides.floorColor,
  accentColor: overrides.accentColor,
  ambientIntensity: overrides.ambientIntensity,
  directionalIntensity: overrides.directionalIntensity,
  lightWarmth: overrides.lightWarmth
})

describe('furniture and room API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('furniture route sanitizes invalid pagination and csv filters', async () => {
    mockedFurnitureApi.getFurnitureItems.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    })

    const response = await furnitureGet(
      createGetRequest('http://localhost/api/furniture?page=0&limit=-5&colors=white,,oak%20&styles=modern,%20loft&brands=,%20ikea&minPrice=abc&maxPrice=15000&search=chair')
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockedFurnitureApi.getFurnitureItems).toHaveBeenCalledWith(
      {
        category: undefined,
        minPrice: undefined,
        maxPrice: 15000,
        colors: ['white', 'oak'],
        styles: ['modern', 'loft'],
        brands: ['ikea'],
        search: 'chair'
      },
      {
        page: 1,
        limit: 20
      }
    )
    expect(json.success).toBe(true)
  })

  test('furniture search route rejects short queries', async () => {
    const response = await furnitureSearchGet(
      createGetRequest('http://localhost/api/furniture/search?q=a')
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(mockedFurnitureApi.searchFurniture).not.toHaveBeenCalled()
  })

  test('furniture search route falls back to default limit for invalid values', async () => {
    mockedFurnitureApi.searchFurniture.mockResolvedValue([
      {
        id: 'chair-1',
        name: 'Compact chair',
        price_avg_rub: 7990,
        category: { name: 'Furniture' },
        brand: { name: 'Demo brand' }
      }
    ] as any)

    const response = await furnitureSearchGet(
      createGetRequest('http://localhost/api/furniture/search?q=chair&limit=NaN')
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockedFurnitureApi.searchFurniture).toHaveBeenCalledWith('chair', 10)
    expect(json.data.total).toBe(1)
  })

  test('furniture categories route returns categories from service', async () => {
    mockedFurnitureApi.getCategories.mockResolvedValue([
      { id: 'cat-1', name: 'Lighting', slug: FurnitureCategory.LIGHTING }
    ] as any)

    const response = await furnitureCategoriesGet(
      createGetRequest('http://localhost/api/furniture/categories')
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toEqual([
      { id: 'cat-1', name: 'Lighting', slug: FurnitureCategory.LIGHTING }
    ])
  })

  test('furniture item route returns 404 when item is missing', async () => {
    mockedFurnitureApi.getFurnitureItem.mockResolvedValue(null)

    const response = await furnitureItemGet(
      createGetRequest('http://localhost/api/furniture/missing-item'),
      { params: { id: 'missing-item' } }
    )
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Товар не найден')
  })

  test('furniture post route requires bearer auth header', async () => {
    const response = await furniturePost(
      createPostRequest('http://localhost/api/furniture', { id: 'raw-item' })
    )
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  test('room save route persists valid project payload', async () => {
    const project = createProject({ id: '' as any })

    const response = await roomSavePost(
      createPostRequest('http://localhost/api/room/save', project)
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.name).toBe(project.name)
    expect(json.data.id).toMatch(/^project_\d+$/)
    expect(new Date(json.data.updatedAt).toString()).not.toBe('Invalid Date')
  })

  test('room save route validates required project fields', async () => {
    const response = await roomSavePost(
      createPostRequest('http://localhost/api/room/save', {
        name: '',
        roomDimensions: null
      })
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Неполные данные проекта')
  })

  test('room save get route requires project id', async () => {
    const response = await roomSaveGet(
      createGetRequest('http://localhost/api/room/save')
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('ID проекта не указан')
  })
})
