/**
 * Экран создания записи в дневнике мыслей.
 * 4 шага: Ситуация -> Мысль -> Эмоции -> Альтернатива
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Button } from '../components/Button'
import { triggerHaptic } from '../hooks/useTelegram'
import { 
  EMOTIONS, COGNITIVE_DISTORTIONS, 
  COMMON_SITUATIONS, COMMON_THOUGHTS 
} from '../constants'
import { ArrowLeft } from 'lucide-react'

export function ThoughtEntry() {
  const navigate = useNavigate()
  const { addThoughtEntry } = useStore()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [situation, setSituation] = useState('')
  const [thought, setThought] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState([])
  const [intensity, setIntensity] = useState(5)
  const [selectedDistortion, setSelectedDistortion] = useState(null)
  const [alternative, setAlternative] = useState('')

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
        distortion: selectedDistortion,
        alternativeThought: alternative
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
              {step === 1 ? 'Ситуация' : step === 2 ? 'Мысль' : step === 3 ? 'Эмоции' : 'Альтернатива'}
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
              {COMMON_SITUATIONS.map(s => (
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
              {COMMON_THOUGHTS.map(t => (
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

        {/* Step 4: Analysis/Alternative */}
        {step === 4 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Разбор мысли</h2>
              <p className="text-slate-500 text-sm">
                Ваша мысль: <span className="text-slate-800 italic">"{thought}"</span>
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                Это похоже на искажение?
              </h3>
              <div className="space-y-3">
                {COGNITIVE_DISTORTIONS.map(dist => (
                  <button
                    key={dist.id}
                    onClick={() => {
                      triggerHaptic('selection')
                      setSelectedDistortion(selectedDistortion === dist.id ? null : dist.id)
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedDistortion === dist.id
                        ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-slate-800 mb-1">{dist.name}</div>
                    <div className="text-xs text-slate-500">{dist.description}</div>
                    {selectedDistortion === dist.id && (
                      <div className="mt-3 text-xs bg-white p-2 rounded-lg border border-rose-100 text-rose-700">
                        💡 {dist.alternative}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">
                Альтернативная мысль
              </h3>
              <textarea 
                value={alternative}
                onChange={e => setAlternative(e.target.value)}
                className="w-full h-32 bg-emerald-50 rounded-xl p-4 text-slate-800 border-none focus:ring-2 focus:ring-emerald-500 resize-none placeholder:text-slate-400"
                placeholder="Как можно посмотреть на это иначе? Реалистичный взгляд."
              />
            </div>
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
