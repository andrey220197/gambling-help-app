/**
 * Экран профиля.
 */

import React, { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { MoneySettings } from '../components/MoneySettings'
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell 
} from 'recharts'
import { 
  Settings, LogOut, Copy, Upload, Check, AlertCircle, 
  Wallet, ChevronDown, ChevronUp, BarChart2 
} from 'lucide-react'
import { Button } from '../components/Button'
import { TRACK_NAMES, TRACK_EMOJIS } from '../constants'
import * as api from '../api/client'
import { triggerHaptic } from '../hooks/useTelegram'

// Base64 helpers
const toBase64 = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch (e) {
    return ''
  }
}

const fromBase64 = (str) => {
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch (e) {
    return null
  }
}

export function Profile() {
  const { 
    profile, checkins, resetProgress, streak,
    moneySettings, recoveryCode
  } = useStore()
  
  const [showImportInput, setShowImportInput] = useState(false)
  const [importString, setImportString] = useState('')
  const [statusMsg, setStatusMsg] = useState(null)
  const [showMoneySettings, setShowMoneySettings] = useState(false)
  const [moneyStats, setMoneyStats] = useState(null)

  // Загружаем статистику финансов
  useEffect(() => {
    api.getMoneyStats()
      .then(stats => setMoneyStats(stats))
      .catch(() => {})
  }, [])

  // Подготовка данных для графика - всегда 7 дней
  const chartData = (() => {
    const result = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' })

      // Ищем чек-ин за этот день
      const checkin = checkins.find(c => c.date === dateStr)

      result.push({
        name: dayName,
        value: checkin?.urge || 0
      })
    }
    return result
  })()

  // Форматирование денег
  const formatMoney = (val) => {
    return new Intl.NumberFormat('ru-RU').format(val)
  }

  // Сэкономлено
  const savedTotal = moneySettings?.enabled 
    ? (streak?.current || 0) * (moneySettings.averageAmount || 0)
    : 0

  // Потери
  const lostTotal = moneyStats?.lostTotal || 0

  // Экспорт данных
  const handleExport = () => {
    const rawData = localStorage.getItem('tochka-opory-storage')
    if (rawData) {
      const encoded = toBase64(rawData)
      if (!encoded) {
        setStatusMsg({ type: 'error', text: 'Ошибка кодирования данных' })
        return
      }

      navigator.clipboard.writeText(encoded).then(() => {
        triggerHaptic('success')
        setStatusMsg({ type: 'success', text: 'Код скопирован! Сохраните его в "Избранном" Telegram.' })
        setTimeout(() => setStatusMsg(null), 4000)
      })
    }
  }

  // Импорт данных
  const handleImport = () => {
    if (!importString) return
    
    const decoded = fromBase64(importString)
    if (!decoded) {
      setStatusMsg({ type: 'error', text: 'Ошибка: Неверный формат кода (Base64).' })
      triggerHaptic('error')
      return
    }

    try {
      const parsed = JSON.parse(decoded)
      if (!parsed.state) {
        throw new Error('Invalid structure')
      }
      
      localStorage.setItem('tochka-opory-storage', decoded)
      triggerHaptic('success')
      setStatusMsg({ type: 'success', text: 'Данные восстановлены! Обновляем...' })
      setTimeout(() => window.location.reload(), 1500)
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Ошибка: Структура данных повреждена.' })
      triggerHaptic('error')
    }
  }

  const track = profile?.track || 'gambling'

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold text-slate-800">Профиль</h1>
        <button 
          onClick={resetProgress} 
          className="p-2 text-slate-400 hover:text-rose-500"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-3xl shadow-sm">
          {TRACK_EMOJIS[track] || '🎰'}
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">
            {TRACK_NAMES[track] || 'Азартные игры'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            В приложении <span className="text-brand-600">{streak?.current || 0} дней</span>
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wide">
            Рекорд серии
          </div>
          <div className="text-3xl font-bold text-brand-600">
            {streak?.best || 0} <span className="text-sm text-slate-400 font-normal">дн.</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wide">
            Всего чек-инов
          </div>
          <div className="text-3xl font-bold text-slate-700">
            {checkins.length}
          </div>
        </div>
      </div>

      {/* Finance Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button 
          onClick={() => setShowMoneySettings(!showMoneySettings)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wallet className="text-emerald-500" size={20} />
            <span className="font-bold text-slate-800">Финансы</span>
          </div>
          {showMoneySettings 
            ? <ChevronUp size={20} className="text-slate-400"/> 
            : <ChevronDown size={20} className="text-slate-400"/>
          }
        </button>
        
        {showMoneySettings ? (
          <div className="p-5 pt-0 border-t border-slate-100 animate-slide-down">
            <MoneySettings embedded onSave={() => setShowMoneySettings(false)} />
          </div>
        ) : (
          <div className="p-5 pt-0 pb-6 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">Сэкономлено</div>
              <div className="text-lg font-bold text-emerald-600">
                {moneySettings?.enabled ? `~${formatMoney(savedTotal)} ₽` : 'Выкл'}
              </div>
            </div>
            {moneySettings?.trackLosses && (
              <div>
                <div className="text-xs text-slate-400 uppercase font-medium mb-1">Потери (учтённые)</div>
                <div className="text-lg font-bold text-rose-500">
                  -{formatMoney(lostTotal)} ₽
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 text-sm flex items-center gap-2">
          <BarChart2 size={16} className="text-slate-400"/>
          Динамика тяги (7 дней)
        </h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8' }} 
                dy={10} 
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9', radius: 4 }} 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
              />
              <Bar dataKey="value" name="Тяга" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.value >= 7 ? '#f43f5e' : '#0ea5e9'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Settings size={18} className="text-slate-400" />
          Резервное копирование
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Для полной анонимности мы не храним данные на серверах. Если вы удалите приложение или очистите кеш Telegram, прогресс исчезнет. Сохраняйте код восстановления!
        </p>
        
        {/* Recovery Code */}
        {recoveryCode && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-400 uppercase font-medium mb-1">Код восстановления</div>
            <div className="font-mono font-bold text-slate-700 tracking-wider">{recoveryCode}</div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 group"
          >
            <div className="bg-white p-2 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <Copy size={20} className="text-brand-600" />
            </div>
            <span className="text-xs font-bold">Скопировать код</span>
          </button>
          
          <button 
            onClick={() => setShowImportInput(!showImportInput)}
            className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 group"
          >
            <div className="bg-white p-2 rounded-full mb-2 shadow-sm group-hover:scale-110 transition-transform">
              <Upload size={20} className="text-emerald-600" />
            </div>
            <span className="text-xs font-bold">Восстановить</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`p-3 rounded-xl text-sm flex items-center gap-3 animate-fade-in ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
              : 'bg-rose-50 text-rose-700 border border-rose-100'
          }`}>
            {statusMsg.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
        )}

        {/* Import Input */}
        {showImportInput && (
          <div className="space-y-3 pt-4 border-t border-slate-100 animate-slide-down">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Вставьте код восстановления
            </label>
            <textarea 
              value={importString}
              onChange={(e) => setImportString(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
              className="w-full bg-slate-50 rounded-xl p-3 text-xs font-mono h-24 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-600"
            />
            <Button fullWidth onClick={handleImport} disabled={!importString}>
              Применить резервную копию
            </Button>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="text-center pt-4 pb-8">
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Приложение не является заменой медицинской помощи. 
          Горячая линия: <br/> 
          <a href="tel:88002000122" className="text-brand-600 font-bold hover:underline">
            8-800-2000-122
          </a>
        </p>
      </div>
    </div>
  )
}
