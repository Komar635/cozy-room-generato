'use client'

import { useRef, useState, useEffect } from 'react'
import { useRoomStore } from '@/store/room-store'
import { RoomProject } from '@/types/room'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { AsyncButton } from '../ui/loading'
import { useToast } from '../ui/toast'
import { Download, FolderOpen, HardDriveDownload, ImageIcon, Plus, Save } from 'lucide-react'

const LOCAL_STORAGE_KEY = 'room_designer_projects'
const CURRENT_PROJECT_KEY = 'room_designer_current'

interface ProjectManagerProps {
  onExportImage?: () => string | null
}

export default function ProjectManager({ onExportImage }: ProjectManagerProps) {
  const {
    currentProject,
    roomDimensions,
    furniture,
    budget,
    selectedStyle,
    spentAmount,
    createNewProject,
    loadProject,
    saveProject,
    loadingState
  } = useRoomStore()
  const { addToast } = useToast()

  const [projectName, setProjectName] = useState(currentProject?.name || 'Мой проект')
  const [savedProjects, setSavedProjects] = useState<RoomProject[]>([])
  const [isFileSaving, setIsFileSaving] = useState(false)
  const [isFileLoading, setIsFileLoading] = useState(false)
  const [isImageExporting, setIsImageExporting] = useState(false)
  const [isListExporting, setIsListExporting] = useState(false)
  const [isLocalSaving, setIsLocalSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    wallColor,
    floorColor,
    accentColor,
    ambientIntensity,
    directionalIntensity,
    lightWarmth
  } = useRoomStore()

  useEffect(() => {
    loadSavedProjectsList()
  }, [])

  const loadSavedProjectsList = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const projects = JSON.parse(stored) as RoomProject[]
        setSavedProjects(projects)
      }
    } catch {
      setSavedProjects([])
    }
  }

  const handleSaveToFile = async () => {
    setIsFileSaving(true)

    const projectData: RoomProject = {
      id: currentProject?.id || `project_${Date.now()}`,
      name: projectName,
      roomDimensions,
      furniture,
      budget,
      style: selectedStyle,
      createdAt: currentProject?.createdAt || new Date(),
      updatedAt: new Date()
    }

    try {
      const json = JSON.stringify(projectData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      addToast({ type: 'success', title: 'Файл сохранён', description: 'Проект экспортирован в JSON.' })
    } finally {
      setIsFileSaving(false)
    }
  }

  const handleLoadFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsFileLoading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target?.result as string) as RoomProject
        loadProject(projectData)
        setProjectName(projectData.name)
        addToast({ type: 'success', title: 'Проект загружен', description: `Открыт проект "${projectData.name}".` })
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error)
        addToast({ type: 'error', title: 'Ошибка загрузки', description: 'Не удалось прочитать файл проекта.' })
      } finally {
        setIsFileLoading(false)
        event.target.value = ''
      }
    }
    reader.onerror = () => {
      setIsFileLoading(false)
      addToast({ type: 'error', title: 'Ошибка загрузки', description: 'Файл не удалось прочитать.' })
      event.target.value = ''
    }
    reader.readAsText(file)
  }

  const handleExportImage = async () => {
    setIsImageExporting(true)

    if (onExportImage) {
      const imageData = onExportImage()
      if (imageData) {
        const a = document.createElement('a')
        a.href = imageData
        a.download = `${projectName}_3d_view_${new Date().toISOString().split('T')[0]}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        addToast({ type: 'success', title: 'Изображение экспортировано', description: 'PNG с 3D сценой готов.' })
      } else {
        addToast({ type: 'warning', title: 'Экспорт недоступен', description: 'Не удалось получить изображение сцены.' })
      }
    }

    setIsImageExporting(false)
  }

  const handleExportFurnitureList = async () => {
    setIsListExporting(true)

    const totalCost = furniture.reduce((sum, item) => sum + item.price, 0)
    
    let text = `Список мебели: ${projectName}\n`
    text += `Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}\n`
    text += `${'='.repeat(40)}\n\n`

    furniture.forEach((item, index) => {
      text += `${index + 1}. ${item.name}\n`
      text += `   Категория: ${item.category}\n`
      text += `   Цена: ${item.price.toLocaleString('ru-RU')} ₽\n`
      if (item.color) text += `   Цвет: ${item.color}\n`
      text += '\n'
    })

    text += `${'='.repeat(40)}\n`
    text += `ИТОГО: ${totalCost.toLocaleString('ru-RU')} ₽\n`
    text += `Бюджет: ${budget.toLocaleString('ru-RU')} ₽\n`
    text += `Остаток: ${(budget - totalCost).toLocaleString('ru-RU')} ₽\n`

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}_furniture_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addToast({ type: 'success', title: 'Список экспортирован', description: 'TXT со списком мебели сохранён.' })
    setIsListExporting(false)
  }

  const handleNewProject = () => {
    const name = prompt('Введите название проекта:', 'Новый проект')
    if (name) {
      createNewProject(name)
      setProjectName(name)
      addToast({ type: 'info', title: 'Создан новый проект', description: `Текущий проект: "${name}".` })
    }
  }

  const handleLocalSave = async () => {
    setIsLocalSaving(true)

    const projectData: RoomProject = {
      id: currentProject?.id || `project_${Date.now()}`,
      name: projectName,
      roomDimensions,
      furniture,
      budget,
      style: selectedStyle,
      createdAt: currentProject?.createdAt || new Date(),
      updatedAt: new Date(),
      wallColor,
      floorColor,
      accentColor,
      ambientIntensity,
      directionalIntensity,
      lightWarmth
    }
    
    localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(projectData))
    
    const existing = savedProjects.filter(p => p.id !== projectData.id)
    const updated = [projectData, ...existing].slice(0, 10)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    setSavedProjects(updated)

    addToast({ type: 'success', title: 'Сохранено в браузере', description: 'Проект доступен в локальном списке.' })
    setIsLocalSaving(false)
  }

  const handleLocalLoad = (project?: RoomProject) => {
    const toLoad = project || JSON.parse(localStorage.getItem(CURRENT_PROJECT_KEY) || 'null') as RoomProject | null
    if (toLoad) {
      loadProject(toLoad)
      setProjectName(toLoad.name)
      addToast({ type: 'success', title: 'Локальный проект загружен', description: `Открыт проект "${toLoad.name}".` })
    } else if (!project) {
      addToast({ type: 'warning', title: 'Нет сохранений', description: 'В браузере пока нет проекта для загрузки.' })
    }
  }

  const handleDeleteProject = (projectId: string) => {
    const updated = savedProjects.filter(p => p.id !== projectId)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated))
    setSavedProjects(updated)
    addToast({ type: 'info', title: 'Проект удалён', description: 'Локальное сохранение удалено из списка.' })
  }

  return (
    <Card className="w-full border-border/70 bg-card/90 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.9)] animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Управление проектом</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Название проекта</Label>
          <Input
            id="project-name"
            data-testid="project-name-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Название проекта"
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Файл проекта</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <AsyncButton size="sm" onClick={handleNewProject} className="justify-start">
              <Plus className="h-4 w-4" />
              Новый
            </AsyncButton>
            <AsyncButton size="sm" variant="outline" onClick={handleSaveToFile} loading={isFileSaving} loadingText="Сохранение..." className="justify-start">
              <Save className="h-4 w-4" />
              Сохранить
            </AsyncButton>
            <AsyncButton size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} loading={isFileLoading} loadingText="Загрузка..." className="justify-start">
              <FolderOpen className="h-4 w-4" />
              Загрузить
            </AsyncButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleLoadFromFile}
              className="hidden"
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Локальное сохранение</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AsyncButton size="sm" variant="secondary" onClick={() => handleLocalSave()} loading={isLocalSaving} loadingText="Сохраняем..." className="justify-start" data-testid="project-local-save-button">
              <HardDriveDownload className="h-4 w-4" />
              В браузере
            </AsyncButton>
            <AsyncButton size="sm" variant="secondary" onClick={() => handleLocalLoad()} className="justify-start" data-testid="project-local-load-button">
              <FolderOpen className="h-4 w-4" />
              Загрузить
            </AsyncButton>
          </div>
        </div>

        {savedProjects.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Сохранённые проекты</Label>
            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
              {savedProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-2 text-xs transition-colors hover:bg-muted/70" data-testid={`saved-project-${project.id}`}>
                  <button
                    type="button"
                    className="flex-1 text-left hover:underline"
                    onClick={() => handleLocalLoad(project)}
                    data-testid={`saved-project-load-${project.id}`}
                  >
                    {project.name}
                  </button>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 ml-2"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Экспорт</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AsyncButton size="sm" onClick={handleExportImage} disabled={!onExportImage} loading={isImageExporting} loadingText="Экспорт..." className="justify-start">
              <ImageIcon className="h-4 w-4" />
              3D изображение
            </AsyncButton>
            <AsyncButton size="sm" variant="outline" onClick={handleExportFurnitureList} disabled={furniture.length === 0} loading={isListExporting} loadingText="Экспорт..." className="justify-start">
              <Download className="h-4 w-4" />
              Список мебели
            </AsyncButton>
          </div>
        </div>

        <Separator />

        <AsyncButton
          className="w-full justify-center"
          onClick={() => saveProject()}
          loading={loadingState.isLoading}
          loadingText={loadingState.message || 'Сохраняем...'}
          data-testid="project-save-api-button"
        >
          <Save className="h-4 w-4" />
          Сохранить через API
        </AsyncButton>

        {furniture.length > 0 && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p data-testid="project-furniture-count">Предметов: {furniture.length}</p>
              <p data-testid="project-total-cost">Общая стоимость: {spentAmount.toLocaleString('ru-RU')} ₽</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
