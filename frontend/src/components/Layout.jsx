/**
 * Layout с нижней навигацией.
 */

import React from 'react'
import { BottomNav } from './BottomNav'
import { useStore } from '../store/useStore'

export function Layout({ children }) {
  const { isOnboarding } = useStore()
  
  return (
    <div className="min-h-screen bg-slate-50">
      <main className={isOnboarding ? '' : 'pb-nav'}>
        {children}
      </main>
      {!isOnboarding && <BottomNav />}
    </div>
  )
}
