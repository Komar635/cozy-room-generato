'use client'

import { useRef, useEffect, useState } from 'react'
import { useRoomStore } from '@/store/room-store'
import { FurnitureItem, Vector3 } from '@/types/room'
import { formatPrice } from '@/lib/furniture-utils'
import * as THREE from 'three'

interface WorkingRoomCanvasProps {
  onItemSelect?: (item: FurnitureItem | null) => void
  onItemMove?: (itemId: string, position: Vector3) => void
  className?: string
}

export default function WorkingRoomCanvas({ 
  onItemSelect, 
  onItemMove, 
  className = "w-full h-full" 
}: WorkingRoomCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const furnitureObjectsRef = useRef<Map<string, THREE.Group>>(new Map())
  
  const { furniture, roomDimensions, addFurniture, removeFurniture, selectFurniture, selectedItem } = useRoomStore()
  const [draggedItem, setDraggedItem] = useState<FurnitureItem | null>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Создаем сцену
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    
    // Рендерер для Intel GPU с улучшенным качеством
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,  // Включаем антиалиасинг
      alpha: false,
      powerPreference: 'default',
      precision: 'mediump'  // Средняя точность вместо низкой
    })
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Улучшаем качество
    renderer.setClearColor(0x2a2a2a)  // Более приятный цвет фона
    renderer.shadowMap.enabled = true  // Включаем тени
    renderer.shadowMap.type = THREE.PCFSoftShadowMap  // Мягкие тени
    mountRef.current.appendChild(renderer.domElement)

    // Сохраняем ссылки
    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera

    // Позиция камеры
    camera.position.set(10, 8, 10)
    camera.lookAt(0, 0, 0)

    // Освещение с тенями
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    scene.add(directionalLight)

    // Комната
    createRoom(scene, roomDimensions)

    // Обработчики событий
    setupEventHandlers(renderer, camera, scene)

    // Анимация
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      // Анимация выбранного предмета
      if (selectedItem) {
        const selectedObject = furnitureObjectsRef.current.get(selectedItem.id)
        if (selectedObject) {
          selectedObject.rotation.y += 0.01
        }
      }
      
      renderer.render(scene, camera)
    }
    animate()

    // Обработка изменения размера
    const handleResize = () => {
      if (!mountRef.current) return
      
      const width = mountRef.current.clientWidth
      const height = mountRef.current.clientHeight
      
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [roomDimensions])

  // Создание комнаты
  const createRoom = (scene: THREE.Scene, dimensions: typeof roomDimensions) => {
    // Пол с тенями
    const floorGeometry = new THREE.PlaneGeometry(dimensions.width, dimensions.depth)
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xf8f8f8 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    floor.name = 'floor'
    scene.add(floor)

    // Стены с лучшими материалами
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xfafafa, 
      transparent: true, 
      opacity: 0.9 
    })
    
    // Задняя стена
    const backWallGeometry = new THREE.PlaneGeometry(dimensions.width, dimensions.height)
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial)
    backWall.position.set(0, dimensions.height / 2, -dimensions.depth / 2)
    backWall.receiveShadow = true
    scene.add(backWall)
    
    // Левая стена
    const leftWallGeometry = new THREE.PlaneGeometry(dimensions.depth, dimensions.height)
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
    leftWall.position.set(-dimensions.width / 2, dimensions.height / 2, 0)
    leftWall.rotation.y = Math.PI / 2
    leftWall.receiveShadow = true
    scene.add(leftWall)

    // Более красивая сетка
    const gridHelper = new THREE.GridHelper(
      Math.max(dimensions.width, dimensions.depth), 
      20, 
      0xbdbdbd, 
      0xe0e0e0
    )
    gridHelper.position.y = 0.001
    scene.add(gridHelper)
  }

  // Настройка обработчиков событий
  const setupEventHandlers = (renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, scene: THREE.Scene) => {
    // Клик по сцене
    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      // Проверяем клик по мебели
      const furnitureObjects = Array.from(furnitureObjectsRef.current.values())
      const intersects = raycaster.intersectObjects(furnitureObjects, true)
      
      if (intersects.length > 0) {
        // Кликнули по мебели
        const clickedObject = intersects[0].object
        const furnitureGroup = clickedObject.parent as THREE.Group
        const furnitureId = furnitureGroup.userData.furnitureId
        
        if (furnitureId) {
          const item = furniture.find(f => f.id === furnitureId)
          if (item) {
            selectFurniture(item)
            if (onItemSelect) onItemSelect(item)
          }
        }
      } else {
        // Кликнули по пустому месту
        selectFurniture(null)
        if (onItemSelect) onItemSelect(null)
      }
    }

    // Drag & Drop
    const handleDrop = (event: DragEvent) => {
      event.preventDefault()
      
      try {
        const itemData = event.dataTransfer?.getData('application/json')
        if (!itemData) return
        
        const item: FurnitureItem = JSON.parse(itemData)
        
        // Получаем позицию drop
        const rect = renderer.domElement.getBoundingClientRect()
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

        const raycaster = new THREE.Raycaster()
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

        const floor = scene.getObjectByName('floor')
        if (floor) {
          const intersects = raycaster.intersectObject(floor)
          if (intersects.length > 0) {
            const point = intersects[0].point
            
            // Создаем новый предмет с уникальным ID
            const newItem: FurnitureItem = {
              ...item,
              id: `${item.id}_${Date.now()}`,
              position: { x: point.x, y: 0, z: point.z }
            }
            
            addFurniture(newItem)
          }
        }
      } catch (error) {
        console.error('Ошибка при размещении предмета:', error)
      }
    }

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
    }

    renderer.domElement.addEventListener('click', handleClick)
    renderer.domElement.addEventListener('drop', handleDrop)
    renderer.domElement.addEventListener('dragover', handleDragOver)
  }

  // Создание 3D объекта мебели
  const createFurnitureObject = (item: FurnitureItem): THREE.Group => {
    const group = new THREE.Group()
    group.userData.furnitureId = item.id

    // Основной объект с тенями
    const geometry = new THREE.BoxGeometry(item.dimensions.width, item.dimensions.height, item.dimensions.depth)
    const material = new THREE.MeshLambertMaterial({ 
      color: selectedItem?.id === item.id ? 0x4dabf7 : 0x8b5cf6 
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = item.dimensions.height / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)

    // Контур для выделения
    if (selectedItem?.id === item.id) {
      const edges = new THREE.EdgesGeometry(geometry)
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 })
      const wireframe = new THREE.LineSegments(edges, lineMaterial)
      wireframe.position.y = item.dimensions.height / 2
      group.add(wireframe)
    }

    // Улучшенный текст с ценой
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 512
    canvas.height = 128
    
    // Фон с градиентом
    const gradient = context.createLinearGradient(0, 0, 0, 128)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 512, 128)
    
    // Текст
    context.fillStyle = 'white'
    context.font = 'bold 32px Arial'
    context.textAlign = 'center'
    context.fillText(formatPrice(item.price), 256, 70)
    
    // Название предмета (сокращенное)
    context.fillStyle = 'rgba(255, 255, 255, 0.8)'
    context.font = '20px Arial'
    const shortName = item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name
    context.fillText(shortName, 256, 100)

    const texture = new THREE.CanvasTexture(canvas)
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(spriteMaterial)
    sprite.position.y = item.dimensions.height + 0.8
    sprite.scale.set(3, 0.75, 1)
    group.add(sprite)

    // Позиция группы
    group.position.set(item.position.x, item.position.y, item.position.z)
    group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z)

    return group
  }

  // Обновление мебели в сцене
  useEffect(() => {
    if (!sceneRef.current) return

    const scene = sceneRef.current
    
    // Удаляем старые объекты
    furnitureObjectsRef.current.forEach((object, id) => {
      scene.remove(object)
    })
    furnitureObjectsRef.current.clear()

    // Добавляем новые объекты
    furniture.forEach(item => {
      const object = createFurnitureObject(item)
      scene.add(object)
      furnitureObjectsRef.current.set(item.id, object)
    })
  }, [furniture, selectedItem])

  return (
    <div className={className}>
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Информация */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded text-sm">
        <div className="font-bold">Рабочая 3D сцена</div>
        <div className="text-xs opacity-80">Intel GPU оптимизация</div>
        <div className="text-xs opacity-60 mt-1">
          Перетащите мебель из каталога • Кликните для выбора
        </div>
        <div className="text-xs opacity-60">
          Предметов: {furniture.length}
        </div>
      </div>
    </div>
  )
}