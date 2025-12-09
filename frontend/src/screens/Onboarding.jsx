/**
 * Экран онбординга.
 * Фазы: intro -> track -> tests -> results -> money -> complete
 */

import React, { useState, useMemo, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TestCard } from '../components/TestCard'
import { Button } from '../components/Button'
import { MoneySettings } from '../components/MoneySettings'
import { Shield, Brain, Lock, CheckCircle, Activity, AlertTriangle, Zap } from 'lucide-react'
import * as api from '../api/client'

export function Onboarding() {
  const { setTrack, completeOnboarding, profile, recoveryCode } = useStore()
  
  const [phase, setPhase] = useState('intro')
  const [introSlide, setIntroSlide] = useState(0)
  const [currentTestIndex, setCurrentTestIndex] = useState(0)
  const [tempScores, setTempScores] = useState({ impulse: 0, gambling: 0, emotional: 0 })
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [tests, setTests] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Слайды интро
  const slides = [
    { icon: Shield, title: 'Безопасное пространство', text: 'Здесь вас не осудят. Мы помогаем вернуть контроль над жизнью.' },
    { icon: Brain, title: 'Научный подход', text: 'Используем методики КПТ и современные исследования зависимостей.' },
    { icon: Lock, title: 'Полная анонимность', text: 'Мы не храним ваши личные данные. Ваш прогресс защищен кодом.' },
  ]

  // Загрузка тестов онбординга
  const loadNextTest = async () => {
    setIsLoading(true)
    try {
      const result = await api.getNextTest()
      if (result?.test) {
        setTests(prev => [...prev, result.test])
        setIsLoading(false)
        return result.test
      }
    } catch (error) {
      console.error('Failed to load test:', error)
    }
    setIsLoading(false)
    return null
  }

  const handleIntroNext = async () => {
    if (introSlide < 2) {
      setIntroSlide(prev => prev + 1)
    } else {
      // После интро сразу загружаем первый тест (A1)
      const test = await loadNextTest()
      if (test) {
        setPhase('tests')
      } else {
        setPhase('results')
      }
    }
  }

  const handleTrackSelect = async (track) => {
    setSelectedTrack(track)
    try {
      await setTrack(track)
      // После выбора трека загружаем следующий тест (A2/A3/A4)
      const test = await loadNextTest()
      if (test) {
        setCurrentTestIndex(prev => prev + 1)
        setPhase('tests')
      } else {
        setPhase('results')
      }
    } catch (error) {
      console.error('Failed to set track:', error)
      setPhase('tests')
    }
  }

  const handleTestComplete = async (answers) => {
    const test = tests[currentTestIndex]

    // Отправляем результат
    let submitResult = null
    try {
      submitResult = await api.submitTest(test.code, answers)
    } catch (error) {
      console.error('Failed to submit test:', error)
    }

    // Считаем score для локального отображения
    const score = Object.values(answers).reduce((acc, val) =>
      acc + (typeof val === 'number' ? val : 0), 0
    )

    const newScores = { ...tempScores }
    if (test.code === 'A1') newScores.impulse = score
    if (test.code === 'A2') newScores.gambling = score
    if (test.code === 'A5') newScores.emotional = score
    setTempScores(newScores)

    // Проверяем, нужно ли показать выбор трека (после A1)
    if (submitResult?.show_track_selection) {
      setPhase('track')
      return
    }

    // Проверяем, завершён ли онбординг (после A5)
    if (submitResult?.onboarding_completed) {
      setPhase('results')
      return
    }

    // Пробуем загрузить следующий тест онбординга
    const nextTest = await loadNextTest()
    // Проверяем что это тест онбординга (уровень A), а не ежедневный
    if (nextTest && nextTest.level === 'A') {
      setCurrentTestIndex(prev => prev + 1)
    } else {
      setPhase('results')
    }
  }

  const handleFinish = async () => {
    await completeOnboarding(tempScores)
  }

  // Интерпретация результатов
  const getImpulseLevel = (score) => {
    if (score <= 3) return { label: 'Низкая', color: 'text-emerald-500', bg: 'bg-emerald-500', desc: 'Вы хорошо контролируете свои порывы.' }
    if (score <= 6) return { label: 'Средняя', color: 'text-amber-500', bg: 'bg-amber-500', desc: 'Иногда эмоции берут верх над разумом.' }
    return { label: 'Высокая', color: 'text-rose-500', bg: 'bg-rose-500', desc: 'Вам трудно сдерживать импульсы, нужен строгий контроль.' }
  }

  const getGamblingSeverity = (score) => {
    if (score <= 2) return { label: 'Низкий риск', color: 'text-emerald-500', bg: 'bg-emerald-500', desc: 'Проблем с игрой пока не наблюдается.' }
    if (score <= 7) return { label: 'Умеренный риск', color: 'text-amber-500', bg: 'bg-amber-500', desc: 'Есть тревожные звоночки. Будьте осторожны.' }
    return { label: 'Высокий риск', color: 'text-rose-500', bg: 'bg-rose-500', desc: 'Игры начали негативно влиять на вашу жизнь.' }
  }

  const getEmotionalResilience = (score) => {
    if (score >= 5) return { label: 'Высокая', color: 'text-emerald-500', bg: 'bg-emerald-500', desc: 'Вы отлично понимаете свои эмоции.' }
    if (score >= 3) return { label: 'Средняя', color: 'text-amber-500', bg: 'bg-amber-500', desc: 'В стрессе вы можете терять равновесие.' }
    return { label: 'Уязвимость', color: 'text-rose-500', bg: 'bg-rose-500', desc: 'Вам сложно успокоиться самостоятельно.' }
  }

  // ==========================================
  // РЕНДЕР
  // ==========================================

  // Интро
  if (phase === 'intro') {
    const SlideIcon = slides[introSlide].icon
    return (
      <div className="min-h-screen flex flex-col p-6 bg-white justify-between pb-10">
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-600 mb-4 animate-fade-in">
            <SlideIcon size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 animate-slide-up">
            {slides[introSlide].title}
          </h1>
          <p className="text-slate-500 leading-relaxed max-w-xs animate-slide-up">
            {slides[introSlide].text}
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === introSlide ? 'w-8 bg-brand-600' : 'w-2 bg-slate-200'
                }`} 
              />
            ))}
          </div>
          <Button fullWidth onClick={handleIntroNext}>Далее</Button>
        </div>
      </div>
    )
  }

  // Выбор трека
  if (phase === 'track') {
    return (
      <div className="min-h-screen p-6 flex flex-col bg-white">
        <div className="py-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Выберите цель</h2>
          <p className="text-slate-500">С чем мы будем работать? Это определит набор тестов.</p>
        </div>
        
        <div className="space-y-4 flex-1">
          {[
            { id: 'gambling', emoji: '🎰', title: 'Азартные игры', desc: 'Ставки, казино, покер' },
            { id: 'trading', emoji: '📈', title: 'Трейдинг', desc: 'Фьючерсы, крипта, маржиналка' },
            { id: 'digital', emoji: '📱', title: 'Цифровая среда', desc: 'Соцсети, игры, шопоголизм' }
          ].map((t, index) => (
            <button
              key={t.id}
              onClick={() => handleTrackSelect(t.id)}
              className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-brand-500 hover:bg-brand-50 transition-all group active:scale-98 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{t.emoji}</span>
                <div>
                  <h3 className="font-bold text-slate-800 group-hover:text-brand-700">{t.title}</h3>
                  <p className="text-sm text-slate-400 group-hover:text-brand-600/70">{t.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Тесты
  if (phase === 'tests') {
    const test = tests[currentTestIndex]
    
    if (isLoading || !test) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-slate-400">Загрузка теста...</div>
        </div>
      )
    }

    return (
      <div className="min-h-screen p-4 flex flex-col bg-slate-50">
        <div className="py-6">
          <h2 className="text-2xl font-bold text-slate-800">
            Шаг {currentTestIndex + 1}
          </h2>
          <p className="text-slate-500">Ответьте честно, это поможет настроить приложение.</p>
        </div>
        <TestCard 
          key={test.code} 
          test={test} 
          onComplete={handleTestComplete} 
        />
      </div>
    )
  }

  // Результаты
  if (phase === 'results') {
    const impulse = getImpulseLevel(tempScores.impulse)
    const emotional = getEmotionalResilience(tempScores.emotional)
    const gambling = selectedTrack === 'gambling' ? getGamblingSeverity(tempScores.gambling) : null

    return (
      <div className="min-h-screen p-6 bg-white flex flex-col pb-10">
        <div className="py-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Ваш портрет</h1>
          <p className="text-slate-500">Вот что показали тесты. Это наша отправная точка.</p>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto pb-6">
          {/* Impulse Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="text-slate-400" size={20} />
                <h3 className="font-bold text-slate-700">Импульсивность</h3>
              </div>
              <span className={`text-sm font-bold px-2 py-1 rounded-lg bg-white ${impulse.color}`}>
                {impulse.label}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full mb-3 overflow-hidden">
              <div 
                className={`h-full ${impulse.bg}`} 
                style={{ width: `${(tempScores.impulse / 9) * 100}%` }} 
              />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{impulse.desc}</p>
          </div>

          {/* Gambling Severity (Conditional) */}
          {gambling && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 animate-slide-up">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-slate-400" size={20} />
                  <h3 className="font-bold text-slate-700">Риск зависимости</h3>
                </div>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg bg-white ${gambling.color}`}>
                  {gambling.label}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full mb-3 overflow-hidden">
                <div 
                  className={`h-full ${gambling.bg}`} 
                  style={{ width: `${(tempScores.gambling / 12) * 100}%` }} 
                />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{gambling.desc}</p>
            </div>
          )}

          {/* Emotional Card */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="text-slate-400" size={20} />
                <h3 className="font-bold text-slate-700">Осознанность</h3>
              </div>
              <span className={`text-sm font-bold px-2 py-1 rounded-lg bg-white ${emotional.color}`}>
                {emotional.label}
              </span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full mb-3 overflow-hidden">
              <div 
                className={`h-full ${emotional.bg}`} 
                style={{ width: `${(tempScores.emotional / 6) * 100}%` }} 
              />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{emotional.desc}</p>
          </div>
        </div>

        <Button fullWidth onClick={() => setPhase('money')}>Далее</Button>
      </div>
    )
  }

  // Настройки финансов
  if (phase === 'money') {
    return (
      <div className="min-h-screen p-6 bg-white flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
          <MoneySettings 
            onSave={() => setPhase('complete')}
            onSkip={() => setPhase('complete')}
            embedded
          />
        </div>
      </div>
    )
  }

  // Завершение
  return (
    <div className="min-h-screen flex flex-col p-6 bg-white justify-center items-center text-center animate-fade-in">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6">
        <CheckCircle size={48} />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Всё готово!</h1>
      <p className="text-slate-500 mb-8">
        Ваш профиль создан. Сохраните этот код восстановления — это единственный ключ к вашим данным.
      </p>
      
      <div className="bg-slate-100 p-4 rounded-xl font-mono text-xl font-bold tracking-widest text-slate-700 mb-8 select-all w-full border-2 border-dashed border-slate-300">
        {recoveryCode || 'XXXXXXXX'}
      </div>

      <Button fullWidth onClick={handleFinish}>Начать путь</Button>
    </div>
  )
}
