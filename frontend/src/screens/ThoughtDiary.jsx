/**
 * Экран дневника мыслей — список записей (схема СМЭР).
 */

import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/Button'
import { EMOTIONS } from '../constants'
import { ArrowLeft, Plus, Calendar, Zap } from 'lucide-react'

export function ThoughtDiary() {
  const { thoughtEntries, loadThoughtEntries } = useStore()

  // Загружаем записи при монтировании
  useEffect(() => {
    loadThoughtEntries()
  }, [loadThoughtEntries])

  const getEmotionDetails = (id) => EMOTIONS.find(e => e.id === id)

  const formatDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-slate-200 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Дневник мыслей</h1>
        </div>
        <Link to="/diary/new">
          <button className="bg-indigo-600 text-white p-2 rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all">
            <Plus size={24} />
          </button>
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Empty State */}
        {thoughtEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-400 mb-2">
              <Calendar size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Пока пусто</h3>
            <p className="text-slate-500 max-w-xs">
              Записывайте автоматические мысли, чтобы находить ловушки мышления и менять своё состояние.
            </p>
            <Link to="/diary/new">
              <Button className="mt-4 bg-indigo-600">Создать первую запись</Button>
            </Link>
          </div>
        ) : (
          // Entries List
          thoughtEntries.map((entry, index) => (
            <div 
              key={entry.id} 
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Header - дата */}
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  {formatDate(entry.createdAt)}
                </span>
              </div>

              {/* СМЭР структура */}
              <div className="space-y-3">
                {/* С: Ситуация */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">С: Ситуация</span>
                  <p className="text-sm text-slate-600">{entry.situation}</p>
                </div>

                {/* М: Мысль */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">М: Мысль</span>
                  <p className="text-slate-800 font-medium italic border-l-2 border-indigo-500 pl-3 py-1">
                    "{entry.thought}"
                  </p>
                </div>

                {/* Э: Эмоции */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Э: Эмоции</span>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {entry.emotions?.map(eId => {
                      const e = getEmotionDetails(eId)
                      if (!e) return null
                      return (
                        <span
                          key={eId}
                          className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100"
                        >
                          <span>{e.emoji}</span> {e.label}
                        </span>
                      )
                    })}
                    <span className="text-xs text-slate-400 py-1">
                      ({entry.emotionIntensity}/10)
                    </span>
                  </div>
                </div>

                {/* Р: Реакции */}
                {entry.reaction && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-700 uppercase mb-1 flex items-center gap-1">
                      <Zap size={12} /> Р: Реакции
                    </h4>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      {entry.reaction}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
