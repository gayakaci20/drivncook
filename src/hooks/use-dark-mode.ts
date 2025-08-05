'use client'

import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Fonction pour vérifier le mode sombre
    const checkDarkMode = () => {
      const darkMode = localStorage.getItem('darkMode') === 'true' || 
                      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
      setIsDarkMode(darkMode)
    }

    // Vérifier au montage
    checkDarkMode()

    // Écouter les changements de localStorage (pour les autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode') {
        checkDarkMode()
      }
    }

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      if (!localStorage.getItem('darkMode')) {
        checkDarkMode()
      }
    }

    // Écouter les changements de classe sur document.documentElement
    const observer = new MutationObserver(() => {
      const hasClassDark = document.documentElement.classList.contains('dark')
      if (hasClassDark !== isDarkMode) {
        setIsDarkMode(hasClassDark)
      }
    })

    // Observer les changements de classe
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Ajouter les événements
    window.addEventListener('storage', handleStorageChange)
    mediaQuery.addEventListener('change', handleMediaChange)

    // Nettoyer les événements
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      mediaQuery.removeEventListener('change', handleMediaChange)
      observer.disconnect()
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return { isDarkMode, toggleDarkMode }
}