/**
 * Главный компонент приложения.
 */

import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import { useTelegram } from './hooks/useTelegram'
import { Layout } from './components/Layout'

// Screens
import { Onboarding } from './screens/Onboarding'
import { Home } from './screens/Home'
import { CheckIn } from './screens/CheckIn'
import { Profile } from './screens/Profile'
import { SOS } from './screens/SOS'
import { Articles } from './screens/Articles'
import { ThoughtDiary } from './screens/ThoughtDiary'
import { ThoughtEntry } from './screens/ThoughtEntry'

// Protected Route
function ProtectedRoute({ children }) {
  const { isOnboarding, isAuthenticated } = useStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />
  }
  
  if (isOnboarding) {
    return <Navigate to="/onboarding" replace />
  }
  
  return <>{children}</>
}

// Loading Screen
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <span className="text-3xl">🎯</span>
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">Точка опоры</h1>
      <p className="text-slate-500 text-sm">Загрузка...</p>
    </div>
  )
}

function App() {
  const { 
    isOnboarding, isAuthenticated, isLoading, 
    login, loadUserData, token 
  } = useStore()
  const [appReady, setAppReady] = useState(false)
  
  // Initialize Telegram WebApp
  useTelegram()

  // Auth flow
  useEffect(() => {
    const initAuth = async () => {
      // Если уже есть токен в store, проверяем данные
      if (token && isAuthenticated) {
        try {
          await loadUserData()
        } catch (error) {
          console.error('Failed to load user data:', error)
        }
        setAppReady(true)
        return
      }
      
      // Получаем initData от Telegram
      const tg = window.Telegram?.WebApp
      let initData = tg?.initData || ''
      
      // Debug mode
      if (!initData && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        initData = 'debug'
      }
      
      if (initData) {
        try {
          await login(initData)
        } catch (error) {
          console.error('Auth failed:', error)
        }
      }
      
      setAppReady(true)
    }
    
    initAuth()
  }, [])

  // Show loading while initializing
  if (!appReady || isLoading) {
    return <LoadingScreen />
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          {/* Onboarding */}
          <Route 
            path="/onboarding" 
            element={
              !isOnboarding && isAuthenticated 
                ? <Navigate to="/" replace /> 
                : <Onboarding />
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkin" 
            element={
              <ProtectedRoute>
                <CheckIn />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/sos" 
            element={
              <ProtectedRoute>
                <SOS />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/articles" 
            element={
              <ProtectedRoute>
                <Articles />
              </ProtectedRoute>
            } 
          />
          
          {/* Diary Routes */}
          <Route 
            path="/diary" 
            element={
              <ProtectedRoute>
                <ThoughtDiary />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/diary/new" 
            element={
              <ProtectedRoute>
                <ThoughtEntry />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
