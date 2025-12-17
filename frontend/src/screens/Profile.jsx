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
  LogOut, Wallet, ChevronDown, ChevronUp, BarChart2, Calendar, Award, Bell,
  Activity, ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { TRACK_NAMES, TRACK_EMOJIS, getTrackConfig } from '../constants'
import * as api from '../api/client'

const METRICS = [
  { key: 'urge', name: 'Тяга', color: '#f43f5e', bgColor: 'bg-rose-500', lightBg: 'bg-rose-50' },
  { key: 'stress', name: 'Стресс', color: '#f59e0b', bgColor: 'bg-amber-500', lightBg: 'bg-amber-50' },
  { key: 'mood', name: 'Настроение', color: '#10b981', bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50' },
]

const ACHIEVEMENTS = [
  { days: 1, emoji: '🌱', name: 'Первый шаг', desc: 'Первый чек-ин в приложении' },
  { days: 3, emoji: '💪', name: '3 дня', desc: '3 дня подряд без срыва' },
  { days: 7, emoji: '🔥', name: 'Неделя', desc: '7 дней подряд без срыва' },
  { days: 14, emoji: '⭐', name: '2 недели', desc: '14 дней подряд без срыва' },
  { days: 30, emoji: '🏆', name: 'Месяц', desc: '30 дней подряд без срыва' },
  { days: 60, emoji: '💎', name: '2 месяца', desc: '60 дней подряд без срыва' },
  { days: 90, emoji: '👑', name: '3 месяца', desc: '90 дней подряд без срыва' },
  { days: 180, emoji: '🎯', name: 'Полгода', desc: '180 дней подряд без срыва' },
  { days: 365, emoji: '🏅', name: 'Год', desc: '365 дней подряд без срыва' },
]

const REMINDER_HOURS = [
  { value: 8, label: '08:00' },
  { value: 10, label: '10:00' },
  { value: 12, label: '12:00' },
  { value: 14, label: '14:00' },
  { value: 16, label: '16:00' },
  { value: 18, label: '18:00' },
  { value: 20, label: '20:00' },
  { value: 21, label: '21:00' },
  { value: 22, label: '22:00' },
]

export function Profile() {
  const {
    profile, checkins, resetProgress, streak,
    moneySettings, recoveryCode, reminderSettings,
    updateReminderSettings
  } = useStore()

  const [showMoneySettings, setShowMoneySettings] = useState(false)
  const [showReminderSettings, setShowReminderSettings] = useState(false)
  const [moneyStats, setMoneyStats] = useState(null)
  const [activeMetric, setActiveMetric] = useState(0) // 0=urge, 1=stress, 2=mood
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    api.getMoneyStats()
      .then(stats => setMoneyStats(stats))
      .catch(() => {})

    api.getTestAnalytics()
      .then(data => setAnalytics(data))
      .catch(() => {})
  }, [])

  const handleReminderToggle = async () => {
    try {
      await updateReminderSettings(!reminderSettings.enabled, reminderSettings.hour)
    } catch (e) {
      console.error('Failed to update reminder:', e)
    }
  }

  const handleReminderHourChange = async (hour) => {
    try {
      await updateReminderSettings(reminderSettings.enabled, hour)
    } catch (e) {
      console.error('Failed to update reminder hour:', e)
    }
  }

  // Хелпер для локальной даты (без проблем с UTC)
  const toLocalDateStr = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const chartData = (() => {
    const result = []
    const today = new Date()

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = toLocalDateStr(date)
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
  const trackConfig = getTrackConfig(track)

  const currentMetric = METRICS[activeMetric]
  const currentStreak = streak?.current || 0
  const bestStreak = streak?.best || 0

  // Календарь: начинаем с первого чек-ина, показываем до сегодня (макс 56 дней = 8 недель)
  const calendarData = (() => {
    const result = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = toLocalDateStr(today)

    // Находим дату первого чек-ина
    let startDate = new Date(today)
    if (checkins.length > 0) {
      const oldestCheckin = checkins[checkins.length - 1]
      if (oldestCheckin?.date) {
        const firstDate = new Date(oldestCheckin.date)
        firstDate.setHours(0, 0, 0, 0)
        startDate = firstDate
      }
    }

    // Ограничиваем максимум 35 днями от сегодня
    const maxStart = new Date(today)
    maxStart.setDate(maxStart.getDate() - 55)
    if (startDate < maxStart) {
      startDate = maxStart
    }

    // Генерируем дни от startDate до сегодня
    const current = new Date(startDate)
    while (current <= today) {
      const dateStr = toLocalDateStr(current)
      const checkin = checkins.find(c => c.date && c.date.startsWith(dateStr))
      const isToday = dateStr === todayStr
      result.push({
        date: dateStr,
        day: current.getDate(),
        hasCheckin: !!checkin,
        relapse: checkin?.relapse || false,
        isToday,
      })
      current.setDate(current.getDate() + 1)
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
          Календарь ({calendarData.length} {calendarData.length === 1 ? 'день' : calendarData.length < 5 ? 'дня' : 'дней'})
        </h3>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarData.map((day, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all ${
                day.isToday ? 'ring-2 ring-brand-500 ring-offset-1' : ''
              } ${
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
            <div className="w-3 h-3 rounded ring-2 ring-brand-500"></div>
            <span className="text-xs text-slate-500">Сегодня</span>
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
                <div className="text-xs text-slate-500">{nextAchievement.desc}</div>
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
                <div className="text-[10px] text-slate-400 mt-0.5">{achievement.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400 text-sm">
            Пока нет достижений. Продолжай!
          </div>
        )}
      </div>

      {/* Профиль риска */}
      {analytics && (
        <Link to="/analytics" className="block">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Activity size={16} className="text-brand-500"/>
                Профиль риска
              </h3>
              <div className="flex items-center gap-1 text-brand-600 text-xs font-medium">
                <span>Подробнее</span>
                <ChevronRight size={14} />
              </div>
            </div>

            {/* Уровень риска */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${
              analytics.risk_level === 'high' ? 'bg-rose-100 text-rose-700' :
              analytics.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
              analytics.risk_level === 'low' ? 'bg-emerald-100 text-emerald-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                analytics.risk_level === 'high' ? 'bg-rose-500' :
                analytics.risk_level === 'medium' ? 'bg-amber-500' :
                analytics.risk_level === 'low' ? 'bg-emerald-500' :
                'bg-slate-400'
              }`}></span>
              {analytics.risk_level === 'high' ? 'Высокий риск' :
               analytics.risk_level === 'medium' ? 'Средний риск' :
               analytics.risk_level === 'low' ? 'Низкий риск' : 'Не определён'}
            </div>

            {/* Метрики */}
            <div className="space-y-3">
              {analytics.metrics.impulse?.value !== null && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{analytics.metrics.impulse.label}</span>
                    <span className="font-bold text-slate-700">{analytics.metrics.impulse.value}/10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analytics.metrics.impulse.value >= 7 ? 'bg-rose-500' :
                        analytics.metrics.impulse.value >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(analytics.metrics.impulse.value / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {analytics.metrics.emotional?.value !== null && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{analytics.metrics.emotional.label}</span>
                    <span className="font-bold text-slate-700">{analytics.metrics.emotional.value}/10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analytics.metrics.emotional.value >= 7 ? 'bg-rose-500' :
                        analytics.metrics.emotional.value >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(analytics.metrics.emotional.value / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {analytics.metrics.urge?.value !== null && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{analytics.metrics.urge.label} (14 дн.)</span>
                    <span className="font-bold text-slate-700">{analytics.metrics.urge.value}/10</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analytics.metrics.urge.value >= 7 ? 'bg-rose-500' :
                        analytics.metrics.urge.value >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${(analytics.metrics.urge.value / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {analytics.tests_completed_14d > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                Пройдено тестов за 14 дней: {analytics.tests_completed_14d}
              </div>
            )}
          </div>
        </Link>
      )}

      {/* Финансы - только для треков с money: true */}
      {trackConfig.features.money && (
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
      )}

      {/* Уведомления */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <button
          onClick={() => setShowReminderSettings(!showReminderSettings)}
          className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell className={reminderSettings?.enabled ? "text-blue-500" : "text-slate-400"} size={20} />
            <span className="font-bold text-slate-800">Напоминания</span>
          </div>
          {showReminderSettings ? (
            <ChevronUp size={20} className="text-slate-400"/>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {reminderSettings?.enabled ? `${reminderSettings.hour}:00` : 'Выкл'}
              </span>
              <ChevronDown size={20} className="text-slate-400"/>
            </div>
          )}
        </button>
        {showReminderSettings && (
          <div className="p-5 pt-0 border-t border-slate-100 animate-slide-down">
            {/* Toggle */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-slate-700">Ежедневное напоминание</div>
                <div className="text-xs text-slate-500">Напомним сделать чек-ин</div>
              </div>
              <button
                onClick={handleReminderToggle}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  reminderSettings?.enabled ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${
                    reminderSettings?.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Time selector */}
            {reminderSettings?.enabled && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Время напоминания</div>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_HOURS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleReminderHourChange(value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        reminderSettings.hour === value
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
