/**
 * Экран детальной аналитики.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Activity, TrendingUp, AlertTriangle, Brain, Heart, Zap } from 'lucide-react'
import * as api from '../api/client'
import { TRACK_NAMES } from '../constants'

const RISK_LEVELS = {
  low: { label: 'Низкий риск', color: 'emerald', description: 'Хорошие показатели, продолжайте в том же духе.' },
  medium: { label: 'Средний риск', color: 'amber', description: 'Есть зоны для внимания. Регулярный мониторинг поможет.' },
  high: { label: 'Высокий риск', color: 'rose', description: 'Рекомендуется повышенное внимание и использование SOS-техник.' },
  unknown: { label: 'Не определён', color: 'slate', description: 'Пройдите больше тестов для определения профиля.' },
}

const METRIC_ICONS = {
  impulse: Zap,
  urge: TrendingUp,
  emotional: Heart,
  stress: AlertTriangle,
  triggers: Brain,
}

const METRIC_COLORS = {
  impulse: 'indigo',
  urge: 'rose',
  emotional: 'purple',
  stress: 'amber',
  triggers: 'cyan',
}

export function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getTestAnalytics(),
      api.getTestHistory(20),
    ])
      .then(([analyticsData, historyData]) => {
        setAnalytics(analyticsData)
        setHistory(historyData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Загрузка...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="p-4 pb-24">
        <Link to="/profile" className="flex items-center gap-2 text-slate-500 mb-6">
          <ArrowLeft size={20} />
          <span>Назад</span>
        </Link>
        <div className="text-center py-12">
          <Activity size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-700 mb-2">Нет данных</h2>
          <p className="text-slate-500 text-sm">Пройдите тесты, чтобы увидеть аналитику.</p>
        </div>
      </div>
    )
  }

  const riskInfo = RISK_LEVELS[analytics.risk_level] || RISK_LEVELS.unknown

  const renderMetricCard = (key, metric) => {
    if (!metric || metric.value === null) return null

    const Icon = METRIC_ICONS[key] || Activity
    const colorName = METRIC_COLORS[key] || 'slate'
    const value = metric.value
    const level = value >= 7 ? 'high' : value >= 4 ? 'medium' : 'low'

    return (
      <div key={key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg bg-${colorName}-100`}>
            <Icon size={18} className={`text-${colorName}-600`} />
          </div>
          <div className={`text-2xl font-bold ${
            level === 'high' ? 'text-rose-600' :
            level === 'medium' ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {value}
          </div>
        </div>
        <div className="font-bold text-slate-800 text-sm mb-1">{metric.label}</div>
        <div className="text-xs text-slate-500 mb-3">{metric.description}</div>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              level === 'high' ? 'bg-rose-500' :
              level === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${(value / 10) * 100}%` }}
          />
        </div>

        {metric.recent !== undefined && metric.recent !== null && (
          <div className="mt-2 text-xs text-slate-400">
            Недавно: {metric.recent}/10
          </div>
        )}
        {metric.count !== undefined && (
          <div className="mt-1 text-xs text-slate-400">
            Тестов: {metric.count}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/profile" className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Аналитика</h1>
      </div>

      {/* Общий уровень риска */}
      <div className={`p-5 rounded-2xl border-2 ${
        riskInfo.color === 'rose' ? 'bg-rose-50 border-rose-200' :
        riskInfo.color === 'amber' ? 'bg-amber-50 border-amber-200' :
        riskInfo.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' :
        'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-4 h-4 rounded-full ${
            riskInfo.color === 'rose' ? 'bg-rose-500' :
            riskInfo.color === 'amber' ? 'bg-amber-500' :
            riskInfo.color === 'emerald' ? 'bg-emerald-500' :
            'bg-slate-400'
          }`} />
          <span className={`font-bold text-lg ${
            riskInfo.color === 'rose' ? 'text-rose-800' :
            riskInfo.color === 'amber' ? 'text-amber-800' :
            riskInfo.color === 'emerald' ? 'text-emerald-800' :
            'text-slate-700'
          }`}>
            {riskInfo.label}
          </span>
        </div>
        <p className={`text-sm ${
          riskInfo.color === 'rose' ? 'text-rose-700' :
          riskInfo.color === 'amber' ? 'text-amber-700' :
          riskInfo.color === 'emerald' ? 'text-emerald-700' :
          'text-slate-600'
        }`}>
          {riskInfo.description}
        </p>
        {analytics.track && (
          <div className="mt-3 pt-3 border-t border-current/10 text-xs opacity-75">
            Трек: {TRACK_NAMES[analytics.track] || analytics.track}
            {analytics.track_score !== null && ` (скор: ${analytics.track_score}/10)`}
          </div>
        )}
      </div>

      {/* Метрики */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3">Показатели</h2>
        <div className="grid grid-cols-2 gap-3">
          {renderMetricCard('impulse', analytics.metrics.impulse)}
          {renderMetricCard('emotional', analytics.metrics.emotional)}
          {renderMetricCard('urge', analytics.metrics.urge)}
          {renderMetricCard('stress', analytics.metrics.stress)}
          {renderMetricCard('triggers', analytics.metrics.triggers)}
        </div>
      </div>

      {/* Еженедельная оценка */}
      {analytics.weekly_assessment && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-2">Последняя еженедельная оценка</h3>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              analytics.weekly_assessment.interpretation === 'green' ? 'bg-emerald-100 text-emerald-700' :
              analytics.weekly_assessment.interpretation === 'yellow' ? 'bg-amber-100 text-amber-700' :
              analytics.weekly_assessment.interpretation === 'red' ? 'bg-rose-100 text-rose-700' :
              'bg-slate-100 text-slate-600'
            }`}>
              {analytics.weekly_assessment.interpretation === 'green' ? 'Стабильно' :
               analytics.weekly_assessment.interpretation === 'yellow' ? 'Внимание' :
               analytics.weekly_assessment.interpretation === 'red' ? 'Риск' :
               analytics.weekly_assessment.interpretation}
            </div>
            <span className="text-xs text-slate-400">
              {new Date(analytics.weekly_assessment.date).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      )}

      {/* История тестов */}
      {history.length > 0 && (
        <div>
          <h2 className="font-bold text-slate-800 mb-3">История тестов</h2>
          <div className="space-y-2">
            {history.slice(0, 10).map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-medium text-slate-700 text-sm">{item.name_ru || item.code}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-700">{item.total_score}</div>
                  {item.interpretation && (
                    <div className={`text-xs ${
                      ['high', 'red', 'problem_gambling'].includes(item.interpretation) ? 'text-rose-500' :
                      ['medium', 'yellow', 'moderate_risk'].includes(item.interpretation) ? 'text-amber-500' :
                      'text-emerald-500'
                    }`}>
                      {item.interpretation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="bg-slate-50 p-4 rounded-xl text-center">
        <div className="text-3xl font-bold text-brand-600 mb-1">
          {analytics.tests_completed_14d}
        </div>
        <div className="text-xs text-slate-500">тестов за 14 дней</div>
      </div>
    </div>
  )
}
