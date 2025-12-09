/**
 * Zustand store.
 * Управляет состоянием приложения и синхронизацией с API.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as api from '../api/client'

export const useStore = create(
  persist(
    (set, get) => ({
      // =============================================
      // AUTH STATE
      // =============================================
      token: null,
      userId: null,
      recoveryCode: null,
      isLoading: true,
      isAuthenticated: false,
      
      // =============================================
      // USER PROFILE
      // =============================================
      profile: null,
      isOnboarding: true,
      
      // =============================================
      // DATA
      // =============================================
      checkins: [],
      streak: { current: 0, best: 0, lastCheckinDate: null },
      moneySettings: {
        enabled: false,
        averageAmount: 0,
        showSaved: true,
        trackLosses: false,
      },
      moneyHistory: [],
      thoughtEntries: [],
      
      // =============================================
      // TELEGRAM
      // =============================================
      tg: null,
      
      setTg: (tg) => set({ tg }),
      
      // =============================================
      // AUTH ACTIONS
      // =============================================
      
      /**
       * Авторизация через Telegram initData.
       */
      login: async (initData) => {
        set({ isLoading: true })
        try {
          const result = await api.verifyAuth(initData)
          
          set({
            token: result.token,
            userId: result.user_id,
            recoveryCode: result.recovery_code || null,
            isAuthenticated: true,
            isLoading: false,
          })
          
          // Загружаем данные пользователя
          await get().loadUserData()
          
          return result
        } catch (error) {
          console.error('Login failed:', error)
          set({ isLoading: false })
          throw error
        }
      },
      
      /**
       * Восстановление по коду.
       */
      recover: async (code) => {
        set({ isLoading: true })
        try {
          const result = await api.recoverAccount(code)
          
          set({
            token: result.token,
            userId: result.user_id,
            isAuthenticated: true,
            isLoading: false,
          })
          
          await get().loadUserData()
          
          return result
        } catch (error) {
          console.error('Recovery failed:', error)
          set({ isLoading: false })
          throw error
        }
      },
      
      /**
       * Загрузка данных пользователя после авторизации.
       */
      loadUserData: async () => {
        try {
          // Загружаем профиль
          const me = await api.getMe()
          
          set({
            profile: me,
            recoveryCode: me.recoveryCode,
            streak: me.streak || { current: 0, best: 0, lastCheckinDate: null },
            isOnboarding: !me.onboardingCompleted,
          })
          
          // Загружаем настройки финансов
          try {
            const moneySettings = await api.getMoneySettings()
            set({ moneySettings })
          } catch (e) {
            console.log('Money settings not available')
          }
          
          // Загружаем чек-ины
          try {
            const checkins = await api.getCheckins(7)
            set({ checkins })
          } catch (e) {
            console.log('Checkins not available')
          }
          
        } catch (error) {
          console.error('Failed to load user data:', error)
        }
      },
      
      /**
       * Выход (сброс состояния).
       */
      logout: () => {
        localStorage.removeItem('tochka-opory-storage')
        set({
          token: null,
          userId: null,
          recoveryCode: null,
          isAuthenticated: false,
          profile: null,
          isOnboarding: true,
          checkins: [],
          streak: { current: 0, best: 0, lastCheckinDate: null },
          moneySettings: {
            enabled: false,
            averageAmount: 0,
            showSaved: true,
            trackLosses: false,
          },
          thoughtEntries: [],
        })
      },
      
      // =============================================
      // ONBOARDING ACTIONS
      // =============================================
      
      /**
       * Установка трека (gambling/trading/digital).
       */
      setTrack: async (track) => {
        try {
          await api.setTrack(track)
          set((state) => ({
            profile: state.profile ? { ...state.profile, track } : null,
          }))
        } catch (error) {
          console.error('Failed to set track:', error)
          throw error
        }
      },
      
      /**
       * Завершение онбординга.
       */
      completeOnboarding: async (scores) => {
        set((state) => ({
          isOnboarding: false,
          profile: state.profile ? {
            ...state.profile,
            onboardingCompleted: true,
            scores,
          } : null,
        }))
      },
      
      // =============================================
      // CHECKIN ACTIONS
      // =============================================
      
      /**
       * Создание чек-ина.
       */
      addCheckin: async (data) => {
        try {
          const result = await api.createCheckin(data)
          
          // Обновляем локальное состояние
          set((state) => ({
            checkins: [result, ...state.checkins].slice(0, 30),
            streak: {
              current: result.newStreak,
              best: Math.max(state.streak.best, result.newStreak),
              lastCheckinDate: result.date,
            },
          }))
          
          return result
        } catch (error) {
          console.error('Failed to create checkin:', error)
          throw error
        }
      },
      
      // =============================================
      // MONEY ACTIONS
      // =============================================
      
      /**
       * Обновление настроек финансов.
       */
      updateMoneySettings: async (settings) => {
        try {
          const result = await api.updateMoneySettings(settings)
          set({ moneySettings: result })
          return result
        } catch (error) {
          console.error('Failed to update money settings:', error)
          throw error
        }
      },
      
      /**
       * Добавление записи о потере.
       */
      addMoneyEntry: async (entry) => {
        try {
          const result = await api.addMoneyEntry(entry)
          set((state) => ({
            moneyHistory: [result, ...state.moneyHistory],
          }))
          return result
        } catch (error) {
          console.error('Failed to add money entry:', error)
          throw error
        }
      },
      
      // =============================================
      // DIARY ACTIONS
      // =============================================
      
      /**
       * Загрузка записей дневника.
       */
      loadThoughtEntries: async () => {
        try {
          const entries = await api.getThoughtEntries()
          set({ thoughtEntries: entries })
          return entries
        } catch (error) {
          console.error('Failed to load thought entries:', error)
          return []
        }
      },
      
      /**
       * Добавление записи в дневник.
       */
      addThoughtEntry: async (entry) => {
        try {
          const result = await api.createThoughtEntry(entry)
          set((state) => ({
            thoughtEntries: [result, ...state.thoughtEntries],
          }))
          return result
        } catch (error) {
          console.error('Failed to add thought entry:', error)
          throw error
        }
      },
      
      /**
       * Удаление записи из дневника.
       */
      deleteThoughtEntry: async (id) => {
        try {
          await api.deleteThoughtEntry(id)
          set((state) => ({
            thoughtEntries: state.thoughtEntries.filter((e) => e.id !== id),
          }))
        } catch (error) {
          console.error('Failed to delete thought entry:', error)
          throw error
        }
      },
      
      // =============================================
      // UTILITY
      // =============================================
      
      /**
       * Сброс прогресса (полный выход).
       */
      resetProgress: () => {
        if (confirm('Вы уверены? Это сотрёт все локальные данные.')) {
          get().logout()
          window.location.reload()
        }
      },
    }),
    {
      name: 'tochka-opory-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        recoveryCode: state.recoveryCode,
        isAuthenticated: state.isAuthenticated,
        profile: state.profile,
        isOnboarding: state.isOnboarding,
        streak: state.streak,
        moneySettings: state.moneySettings,
      }),
    }
  )
)
