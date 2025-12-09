/**
 * Компонент настройки финансов.
 * Используется в онбординге и в профиле.
 */

import React, { useState } from 'react'
import { Button } from './Button'
import { useStore } from '../store/useStore'
import { Wallet } from 'lucide-react'

export function MoneySettings({ onSave, onSkip, embedded = false }) {
  const { moneySettings, updateMoneySettings } = useStore()
  const [amount, setAmount] = useState(moneySettings.averageAmount ? String(moneySettings.averageAmount) : '')
  const [showSaved, setShowSaved] = useState(moneySettings.showSaved)
  const [trackLosses, setTrackLosses] = useState(moneySettings.trackLosses)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateMoneySettings({
        enabled: true,
        averageAmount: Number(amount) || 0,
        showSaved,
        trackLosses
      })
      onSave?.()
    } catch (error) {
      console.error('Failed to save money settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={`space-y-6 ${embedded ? '' : 'p-6 bg-white rounded-2xl shadow-sm border border-slate-100'}`}>
      {!embedded && (
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
            <Wallet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Финансы</h2>
            <p className="text-slate-500 text-sm">Осознайте цену зависимости</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Сколько в среднем вы тратите/проигрываете за один эпизод?
          </label>
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="3000"
              className="w-full bg-slate-50 rounded-xl p-4 pr-10 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₽</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={showSaved}
              onChange={(e) => setShowSaved(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-slate-700 font-medium text-sm">Показывать "Сэкономлено" на главной</span>
          </label>

          <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
            <input 
              type="checkbox" 
              checked={trackLosses}
              onChange={(e) => setTrackLosses(e.target.checked)}
              className="w-5 h-5"
            />
            <div className="flex flex-col">
              <span className="text-slate-700 font-medium text-sm">Учитывать потери при срывах</span>
              <span className="text-slate-400 text-xs">Будем спрашивать сумму при отметке срыва</span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="flex-1">
            Пропустить
          </Button>
        )}
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={isSaving}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30"
        >
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  )
}
