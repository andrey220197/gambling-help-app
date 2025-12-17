/**
 * Экран чек-ина.
 * Фазы: loading -> already_done | form -> relapse_confirm -> relapse_amount -> test -> diary_prompt -> result | relapse_support
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { TestCard } from '../components/TestCard'
import { Button } from '../components/Button'
import { triggerHaptic } from '../hooks/useTelegram'
import { getTrackConfig } from '../constants'
import * as api from '../api/client'
import {
  CheckCircle, AlertTriangle, AlertOctagon,
  ArrowRight, Book, Heart
} from 'lucide-react'

export function CheckIn() {
  const { addCheckin, profile, checkins, moneySettings, streak } = useStore()
  const navigate = useNavigate()
  const trackConfig = getTrackConfig(profile?.track)
  
  // Фаза экрана
  const [step, setStep] = useState('loading')
  
  // Форма
  const [urge, setUrge] = useState(5)
  const [stress, setStress] = useState(5)
  const [mood, setMood] = useState(5)
  const [relapse, setRelapse] = useState(false)
  const [note, setNote] = useState('')
  const [lossAmount, setLossAmount] = useState('')
  
  // Данные
  const [previousStreak, setPreviousStreak] = useState(0)
  const [currentTest, setCurrentTest] = useState(null)
  const [todaysCheckin, setTodaysCheckin] = useState(null)

  // Проверяем был ли чек-ин сегодня
  useEffect(() => {
    const checkToday = async () => {
      try {
        const result = await api.getTodayCheckin()
        if (result.hasCheckin) {
          setTodaysCheckin(result.checkin)
          setStep('already_done')
        } else {
          setPreviousStreak(streak?.current || 0)
          setStep('form')
        }
      } catch (error) {
        // Если API недоступен, проверяем локально
        if (checkins.length > 0) {
          const lastDate = new Date(checkins[0].date).toLocaleDateString()
          const today = new Date().toLocaleDateString()
          if (lastDate === today) {
            setTodaysCheckin(checkins[0])
            setStep('already_done')
            return
          }
        }
        setPreviousStreak(streak?.current || 0)
        setStep('form')
      }
    }
    checkToday()
  }, [checkins, streak])

  // Начало отправки — проверяем срыв
  const initiateSubmit = () => {
    triggerHaptic('light')
    
    if (relapse) {
      setStep('relapse_confirm')
    } else {
      finalizeSubmit(false, null)
    }
  }

  // Финализация — сохраняем и переходим к тесту
  const finalizeSubmit = async (confirmedRelapse, moneyLoss) => {
    try {
      const result = await addCheckin({
        urge,
        stress,
        mood,
        relapse: confirmedRelapse,
        note,
        lossAmount: moneyLoss
      })
      
      // Загружаем тест
      loadTest(confirmedRelapse)
    } catch (error) {
      console.error('Failed to create checkin:', error)
      // Даже при ошибке переходим к тесту
      loadTest(confirmedRelapse)
    }
  }

  // Загрузка теста
  const loadTest = async (isRelapse) => {
    try {
      const testData = await api.getNextTest({
        urge,
        stress,
        relapse: isRelapse,
        note
      })
      
      if (testData?.test) {
        setCurrentTest(testData.test)
        setStep('test')
      } else {
        // Нет теста — переходим к результату
        goToResult(isRelapse)
      }
    } catch (error) {
      console.error('Failed to load test:', error)
      goToResult(isRelapse)
    }
  }

  // Завершение теста
  const handleTestComplete = async (answers) => {
    triggerHaptic('medium')
    
    // Отправляем результат теста
    if (currentTest) {
      try {
        await api.submitTest(currentTest.code, answers)
      } catch (error) {
        console.error('Failed to submit test:', error)
      }
    }
    
    goToResult(relapse)
  }

  // Переход к результату
  const goToResult = (isRelapse) => {
    if (isRelapse) {
      setStep('relapse_support')
    } else if (urge >= 5) {
      setStep('diary_prompt')
    } else {
      setStep('result')
    }
  }

  // ==========================================
  // РЕНДЕР СЛАЙДЕРОВ
  // ==========================================

  const getEmoji = (type, val) => {
    if (type === 'mood') {
      if (val < 3) return '😫'
      if (val < 5) return '😕'
      if (val < 7) return '😐'
      if (val < 9) return '🙂'
      return '🤩'
    }
    if (type === 'stress') {
      if (val < 3) return '🧘'
      if (val < 5) return '😌'
      if (val < 7) return '😬'
      if (val < 9) return '😰'
      return '🤯'
    }
    // Urge
    if (val < 2) return '🛡️'
    if (val < 5) return '💭'
    if (val < 8) return '⚠️'
    return '🔥'
  }

  const renderSlider = (type, label, val, setVal, minLabel = "Мин", maxLabel = "Макс", disabled = false) => (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <label className="font-medium text-slate-700 text-sm">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-xl animate-bounce-short">{getEmoji(type, val)}</span>
          <span className={`font-bold text-lg leading-none ${
            val < 4 ? 'text-emerald-500' : val < 7 ? 'text-amber-500' : 'text-rose-500'
          }`}>{val}</span>
        </div>
      </div>
      <input
        type="range" 
        min="0" 
        max="10" 
        value={val} 
        onChange={(e) => {
          if (!disabled) {
            setVal(parseInt(e.target.value))
            triggerHaptic('selection')
          }
        }}
        disabled={disabled}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
          disabled ? 'cursor-default bg-slate-100' : 'bg-slate-200 accent-brand-600'
        }`}
      />
    </div>
  )

  // ==========================================
  // РЕНДЕР ЭКРАНОВ
  // ==========================================

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Загрузка...
      </div>
    )
  }

  // Уже был чек-ин сегодня
  if (step === 'already_done') {
    if (!todaysCheckin) {
      setStep('form')
      return null
    }
    
    return (
      <div className="p-4 space-y-6 pb-24">
        {todaysCheckin.relapse ? (
          <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">💪</div>
            <h2 className="text-xl font-bold text-rose-800">Срыв — это опыт</h2>
            <p className="text-rose-700 text-sm">Вы отметили срыв сегодня. Самое главное — вы вернулись.</p>
            <Link to="/sos">
              <Button variant="danger" fullWidth>Нужна поддержка</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-sm">✨</div>
            <h2 className="text-xl font-bold text-emerald-800">Отличная работа!</h2>
            <p className="text-emerald-700 text-sm">Чек-ин пройден. Еще один шаг к свободе.</p>
          </div>
        )}
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 opacity-90 space-y-6">
          {renderSlider('urge', 'Тяга', todaysCheckin.urge, () => {}, '', '', true)}
          {renderSlider('stress', 'Стресс', todaysCheckin.stress, () => {}, '', '', true)}
          {renderSlider('mood', 'Настроение', todaysCheckin.mood, () => {}, '', '', true)}
        </div>

        {/* Кнопка "Проиграл сегодня" - видна если не было срыва */}
        {!todaysCheckin.relapse && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <button
              onClick={() => {
                triggerHaptic('heavy')
                setPreviousStreak(streak?.current || 0)
                setRelapse(true)
                setStep('relapse_confirm')
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all text-left"
            >
              <div className="w-6 h-6 rounded border-2 border-slate-300 bg-white shrink-0"></div>
              <div>
                <span className="font-bold text-slate-700 block">Был срыв сегодня</span>
                <span className="text-xs text-slate-500">Мы не осуждаем. Это шаг к осознанию.</span>
              </div>
            </button>
          </div>
        )}

        <Link to="/">
          <Button variant="secondary" fullWidth>На главную</Button>
        </Link>
      </div>
    )
  }

  // Форма чек-ина
  if (step === 'form') {
    return (
      <div className="p-4 space-y-8 pb-24">
        <h1 className="text-2xl font-bold text-slate-800">Как ты сейчас?</h1>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-10">
          {renderSlider('urge', trackConfig.labels.urgeQuestion, urge, setUrge, 'Нет тяги', 'Невыносимо')}
          {renderSlider('stress', 'Уровень стресса', stress, setStress, 'Спокоен', 'Паника')}
          {renderSlider('mood', 'Настроение', mood, setMood, 'Ужасное', 'Отличное')}

          {/* Чекбокс срыва */}
          <div className="pt-6 border-t border-slate-100">
            <label className={`flex items-center gap-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
              relapse ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
            }`}>
              <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors shrink-0 ${
                relapse ? 'bg-rose-500 border-rose-500' : 'border-slate-300 bg-white'
              }`}>
                {relapse && <CheckCircle size={16} className="text-white" />}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={relapse}
                onChange={(e) => {
                  setRelapse(e.target.checked)
                  if (e.target.checked) triggerHaptic('heavy')
                }}
              />
              <div>
                <span className={`font-bold block ${relapse ? 'text-rose-700' : 'text-slate-700'}`}>
                  {trackConfig.labels.relapse}
                </span>
                {relapse && (
                  <span className="text-xs text-rose-600">Мы не осуждаем. Это шаг к осознанию.</span>
                )}
              </div>
            </label>
          </div>
          
          {/* Заметка */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Заметка (необязательно)
            </label>
            <textarea 
              className="w-full bg-slate-50 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 border-none resize-none" 
              rows={3} 
              placeholder="Мысли, события, чувства..." 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
            />
          </div>
        </div>
        <Button fullWidth onClick={initiateSubmit}>Продолжить</Button>
      </div>
    )
  }

  // Подтверждение срыва
  if (step === 'relapse_confirm') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <div className="bg-rose-100 p-4 rounded-full text-rose-600 mb-6">
          <AlertOctagon size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">{trackConfig.labels.relapse}?</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Это не провал — это информация для анализа. <br/>
          Ваша серия ({previousStreak} {trackConfig.labels.streakUnit}) начнётся заново, но весь накопленный опыт останется с вами.
        </p>
        <div className="space-y-3 w-full">
          <Button
            variant="danger"
            fullWidth
            onClick={() => {
              // Деньги только для треков с money: true
              if (trackConfig.features.money && moneySettings?.trackLosses) {
                setStep('relapse_amount')
              } else {
                finalizeSubmit(true, null)
              }
            }}
          >
            Да, {trackConfig.labels.relapseShort.toLowerCase()}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setRelapse(false)
              setStep('form')
            }}
          >
            Отмена
          </Button>
        </div>
      </div>
    )
  }

  // Ввод суммы потерь
  if (step === 'relapse_amount') {
    return (
      <div className="min-h-screen flex flex-col p-6 bg-white pt-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Сколько было потрачено?</h2>
        <p className="text-slate-500 mb-8">Если вы не хотите указывать сумму, просто нажмите "Пропустить".</p>
        
        <div className="relative mb-8">
          <input 
            type="number" 
            autoFocus
            value={lossAmount}
            onChange={(e) => setLossAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-50 rounded-2xl p-6 pr-10 text-3xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">₽</span>
        </div>

        <div className="space-y-3 mt-auto mb-10">
          <Button 
            fullWidth 
            variant="danger" 
            disabled={!lossAmount}
            onClick={() => finalizeSubmit(true, Number(lossAmount))}
          >
            Записать и продолжить
          </Button>
          <Button 
            fullWidth 
            variant="ghost" 
            onClick={() => finalizeSubmit(true, null)}
          >
            Не указывать
          </Button>
        </div>
      </div>
    )
  }

  // Тест
  if (step === 'test') {
    return (
      <div className="p-4 pb-24 min-h-screen flex flex-col">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">
            {relapse ? 'Разбор ситуации' : 'Минутка анализа'}
          </h2>
          <p className="text-slate-500 text-sm">
            {relapse ? 'Понимание причин поможет избежать этого в будущем.' : 'Ответьте на пару вопросов.'}
          </p>
        </div>
        
        {currentTest && (
          <TestCard 
            test={currentTest} 
            onComplete={handleTestComplete}
            onSkip={() => goToResult(relapse)}
          />
        )}
      </div>
    )
  }

  // Предложение дневника
  if (step === 'diary_prompt') {
    return (
      <div className="min-h-screen flex flex-col justify-center p-6 bg-slate-900 text-white text-center">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mb-6 mx-auto">
          <Book size={40} />
        </div>
        <h2 className="text-2xl font-bold mb-4">Мысли вызывают тягу</h2>
        <p className="text-slate-300 mb-10 leading-relaxed">
          Вы отметили высокий уровень тяги. Часто за этим стоят автоматические мысли-ловушки. Хотите разобрать их в дневнике?
        </p>
        <div className="space-y-4">
          <Button 
            fullWidth 
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none" 
            onClick={() => navigate('/diary/new')}
          >
            Да, записать мысли
          </Button>
          <Button 
            fullWidth 
            variant="ghost" 
            className="text-slate-400 hover:text-white" 
            onClick={() => setStep('result')}
          >
            Нет, просто завершить
          </Button>
        </div>
      </div>
    )
  }

  // Поддержка после срыва
  if (step === 'relapse_support') {
    return (
      <div className="p-6 min-h-screen flex flex-col items-center justify-center text-center pb-24 bg-white">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-6">
          <Heart size={40} fill="currentColor" className="text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Срыв — это не конец</h2>
        
        {previousStreak > 0 && (
          <div className="bg-slate-50 px-4 py-3 rounded-xl mb-6 border border-slate-100">
            <p className="text-slate-600 text-sm">
              <span className="font-bold text-slate-800">{previousStreak} дн.</span> до срыва — это время вашей победы. 
              Оно никуда не исчезло. Ваш мозг уже начал перестраиваться.
            </p>
          </div>
        )}
        
        <p className="text-slate-500 mb-8 leading-relaxed">
          Чувство вины сейчас — плохой помощник. Оно может толкнуть к продолжению игры. 
          Простите себя. Выдохните. И начните новый отсчет прямо сейчас.
        </p>

        <div className="space-y-3 w-full">
          <Link to="/sos" className="w-full block">
            <Button variant="danger" fullWidth>Перейти к SOS техникам</Button>
          </Link>
          <Link to="/" className="w-full block">
            <Button variant="secondary" fullWidth>На главную</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Финальный результат
  return (
    <div className="p-6 min-h-screen flex flex-col items-center justify-center text-center pb-24 bg-white">
      <div className="w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 mb-6 animate-bounce">
        <CheckCircle size={40} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Чек-ин сохранён</h2>
      <p className="text-slate-500 mb-8">Ты делаешь важный вклад в свое восстановление.</p>

      {urge >= 7 && (
        <div className="w-full bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6 text-left flex gap-3">
          <AlertTriangle className="text-rose-500 shrink-0" />
          <div>
            <p className="font-bold text-rose-800 text-sm">Высокий уровень тяги</p>
            <p className="text-rose-600 text-xs mb-2">Рекомендуем выполнить технику заземления.</p>
            <Link to="/sos" className="text-rose-700 font-bold text-sm underline">Перейти к SOS</Link>
          </div>
        </div>
      )}

      <Link to="/" className="w-full">
        <Button variant="secondary" fullWidth>На главную</Button>
      </Link>
    </div>
  )
}
