/**
 * Экран профиля.
 */

import React, { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { MoneySettings } from '../components/MoneySettings'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  LogOut, Wallet, ChevronDown, ChevronUp, BarChart2, Calendar, Award
} from 'lucide-react'
import { TRACK_NAMES, TRACK_EMOJIS } from '../constants'
import * as api from '../api/client'

const METRICS = [
  { key: 'urge', name: 'Тяга', color: '#f43f5e', bgColor: 'bg-rose-500', lightBg: 'bg-rose-50' },
  { key: 'stress', name: 'Стресс', color: '#f59e0b', bgColor: 'bg-amber-500', lightBg: 'bg-amber-50' },
  { key: 'mood', name: 'Настроение', color: '#10b981', bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50' },
]

const ACHIEVEMENTS = [
  { days: 1, emoji: '🌱', name: 'Первый шаг', desc: 'Начало пути' },
  { days: 3, emoji: '💪', name: '3 дня', desc: 'Набираешь силу' },
  { days: 7, emoji: '🔥', name: 'Неделя', desc: 'Первая неделя!' },
  { days: 14, emoji: '⭐', name: '2 недели', desc: 'Уже привычка' },
  { days: 30, emoji: '🏆', name: 'Месяц', desc: 'Серьёзный результат' },
  { days: 60, emoji: '💎', name: '2 месяца', desc: 'Впечатляет!' },
  { days: 90, emoji: '👑', name: '3 месяца', desc: 'Мастер контроля' },
  { days: 180, emoji: '🎯', name: 'Полгода', desc: 'Невероятно!' },
  { days: 365, emoji: '🏅', name: 'Год', desc: 'Легенда!' },
]

export function Profile() {
  const {
    profile, checkins, resetProgress, streak,
    moneySettings, recoveryCode
  } = useStore()

  const [showMoneySettings, setShowMoneySettings] = useState(false)
  const [moneyStats, setMoneyStats] = useState(null)
  const [activeMetric, setActiveMetric] = useState(0) // 0=urge, 1=stress, 2=mood

  useEffect(() => {
    api.getMoneyStats()
      .then(stats => setMoneyStats(stats))
      .catch(() => {})
  }, [])

  const chartData = (() => {
    const result = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' })
      const checkin = checkins.find(c => c.date && c.date.startsWith(dateStr))

      result.push({
        name: dayName,
        urge: checkin?.urge ?? null,
        stress: checkin?.stress ?? null,
        mood: checkin?.mood ?? null,
      })
    }
    return result
  })()

  const formatMoney = (val) => new Intl.NumberFormat('ru-RU').format(val)
  const savedTotal = moneySettings?.enabled ? (streak?.current || 0) * (moneySettings.averageAmount || 0) : 0
  const lostTotal = moneyStats?.lostTotal || 0
  const track = profile?.track || 'gambling'

  const currentMetric = METRICS[activeMetric]
  const currentStreak = streak?.current || 0
  const bestStreak = streak?.best || 0

  // Календарь за последние 35 дней (5 недель)
  const calendarData = (() => {
    const result = []
    const today = new Date()
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const checkin = checkins.find(c => c.date && c.date.startsWith(dateStr))
      result.push({
        date: dateStr,
        day: date.getDate(),
        hasCheckin: !!checkin,
        relapse: checkin?.relapse || false,
      })
    }
    return result
  })()

  // Достижения
  const unlockedAchievements = ACHIEVEMENTS.filter(a => bestStreak >= a.days)
  const nextAchievement = ACHIEVEMENTS.find(a => bestStreak < a.days)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      return (
        <div className="bg-white p-2 rounded-lg shadow-lg border border-slate-100">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="font-bold" style={{ color: currentMetric.color }}>
            {payload[0].value}/10
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-2xl font-bold text-slate-800">Профиль</h1>
        <button onClick={resetProgress} className="p-2 text-slate-400 hover:text-rose-500">
          <LogOut size={20} />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center text-3xl shadow-sm">
          {TRACK_EMOJIS[track] || '🎰'}
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-lg">{TRACK_NAMES[track] || 'Азартные игры'}</h2>
          <p className="text-slate-500 text-sm font-medium">
            В приложении <span className="text-brand-600">{streak?.current || 0} дней</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wide">Рекорд серии</div>
          <div className="text-3xl font-bold text-brand-600">
            {bestStreak} <span className="text-sm text-slate-400 font-normal">дн.</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wide">Всего чек-инов</div>
          <div className="text-3xl font-bold text-slate-700">{checkins.length}</div>
        </div>
      </div>

      {/* Календарь прогресса */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-slate-400"/>
          Календарь (5 недель)
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarData.map((day, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                day.relapse
                  ? 'bg-rose-100 text-rose-600'
                  : day.hasCheckin
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-50 text-slate-300'
              }`}
              title={day.date}
            >
              {day.day}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-100"></div>
            <span className="text-xs text-slate-500">Чек-ин</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-100"></div>
            <span className="text-xs text-slate-500">Срыв</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-50"></div>
            <span className="text-xs text-slate-500">Нет данных</span>
          </div>
        </div>
      </div>

      {/* Достижения */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-4">
          <Award size={16} className="text-slate-400"/>
          Достижения
        </h3>

        {/* Следующее достижение */}
        {nextAchievement && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl mb-4 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="text-3xl grayscale opacity-50">{nextAchievement.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-slate-700">{nextAchievement.name}</div>
                <div className="text-xs text-slate-500">
                  Ещё {nextAchievement.days - currentStreak} {nextAchievement.days - currentStreak === 1 ? 'день' : 'дней'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-amber-600 font-medium">Прогресс</div>
                <div className="font-bold text-amber-700">{Math.round((currentStreak / nextAchievement.days) * 100)}%</div>
              </div>
            </div>
            <div className="mt-2 h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, (currentStreak / nextAchievement.days) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Полученные достижения */}
        {unlockedAchievements.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {unlockedAchievements.map((achievement) => (
              <div key={achievement.days} className="text-center p-3 bg-slate-50 rounded-xl">
                <div className="text-2xl mb-1">{achievement.emoji}</div>
                <div className="text-xs font-bold text-slate-700">{achievement.name}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400 text-sm">
            Пока нет достижений. Продолжай!
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button onClick={() => setShowMoneySettings(!showMoneySettings)} className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <Wallet className="text-emerald-500" size={20} />
            <span className="font-bold text-slate-800">Финансы</span>
          </div>
          {showMoneySettings ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
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
                <div className="text-xs text-slate-400 uppercase font-medium mb-1">Потери</div>
                <div className="text-lg font-bold text-rose-500">-{formatMoney(lostTotal)} ₽</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BarChart2 size={16} className="text-slate-400"/>
            Динамика (7 дней)
          </h3>
        </div>

        {/* Переключатель метрик */}
        <div className="flex gap-2 mb-4">
          {METRICS.map((metric, idx) => (
            <button
              key={metric.key}
              onClick={() => setActiveMetric(idx)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeMetric === idx
                  ? `${metric.lightBg} border-2`
                  : 'bg-slate-50 text-slate-500 border-2 border-transparent'
              }`}
              style={activeMetric === idx ? { color: metric.color, borderColor: metric.color } : {}}
            >
              {metric.name}
            </button>
          ))}
        </div>

        {/* Столбчатый график */}
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                domain={[0, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#cbd5e1' }}
                width={20}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar
                dataKey={currentMetric.key}
                radius={[6, 6, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry[currentMetric.key] !== null ? currentMetric.color : '#e2e8f0'}
                    opacity={entry[currentMetric.key] !== null ? 0.85 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Средние значения */}
        <div className="flex justify-between mt-4 pt-3 border-t border-slate-100">
          {METRICS.map((metric) => {
            const values = chartData.filter(d => d[metric.key] !== null).map(d => d[metric.key])
            const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '—'
            return (
              <div key={metric.key} className="text-center">
                <div className="text-xs text-slate-400 mb-1">{metric.name}</div>
                <div className="font-bold text-sm" style={{ color: metric.color }}>{avg}</div>
              </div>
            )
          })}
        </div>
      </div>

      {recoveryCode && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="text-xs text-slate-400 uppercase font-medium mb-2">Код восстановления</div>
          <div className="font-mono font-bold text-slate-700 tracking-wider text-lg select-all">{recoveryCode}</div>
          <p className="text-xs text-slate-400 mt-2">Сохраните этот код — он нужен для восстановления аккаунта</p>
        </div>
      )}

      <div className="text-center pt-4 pb-8">
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Приложение не является заменой медицинской помощи. Горячая линия: <br/>
          <a href="tel:88002000122" className="text-brand-600 font-bold hover:underline">8-800-2000-122</a>
        </p>
      </div>
    </div>
  )
}
