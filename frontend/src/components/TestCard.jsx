/**
 * Компонент карточки теста.
 * Поддерживает типы вопросов: scale_0_10, scale_0_3, yes_no, choice
 */

import React, { useState } from 'react'
import { Button } from './Button'
import { triggerHaptic } from '../hooks/useTelegram'

export function TestCard({ test, onComplete, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [currentAnswer, setCurrentAnswer] = useState(null)

  const question = test.questions[currentIndex]
  const isLast = currentIndex === test.questions.length - 1

  const handleNext = () => {
    triggerHaptic('light')

    const questionId = question.id || question.code
    const newAnswers = { ...answers, [questionId]: currentAnswer }
    setAnswers(newAnswers)
    setCurrentAnswer(null)

    if (isLast) {
      onComplete(newAnswers)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const renderInput = () => {
    const type = question.type || question.answer_type

    switch (type) {
      case 'scale_0_10':
        return (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className={`text-4xl font-bold transition-colors ${
                (currentAnswer ?? 5) < 4 ? 'text-emerald-500' : 
                (currentAnswer ?? 5) < 7 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {currentAnswer ?? 5}
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={currentAnswer ?? 5}
              onChange={(e) => {
                setCurrentAnswer(parseInt(e.target.value))
                triggerHaptic('selection')
              }}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>{question.scale_labels?.[0] || 'Совсем нет'}</span>
              <span>{question.scale_labels?.[10] || 'Очень сильно'}</span>
            </div>
          </div>
        )

      case 'scale_0_3':
        // Используем лейблы из вопроса, если есть, иначе дефолтные
        const defaultLabels = ['Никогда', 'Иногда', 'Часто', 'Почти всегда']
        const labels03 = question.scale_labels || defaultLabels
        const options03 = labels03.map((label, idx) => ({ val: idx, label }))

        return (
          <div className="grid grid-cols-2 gap-3">
            {options03.map((opt) => (
              <button
                key={opt.val}
                onClick={() => {
                  setCurrentAnswer(opt.val)
                  triggerHaptic('selection')
                }}
                className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
                  currentAnswer === opt.val
                    ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold shadow-md shadow-brand-500/10'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )

      case 'yes_no':
        return (
          <div className="flex gap-4">
            <button
              onClick={() => {
                setCurrentAnswer(true)
                triggerHaptic('selection')
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all active:scale-95 ${
                currentAnswer === true 
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold shadow-md shadow-brand-500/10' 
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              Да
            </button>
            <button
              onClick={() => {
                setCurrentAnswer(false)
                triggerHaptic('selection')
              }}
              className={`flex-1 p-4 rounded-xl border-2 transition-all active:scale-95 ${
                currentAnswer === false 
                  ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold shadow-md shadow-brand-500/10' 
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              Нет
            </button>
          </div>
        )

      case 'choice':
        // Поддержка разных форматов опций от бэкенда
        const options = question.options || question.choices || 
          (question.choices_json ? JSON.parse(question.choices_json) : [])
        
        return (
          <div className="space-y-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setCurrentAnswer(opt)
                  triggerHaptic('selection')
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-95 ${
                  currentAnswer === opt 
                    ? 'border-brand-600 bg-brand-50 text-brand-700 font-bold shadow-md shadow-brand-500/10' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )
      
      default:
        return <div className="text-slate-500">Неизвестный тип вопроса: {type}</div>
    }
  }

  const questionText = question.text || question.question_ru
  const testTitle = test.title || test.name_ru || test.name

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      {/* Прогресс */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <span>{testTitle}</span>
          <span>{currentIndex + 1} / {test.questions.length}</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 transition-all duration-300" 
            style={{ width: `${((currentIndex + 1) / test.questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Вопрос */}
      <h3 className="text-xl font-semibold text-slate-800 mb-8 min-h-[4rem]">
        {questionText}
      </h3>

      {/* Ответы */}
      <div className="mb-8">
        {renderInput()}
      </div>

      {/* Кнопки */}
      <div className="flex gap-3">
        {onSkip && (
          <Button variant="ghost" onClick={onSkip} className="flex-1">
            Пропустить
          </Button>
        )}
        <Button 
          variant="primary" 
          fullWidth={!onSkip}
          className={onSkip ? "flex-1" : ""}
          disabled={currentAnswer === null} 
          onClick={handleNext}
        >
          {isLast ? 'Завершить' : 'Далее'}
        </Button>
      </div>
    </div>
  )
}
