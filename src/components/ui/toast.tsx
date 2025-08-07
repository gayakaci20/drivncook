'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export default function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<Array<{id: number, message: string, type: string}>>([])

  const showToast = (message: string, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, {id, message, type}])
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-3 rounded-lg shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' : 
            toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}