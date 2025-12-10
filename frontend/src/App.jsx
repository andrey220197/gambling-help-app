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

// Loading Screen with debug info
function LoadingScreen({ debug }) {
  const handleReset = () => {
    localStorage.removeItem('tochka-opory-storage')
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <span className="text-3xl">🎯</span>
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">Точка опоры</h1>
      <p className="text-slate-500 text-sm mb-4">Загрузка...</p>
      {debug && (
        <div className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg max-w-xs break-all mb-4">
          {debug}
        </div>
      )}
      <button 
        onClick={handleReset}
        className="text-xs text-slate-400 underline"
      >
        Сбросить данные
      </button>
    </div>
  )
}

// Not in Telegram Screen
function NotInTelegramScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">📱</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-3">Точка опоры</h1>
      <p className="text-slate-500 mb-6 max-w-sm">
        Это приложение работает только внутри Telegram.
        Откройте бота @mindbalance_ru_bot и нажмите кнопку "Открыть приложение".
      </p>
      <a
        href="https://t.me/mindbalance_ru_bot"
        className="bg-brand-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-700 transition-colors"
      >
        Открыть в Telegram
      </a>
    </div>
  )
}

function App() {
  const {
    isOnboarding, isAuthenticated, isLoading,
    login, loadUserData, token
  } = useStore()
  const [appReady, setAppReady] = useState(false)
  const [notInTelegram, setNotInTelegram] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

  // Initialize Telegram WebApp
  useTelegram()

  // Auth flow
  useEffect(() => {
    const initAuth = async () => {
      const tg = window.Telegram?.WebApp
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

      // Debug info
      const hasInitData = tg?.initData ? 'yes(' + tg.initData.length + ')' : 'no'
      const hasToken = token ? 'yes' : 'no'
      setDebugInfo('TG:' + (tg ? 'yes' : 'no') + ' data:' + hasInitData + ' token:' + hasToken)

      // Если уже есть токен в store
      if (token && isAuthenticated) {
        setDebugInfo(prev => prev + ' loading...')
        try {
          await loadUserData()
          setDebugInfo(prev => prev + ' OK')
        } catch (error) {
          console.error('Failed to load user data:', error)
          setDebugInfo(prev => prev + ' ERR:' + error.message)
        }
        setAppReady(true)
        return
      }

      // Получаем initData от Telegram
      let initData = tg?.initData || ''

      // Debug mode
      if (!initData && isLocalhost) {
        initData = 'debug'
      }

      // Если нет initData и не localhost
      if (!initData && !isLocalhost) {
        await new Promise(r => setTimeout(r, 500))
        const tgRetry = window.Telegram?.WebApp
        initData = tgRetry?.initData || ''

        const hasInitDataRetry = tgRetry?.initData ? 'yes(' + tgRetry.initData.length + ')' : 'no'
        setDebugInfo(prev => prev + ' retry:' + hasInitDataRetry)

        if (!initData) {
          setNotInTelegram(true)
          setAppReady(true)
          return
        }
      }

      if (initData) {
        try {
          setDebugInfo(prev => prev + ' auth...')
          await login(initData)
          setDebugInfo(prev => prev + ' OK')
        } catch (error) {
          console.error('Auth failed:', error)
          setDebugInfo(prev => prev + ' ERR:' + error.message)
        }
      }

      setAppReady(true)
    }

    const timer = setTimeout(initAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  if (notInTelegram && !isAuthenticated) {
    return <NotInTelegramScreen />
  }

  if (!appReady || isLoading) {
    return <LoadingScreen debug={debugInfo} />
  }

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route
            path="/onboarding"
            element={
              !isOnboarding && isAuthenticated
                ? <Navigate to="/" replace />
                : <Onboarding />
            }
          />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/checkin" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/sos" element={<ProtectedRoute><SOS /></ProtectedRoute>} />
          <Route path="/articles" element={<ProtectedRoute><Articles /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute><ThoughtDiary /></ProtectedRoute>} />
          <Route path="/diary/new" element={<ProtectedRoute><ThoughtEntry /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
