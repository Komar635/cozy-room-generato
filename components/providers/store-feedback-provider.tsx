'use client'

import { useEffect, useRef } from 'react'
import { useRoomStore } from '@/store/room-store'
import { useToast } from '@/components/ui/toast'

export function StoreFeedbackProvider() {
  const notifications = useRoomStore((state) => state.notifications)
  const removeNotification = useRoomStore((state) => state.removeNotification)
  const { addToast } = useToast()
  const processedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    notifications.forEach((notification) => {
      if (processedIds.current.has(notification.id)) {
        return
      }

      processedIds.current.add(notification.id)
      addToast({
        type: notification.type,
        title: notification.title,
        description: notification.message,
        duration: notification.duration,
      })

      removeNotification(notification.id)
    })
  }, [notifications, addToast, removeNotification])

  return null
}
