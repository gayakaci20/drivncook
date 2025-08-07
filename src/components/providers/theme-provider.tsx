'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  isDarkMode: boolean
  setTheme: (theme: Theme) => void
  toggleDarkMode: () => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  isDarkMode: false,
  setTheme: () => null,
  toggleDarkMode: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'drivncook-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme
    const savedTheme = storedTheme || defaultTheme
    
    const oldDarkMode = localStorage.getItem('darkMode')
    if (oldDarkMode !== null && !storedTheme) {
      const legacyTheme = oldDarkMode === 'true' ? 'dark' : 'light'
      setTheme(legacyTheme)
      localStorage.setItem(storageKey, legacyTheme)
      localStorage.removeItem('darkMode')
    } else {
      setTheme(savedTheme)
    }
  }, [defaultTheme, storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    let effectiveTheme: 'light' | 'dark'

    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      effectiveTheme = theme
    }

    root.classList.add(effectiveTheme)
    setIsDarkMode(effectiveTheme === 'dark')

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        const newEffectiveTheme = mediaQuery.matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(newEffectiveTheme)
        setIsDarkMode(newEffectiveTheme === 'dark')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const value = {
    theme,
    isDarkMode,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
    toggleDarkMode: () => {
      const newTheme = isDarkMode ? 'light' : 'dark'
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}