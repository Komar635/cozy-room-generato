'use client'

import React, { useEffect, useCallback } from 'react'
import { useRoomStore } from '@/store/room-store'
import { useThemeStore } from '@/lib/theme'

const SHORTCUTS_HELP_EVENT = 'room-designer:toggle-shortcuts-help'

const isEditableElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

const triggerShortcutsHelp = () => {
  window.dispatchEvent(new CustomEvent(SHORTCUTS_HELP_EVENT))
}

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  description: string
}

const defaultShortcuts: KeyboardShortcut[] = [
  {
    key: 'z',
    ctrl: true,
    handler: () => {
      const { undo, canUndo } = useRoomStore.getState()
      if (canUndo()) {
        undo()
      }
    },
    description: 'Отменить действие',
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    handler: () => {
      const { redo, canRedo } = useRoomStore.getState()
      if (canRedo()) {
        redo()
      }
    },
    description: 'Повторить действие',
  },
  {
    key: 'Delete',
    handler: () => {
      const { selectedItem, removeFurniture } = useRoomStore.getState()
      if (selectedItem) {
        removeFurniture(selectedItem.id)
      }
    },
    description: 'Удалить выбранный предмет',
  },
  {
    key: 'd',
    ctrl: true,
    handler: () => {
      const { selectedItem, copyFurniture } = useRoomStore.getState()
      if (selectedItem) {
        copyFurniture(selectedItem.id)
      }
    },
    description: 'Дублировать выбранный предмет',
  },
  {
    key: 'Escape',
    handler: () => {
      useRoomStore.getState().selectFurniture(null)
    },
    description: 'Отменить выбор',
  },
  {
    key: 's',
    ctrl: true,
    handler: () => {
      useRoomStore.getState().saveProject()
    },
    description: 'Сохранить проект',
  },
  {
    key: 'n',
    ctrl: true,
    handler: () => {
      useRoomStore.getState().createNewProject('Новый проект')
    },
    description: 'Новый проект',
  },
  {
    key: 't',
    ctrl: true,
    handler: () => {
      const { resolvedTheme, setTheme } = useThemeStore.getState()
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    },
    description: 'Переключить тему',
  },
  {
    key: '?',
    shift: true,
    handler: () => {
      triggerShortcutsHelp()
    },
    description: 'Показать горячие клавиши',
  },
]

export function useKeyboardShortcuts(customShortcuts?: KeyboardShortcut[]) {
  const shortcuts = customShortcuts || defaultShortcuts

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isEditableElement(event.target) && event.key !== 'Escape') {
      return
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey
      const altMatches = shortcut.alt ? event.altKey : !event.altKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault()
        shortcut.handler()
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function KeyboardShortcutsHelp() {
  const shortcuts = defaultShortcuts

  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <p className="mb-2 font-medium text-foreground">Горячие клавиши</p>
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5">
          <span>{shortcut.description}</span>
          <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-mono text-foreground shadow-sm">
            {shortcut.ctrl ? 'Ctrl+' : ''}
            {shortcut.shift ? 'Shift+' : ''}
            {shortcut.alt ? 'Alt+' : ''}
            {shortcut.key}
          </kbd>
        </div>
      ))}
    </div>
  )
}

export { SHORTCUTS_HELP_EVENT }
