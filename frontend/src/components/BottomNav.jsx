/**
 * Нижняя навигация.
 */

import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, ClipboardCheck, User, AlertCircle, BookOpen } from 'lucide-react'
import { triggerHaptic } from '../hooks/useTelegram'

const navItems = [
  { to: '/', icon: Home, label: 'Главная' },
  { to: '/checkin', icon: ClipboardCheck, label: 'Чек-ин' },
  { to: '/sos', icon: AlertCircle, label: 'SOS' },
  { to: '/articles', icon: BookOpen, label: 'Статьи' },
  { to: '/profile', icon: User, label: 'Профиль' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 pt-2 pb-safe z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => triggerHaptic('selection')}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors
              ${isActive 
                ? 'text-brand-600' 
                : 'text-slate-400 hover:text-slate-600'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
