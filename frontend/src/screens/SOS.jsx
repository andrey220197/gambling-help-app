/**
 * Экран SOS — экстренная помощь.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { SOS_TECHNIQUES } from '../constants'
import { triggerHaptic } from '../hooks/useTelegram'
import { Phone, ArrowLeft, ChevronRight, Heart } from 'lucide-react'
import * as api from '../api/client'

export function SOS() {
  const [expandedTechnique, setExpandedTechnique] = useState(null)

  // Логируем SOS событие
  useEffect(() => {
    api.logSosEvent('sos_opened').catch(() => {})
  }, [])

  const handleTechniqueClick = (id) => {
    triggerHaptic('medium')
    setExpandedTechnique(expandedTechnique === id ? null : id)
  }

  const handleCallHotline = () => {
    triggerHaptic('heavy')
    window.location.href = 'tel:88002000122'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white pb-24">
      {/* Header */}
      <div className="bg-rose-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">Экстренная помощь</h1>
        </div>
        <p className="text-rose-100 text-sm leading-relaxed">
          Тяга сильна, но она временна. Эти техники помогут пережить пиковый момент.
        </p>
      </div>

      {/* Hotline Card */}
      <div className="p-4 -mt-6">
        <button
          onClick={handleCallHotline}
          className="w-full bg-white rounded-2xl p-5 shadow-lg border border-rose-100 flex items-center gap-4 active:scale-98 transition-transform"
        >
          <div className="bg-rose-100 p-3 rounded-full text-rose-600">
            <Phone size={24} />
          </div>
          <div className="text-left flex-1">
            <div className="font-bold text-slate-800">Горячая линия</div>
            <div className="text-rose-600 font-bold text-lg">8-800-2000-122</div>
            <div className="text-slate-400 text-xs">Бесплатно, анонимно, 24/7</div>
          </div>
          <ChevronRight className="text-slate-300" />
        </button>
      </div>

      {/* Techniques */}
      <div className="p-4 space-y-4">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <Heart size={20} className="text-rose-500" />
          Техники самопомощи
        </h2>

        {SOS_TECHNIQUES.map((technique, index) => (
          <div
            key={technique.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <button
              onClick={() => handleTechniqueClick(technique.id)}
              className="w-full p-5 flex items-center gap-4 text-left active:bg-slate-50 transition-colors"
            >
              <div className="text-3xl">{technique.icon}</div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">{technique.title}</h3>
                {expandedTechnique !== technique.id && (
                  <p className="text-slate-500 text-sm line-clamp-1">{technique.desc}</p>
                )}
              </div>
              <ChevronRight 
                className={`text-slate-300 transition-transform ${
                  expandedTechnique === technique.id ? 'rotate-90' : ''
                }`} 
              />
            </button>
            
            {expandedTechnique === technique.id && (
              <div className="px-5 pb-5 pt-0 animate-slide-down">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-slate-700 leading-relaxed">{technique.desc}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Message */}
      <div className="p-4">
        <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
          <h3 className="font-bold text-indigo-800 mb-2">💡 Помни</h3>
          <p className="text-indigo-700 text-sm leading-relaxed">
            Тяга — это волна. Она нарастает, достигает пика и <strong>обязательно</strong> спадает. 
            Обычно это занимает 15-20 минут. Просто переждите.
          </p>
        </div>
      </div>

      {/* Back Button */}
      <div className="p-4">
        <Link to="/">
          <Button variant="secondary" fullWidth>Мне лучше, на главную</Button>
        </Link>
      </div>
    </div>
  )
}
