'use client'

import { useTheme } from '@/components/providers/theme-provider'

/**
 * Hook pour la compatibilité avec l'ancien système useDarkMode
 * Utilise maintenant le nouveau ThemeProvider
 * @deprecated Utilisez directement useTheme() à la place
 */
export function useDarkMode() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return { isDarkMode, toggleDarkMode }
}