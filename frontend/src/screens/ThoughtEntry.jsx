/**
 * Экран создания записи в дневнике мыслей.
 * 4 шага по схеме СМЭР: Ситуация -> Мысль -> Эмоции -> Реакции
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/Button'
import { triggerHaptic } from '../hooks/useTelegram'
import { EMOTIONS, getTrackConfig } from '../constants'
import { ArrowLeft } from 'lucide-react'

export function ThoughtEntry() {
  const navigate = useNavigate()
  const { addThoughtEntry, profile } = useStore()

  // Получаем конфиг трека для контекстного контента
  const trackConfig = getTrackConfig(profile?.track)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State (СМЭР: Ситуация, Мысль, Эмоции, Реакции)
  const [situation, setSituation] = useState('')
  const [thought, setThought] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [intensity, setIntensity] = useState(5)
  const [reaction, setReaction] = useState('')

  const progress = (step / 4) * 100

  const handleNext = () => {
    triggerHaptic('light')
    if (step < 4) {
      setStep(s => s + 1)
    } else {
      handleSave()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(s => s - 1)
    } else {
      navigate(-1)
    }
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await addThoughtEntry({
        situation,
        thought,
        emotions: selectedEmotions,
        emotionIntensity: intensity,
        reaction
      })
      triggerHaptic('success')
      navigate('/diary')
    } catch (error) {
      console.error('Failed to save thought entry:', error)
      triggerHaptic('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleEmotion = (id) => {
    triggerHaptic('selection')
    if (selectedEmotions.includes(id)) {
      setSelectedEmotions(prev => prev.filter(e => e !== id))
    } else {
      setSelectedEmotions(prev => [...prev, id])
    }
  }

  const addChip = (text, setter) => {
    triggerHaptic('selection')
    setter(prev => prev ? `${prev}, ${text.toLowerCase()}` : text)
  }

  // Валидация шага
  const isStepValid = () => {
    switch (step) {
      case 1: return situation.length > 0
      case 2: return thought.length > 0
      case 3: return selectedEmotions.length > 0
      case 4: return true // Альтернатива необязательна
      default: return false
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white">
        <button 
          onClick={handleBack} 
          className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-1">
            <span>Шаг {step} из 4</span>
            <span>
              {step === 1 ? 'Ситуация' : step === 2 ? 'Мысль' : step === 3 ? 'Эмоции' : 'Реакции'}
            </span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto pb-safe">
        
        {/* Step 1: Situation */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Что произошло?</h2>
            <p className="text-slate-500">
              Опишите ситуацию кратко: где вы были, что делали, что случилось перед тем, как возникла эмоция.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {trackConfig.situations.map(s => (
                <button
                  key={s}
                  onClick={() => addChip(s, setSituation)}
                  className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>

            <textarea 
              autoFocus
              value={situation}
              onChange={e => setSituation(e.target.value)}
              className="w-full h-40 bg-slate-50 rounded-xl p-4 text-slate-800 border-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-slate-400"
              placeholder="Например: Пришло уведомление о зарплате, сидел один дома..."
            />
          </div>
        )}

        {/* Step 2: Thought */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">О чём вы подумали?</h2>
            <p className="text-slate-500">
              Какая автоматическая мысль пронеслась в голове в этот момент?
            </p>
            
            <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 italic mb-4 text-sm border-l-4 border-indigo-400">
              Ситуация: "{situation.substring(0, 50)}{situation.length > 50 ? '...' : ''}"
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {trackConfig.thoughts.map(t => (
                <button
                  key={t}
                  onClick={() => addChip(t, setThought)}
                  className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  + {t}
                </button>
              ))}
            </div>

            <textarea 
              autoFocus
              value={thought}
              onChange={e => setThought(e.target.value)}
              className="w-full h-32 bg-slate-50 rounded-xl p-4 text-slate-800 border-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-slate-400"
              placeholder="Например: Сейчас точно повезёт, нужно отыграться..."
            />
          </div>
        )}

        {/* Step 3: Emotions */}
        {step === 3 && (
          <div className="animate-fade-in space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Что почувствовали?</h2>
            
            <div className="flex flex-wrap gap-3">
              {EMOTIONS.map(emo => (
                <button
                  key={emo.id}
                  onClick={() => toggleEmotion(emo.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedEmotions.includes(emo.id) 
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                      : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xl">{emo.emoji}</span>
                  <span className="font-bold text-sm">{emo.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex justify-between font-medium text-slate-700 mb-4">
                <span>Интенсивность</span>
                <span className="font-bold text-indigo-600">{intensity}/10</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={intensity} 
                onChange={e => {
                  setIntensity(Number(e.target.value))
                  triggerHaptic('selection')
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>Слабо</span>
                <span>Невыносимо</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Reactions (Р в схеме СМЭР) */}
        {step === 4 && (
          <div className="animate-fade-in space-y-4">
            <h2 className="text-2xl font-bold text-slate-800">Что вы сделали?</h2>
            <p className="text-slate-500">
              Опишите вашу реакцию: какие действия вы предприняли или хотели предпринять?
            </p>

            {/* Краткое резюме предыдущих шагов */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
              <div className="text-slate-500">
                <span className="font-bold text-slate-700">С:</span> {situation.substring(0, 40)}{situation.length > 40 ? '...' : ''}
              </div>
              <div className="text-slate-500">
                <span className="font-bold text-slate-700">М:</span> {thought.substring(0, 40)}{thought.length > 40 ? '...' : ''}
              </div>
              <div className="text-slate-500">
                <span className="font-bold text-slate-700">Э:</span> {selectedEmotions.join(', ')} ({intensity}/10)
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {trackConfig.reactions.map(r => (
                <button
                  key={r}
                  onClick={() => addChip(r, setReaction)}
                  className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  + {r}
                </button>
              ))}
            </div>

            <textarea
              autoFocus
              value={reaction}
              onChange={e => setReaction(e.target.value)}
              className="w-full h-32 bg-slate-50 rounded-xl p-4 text-slate-800 border-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-slate-400"
              placeholder="Например: Открыл приложение, но потом закрыл и позвонил другу..."
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-white pb-safe">
        <Button 
          fullWidth 
          onClick={handleNext} 
          disabled={!isStepValid() || isSubmitting}
          className={step === 4 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}
        >
          {isSubmitting ? 'Сохранение...' : step === 4 ? 'Сохранить запись' : 'Далее'}
        </Button>
      </div>
    </div>
  )
}
