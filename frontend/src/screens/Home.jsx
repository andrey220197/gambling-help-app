/**
 * Главный экран.
 */

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { ARTICLES } from '../constants'
import { Flame, ArrowRight, Book } from 'lucide-react'
import * as api from '../api/client'

// Бейдж "Сэкономлено"
function MoneySavedBadge({ streak, amount }) {
  const saved = streak * amount
  
  const formatMoney = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)} млн`
    if (val >= 1000) return `${Math.floor(val / 1000)} тыс`
    return val.toString()
  }
  
  return (
    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
      <span className="text-lg">💰</span>
      <div>
        <span className="text-emerald-700 font-bold text-sm block leading-none">~{formatMoney(saved)} ₽</span>
        <span className="text-[10px] text-emerald-600/70 font-medium uppercase tracking-wide">сэкономлено</span>
      </div>
    </div>
  )
}

export function Home() {
  const { profile, streak, moneySettings } = useStore()
  const [randomArticle, setRandomArticle] = useState(null)

  useEffect(() => {
    // Пробуем загрузить случайную статью с сервера
    api.getRandomArticle()
      .then(article => setRandomArticle(article))
      .catch(() => {
        // Если не получилось, берём из констант
        setRandomArticle(ARTICLES[Math.floor(Math.random() * ARTICLES.length)])
      })
  }, [])

  const displayArticle = randomArticle || ARTICLES[0]

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Привет! 👋</h1>
          <p className="text-slate-500 text-sm">Один день за раз.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full font-bold text-sm border border-orange-200">
            <Flame size={16} fill="currentColor" />
            <span>{streak?.current || 0} дн.</span>
          </div>
          {moneySettings?.enabled && moneySettings?.showSaved && (
            <MoneySavedBadge 
              streak={streak?.current || 0} 
              amount={moneySettings.averageAmount || 0} 
            />
          )}
        </div>
      </div>

      {/* Main Action */}
      <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl" />
        <h2 className="text-xl font-bold mb-2 relative z-10">Ежедневный чек-ин</h2>
        <p className="text-brand-100 mb-6 text-sm max-w-[80%] relative z-10">
          Отметь своё состояние, чтобы отслеживать прогресс и избегать срывов.
        </p>
        <Link to="/checkin">
          <button className="bg-white text-brand-600 font-bold py-3 px-6 rounded-xl w-full shadow-sm hover:bg-brand-50 transition-colors relative z-10">
            Отметить
          </button>
        </Link>
      </div>

      {/* Diary Quick Access */}
      <Link 
        to="/diary" 
        className="block bg-white border border-slate-100 rounded-2xl p-4 shadow-sm active:scale-98 transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
              <Book size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Дневник мыслей</h3>
              <p className="text-xs text-slate-500">Работа с убеждениями (КПТ)</p>
            </div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
            <ArrowRight size={20} />
          </div>
        </div>
      </Link>

      {/* Daily Content */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 text-lg">Почитать сегодня</h3>
        <Link 
          to="/articles" 
          className="block bg-white border border-slate-100 rounded-2xl p-5 shadow-sm active:scale-98 transition-transform"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              {displayArticle.category}
            </span>
            <span className="text-xs text-slate-400">{displayArticle.readTime}</span>
          </div>
          <h4 className="font-bold text-slate-800 text-lg mb-1">{displayArticle.title}</h4>
          <p className="text-slate-500 text-sm line-clamp-2 mb-4">
            {displayArticle.content?.substring(0, 100)}...
          </p>
          <div className="flex items-center text-brand-600 text-sm font-medium">
            Читать <ArrowRight size={16} className="ml-1" />
          </div>
        </Link>
      </div>
      
      {/* Emergency CTA */}
      <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-rose-700">Тяжелый момент?</h4>
          <p className="text-rose-600/70 text-sm">Используй SOS техники</p>
        </div>
        <Link to="/sos" className="bg-rose-200 p-2 rounded-lg text-rose-700">
          <ArrowRight />
        </Link>
      </div>
    </div>
  )
}
