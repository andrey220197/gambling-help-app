/**
 * Экран SOS — экстренная помощь.
 */

import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { SOS_TECHNIQUES } from '../constants'
import { triggerHaptic } from '../hooks/useTelegram'
import { Phone, ArrowLeft, ChevronRight, Heart, Play, Pause, RotateCcw } from 'lucide-react'
import * as api from '../api/client'

// Дыхательные упражнения
const BREATHING_PHASES = [
  { name: 'Вдох', duration: 4, color: 'from-cyan-400 to-blue-500' },
  { name: 'Задержка', duration: 4, color: 'from-blue-500 to-indigo-500' },
  { name: 'Выдох', duration: 4, color: 'from-indigo-500 to-purple-500' },
  { name: 'Задержка', duration: 4, color: 'from-purple-500 to-cyan-400' },
]

export function SOS() {
  const [expandedTechnique, setExpandedTechnique] = useState(null)

  // Breathing timer state
  const [breathingActive, setBreathingActive] = useState(false)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseTime, setPhaseTime] = useState(0)
  const [totalCycles, setTotalCycles] = useState(0)
  const intervalRef = useRef(null)

  // Логируем SOS событие
  useEffect(() => {
    api.logSosEvent('sos_opened').catch(() => {})
  }, [])

  // Breathing timer logic
  useEffect(() => {
    if (breathingActive) {
      intervalRef.current = setInterval(() => {
        setPhaseTime(prev => {
          const phase = BREATHING_PHASES[currentPhase]
          if (prev >= phase.duration - 1) {
            // Move to next phase
            const nextPhase = (currentPhase + 1) % BREATHING_PHASES.length
            setCurrentPhase(nextPhase)
            if (nextPhase === 0) {
              setTotalCycles(c => c + 1)
              triggerHaptic('light')
            }
            return 0
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [breathingActive, currentPhase])

  const toggleBreathing = () => {
    triggerHaptic('medium')
    setBreathingActive(!breathingActive)
  }

  const resetBreathing = () => {
    triggerHaptic('light')
    setBreathingActive(false)
    setCurrentPhase(0)
    setPhaseTime(0)
    setTotalCycles(0)
  }

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

      {/* Breathing Exercise */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-5">
            <h3 className="font-bold text-slate-800 mb-1">🌬️ Дыхание 4-4-4-4</h3>
            <p className="text-slate-500 text-sm mb-4">Квадратное дыхание снижает тревогу за 2-3 минуты</p>

            {/* Breathing Circle */}
            <div className="flex flex-col items-center py-4">
              <div className="relative">
                {/* Background circle */}
                <div className="w-32 h-32 rounded-full bg-slate-100"></div>

                {/* Animated progress circle */}
                <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="58"
                    fill="none"
                    stroke="url(#breathGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(phaseTime + 1) / BREATHING_PHASES[currentPhase].duration * 364} 364`}
                    className="transition-all duration-1000 ease-linear"
                  />
                  <defs>
                    <linearGradient id="breathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-slate-700">
                    {BREATHING_PHASES[currentPhase].duration - phaseTime}
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    {BREATHING_PHASES[currentPhase].name}
                  </div>
                </div>
              </div>

              {/* Cycle counter */}
              {totalCycles > 0 && (
                <div className="mt-3 text-sm text-slate-400">
                  Циклов: <span className="font-bold text-slate-600">{totalCycles}</span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={toggleBreathing}
                className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  breathingActive
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                }`}
              >
                {breathingActive ? <Pause size={20} /> : <Play size={20} />}
                {breathingActive ? 'Пауза' : 'Начать'}
              </button>
              {(breathingActive || totalCycles > 0) && (
                <button
                  onClick={resetBreathing}
                  className="py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold"
                >
                  <RotateCcw size={20} />
                </button>
              )}
            </div>
          </div>
        </div>
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
