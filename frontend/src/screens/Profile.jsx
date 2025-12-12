/**
 * Экран профиля.
 */

import React, { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { MoneySettings } from '../components/MoneySettings'
import {
  LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  LogOut, Wallet, ChevronDown, ChevronUp, BarChart2
} from 'lucide-react'
import { TRACK_NAMES, TRACK_EMOJIS } from '../constants'
import * as api from '../api/client'

export function Profile() {
  const {
    profile, checkins, resetProgress, streak,
    moneySettings, recoveryCode
  } = useStore()

  const [showMoneySettings, setShowMoneySettings] = useState(false)
  const [moneyStats, setMoneyStats] = useState(null)

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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
          <p className="font-bold text-slate-700 mb-1">{label}</p>
          {payload.map((entry, index) => (
            entry.value !== null && (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: <span className="font-bold">{entry.value}</span>
              </p>
            )
          ))}
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
            {streak?.best || 0} <span className="text-sm text-slate-400 font-normal">дн.</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wide">Всего чек-инов</div>
          <div className="text-3xl font-bold text-slate-700">{checkins.length}</div>
        </div>
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
        <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
          <BarChart2 size={16} className="text-slate-400"/>
          Динамика (7 дней)
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-xs text-slate-600">{value}</span>} />
              <Line type="monotone" dataKey="urge" name="Тяга" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} connectNulls />
              <Line type="monotone" dataKey="stress" name="Стресс" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} connectNulls />
              <Line type="monotone" dataKey="mood" name="Настроение" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
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
