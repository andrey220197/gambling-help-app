/**
 * Хуки для работы с Telegram WebApp.
 */

import { useEffect } from 'react'
import { useStore } from '../store/useStore'

/**
 * Инициализация Telegram WebApp.
 */
export function useTelegram() {
  const { setTg, tg } = useStore()
  
  useEffect(() => {
    const telegram = window.Telegram?.WebApp
    if (telegram) {
      telegram.ready()
      telegram.expand()
      setTg(telegram)
    }
  }, [setTg])
  
  return tg
}

/**
 * Хаптическая обратная связь.
 */
export function useHaptic() {
  const haptic = (style = 'selection') => {
    const tg = window.Telegram?.WebApp
    if (!tg?.HapticFeedback) return
    
    switch (style) {
      case 'selection':
        tg.HapticFeedback.selectionChanged()
        break
      case 'light':
      case 'medium':
      case 'heavy':
      case 'rigid':
      case 'soft':
        tg.HapticFeedback.impactOccurred(style)
        break
      case 'success':
      case 'warning':
      case 'error':
        tg.HapticFeedback.notificationOccurred(style)
        break
      default:
        tg.HapticFeedback.selectionChanged()
    }
  }
  
  return haptic
}

/**
 * Вспомогательная функция для вызова хаптиков без хука.
 */
export function triggerHaptic(style = 'selection') {
  const tg = window.Telegram?.WebApp
  if (!tg?.HapticFeedback) return
  
  switch (style) {
    case 'selection':
      tg.HapticFeedback.selectionChanged()
      break
    case 'light':
    case 'medium':
    case 'heavy':
    case 'rigid':
    case 'soft':
      tg.HapticFeedback.impactOccurred(style)
      break
    case 'success':
    case 'warning':
    case 'error':
      tg.HapticFeedback.notificationOccurred(style)
      break
    default:
      tg.HapticFeedback.selectionChanged()
  }
}
