/**
 * Универсальная кнопка.
 */

import React from 'react'
import { triggerHaptic } from '../hooks/useTelegram'

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false,
  disabled = false,
  className = '',
  ...props 
}) {
  const baseStyles = 'font-bold py-3 px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/30',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  }
  
  const handleClick = (e) => {
    if (disabled) return
    triggerHaptic('light')
    onClick?.(e)
  }
  
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
