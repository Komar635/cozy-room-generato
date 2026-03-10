'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useRef, useEffect } from 'react'
import * as THREE from 'three'

// Специальная версия для Intel GPU
export default function IntelCompatibleCanvas() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Создаем сцену напрямую через Three.js (без react-three-fiber)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000)
    
    // Настройки рендерера для Intel GPU
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false,  // Отключаем антиалиасинг для Intel
      alpha: false,
      powerPreference: 'default', // Не форсируем высокую производительность
      precision: 'lowp'  // Низкая точность для Intel
    })
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.setClearColor(0x222222)
    mountRef.current.appendChild(renderer.domElement)

    // Фиксированная позиция камеры
    camera.position.set(10, 8, 10)
    camera.lookAt(0, 0, 0)

    // Простое освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Простая геометрия
    const floorGeometry = new THREE.PlaneGeometry(8, 8)
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    scene.add(floor)

    // Стены
    const wallGeometry = new THREE.PlaneGeometry(8, 3)
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff })
    
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial)
    backWall.position.set(0, 1.5, -4)
    scene.add(backWall)
    
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial)
    leftWall.position.set(-4, 1.5, 0)
    leftWall.rotation.y = Math.PI / 2
    scene.add(leftWall)

    // Массив для хранения мебели
    const furnitureObjects: THREE.Mesh[] = []

    // Функция добавления мебели
    const addFurniture = (position: { x: number, y: number, z: number }) => {
      const furnitureGeometry = new THREE.BoxGeometry(1, 0.8, 0.6)
      const furnitureMaterial = new THREE.MeshLambertMaterial({ 
        color: Math.random() * 0xffffff // Случайный цвет
      })
      const furniture = new THREE.Mesh(furnitureGeometry, furnitureMaterial)
      furniture.position.set(position.x, position.y, position.z)
      scene.add(furniture)
      furnitureObjects.push(furniture)
    }

    // Обработчик клика для добавления мебели
    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera)

      const intersects = raycaster.intersectObject(floor)
      if (intersects.length > 0) {
        const point = intersects[0].point
        addFurniture({ x: point.x, y: 0.4, z: point.z })
      }
    }

    renderer.domElement.addEventListener('click', handleClick)

    // Простая анимация
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      // Медленное вращение всех предметов мебели
      furnitureObjects.forEach(furniture => {
        furniture.rotation.y += 0.005
      })
      
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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('click', handleClick)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div className="w-full h-full bg-gray-900 relative">
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Информация */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded text-sm">
        <div className="font-bold">Intel GPU Compatible Mode</div>
        <div className="text-xs opacity-80">Оптимизировано для Intel UHD Graphics</div>
        <div className="text-xs opacity-60 mt-1">Кликните по полу для добавления мебели</div>
      </div>
    </div>
  )
}