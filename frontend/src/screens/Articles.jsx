/**
 * Экран статей.
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ARTICLES } from '../constants'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import * as api from '../api/client'

export function Articles() {
  const [articles, setArticles] = useState(ARTICLES)
  const [selectedArticle, setSelectedArticle] = useState(null)

  // Пробуем загрузить статьи с сервера
  useEffect(() => {
    api.getArticles()
      .then(data => {
        if (data && data.length > 0) {
          setArticles(data)
        }
      })
      .catch(() => {
        // Используем локальные статьи
      })
  }, [])

  // Отображение статьи
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center gap-3 z-10">
          <button 
            onClick={() => setSelectedArticle(null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              {selectedArticle.category}
            </span>
          </div>
          <span className="text-xs text-slate-400">{selectedArticle.readTime}</span>
        </div>

        {/* Content */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            {selectedArticle.title}
          </h1>
          <div className="prose prose-slate max-w-none">
            {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-slate-600 leading-relaxed mb-4">
                {paragraph.split('**').map((part, i) => 
                  i % 2 === 1 
                    ? <strong key={i} className="text-slate-800">{part}</strong> 
                    : part
                )}
              </p>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Список статей
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white p-4 border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-slate-600" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Статьи</h1>
        </div>
      </div>

      {/* Articles List */}
      <div className="p-4 space-y-4">
        {articles.map((article, index) => (
          <button
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="w-full text-left bg-white rounded-2xl p-5 shadow-sm border border-slate-100 active:scale-98 transition-transform animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-500 bg-brand-50 px-2 py-1 rounded">
                {article.category}
              </span>
              <span className="text-xs text-slate-400">{article.readTime}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">{article.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mb-3">
              {article.content.substring(0, 100)}...
            </p>
            <div className="flex items-center text-brand-600 text-sm font-medium">
              Читать <ArrowRight size={16} className="ml-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
            <BookOpen size={32} />
          </div>
          <h3 className="font-bold text-slate-700 mb-2">Статьи загружаются</h3>
          <p className="text-slate-500 text-sm">Скоро здесь появится полезный контент</p>
        </div>
      )}
    </div>
  )
}
