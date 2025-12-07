'use client'

import { useEffect, useState } from 'react'
import { applyTheme, loadTheme, isDarkMode, loadContrastLevel, ThemeColors, DEFAULT_THEME, THEMES, ThemeName, ContrastLevel } from '@/lib/utils/theme'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeColors>(() => {
    if (typeof window !== 'undefined') {
      return loadTheme()
    }
    return DEFAULT_THEME
  })
  
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-name')
      return (saved as ThemeName) || 'default'
    }
    return 'default'
  })
  
  const [dark, setDarkState] = useState(() => {
    if (typeof window !== 'undefined') {
      return isDarkMode()
    }
    return false
  })

  const [contrastLevel, setContrastLevelState] = useState<ContrastLevel>(() => {
    if (typeof window !== 'undefined') {
      return loadContrastLevel()
    }
    return 'medium'
  })

  useEffect(() => {
    applyTheme(theme, dark, contrastLevel)
  }, [theme, dark, contrastLevel])

  const setTheme = (newTheme: ThemeColors) => {
    setThemeState(newTheme)
  }

  const setThemeByName = (name: ThemeName) => {
    const selectedTheme = THEMES[name]
    setThemeState(selectedTheme)
    setThemeNameState(name)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-name', name)
    }
  }

  const updateThemeColor = (key: keyof ThemeColors, value: string) => {
    setThemeState(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const resetTheme = () => {
    setThemeState(DEFAULT_THEME)
    setThemeNameState('default')
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-name', 'default')
    }
  }

  const toggleDarkMode = () => {
    setDarkState(prev => !prev)
  }

  const setContrastLevel = (level: ContrastLevel) => {
    setContrastLevelState(level)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-contrast', level)
    }
  }

  return {
    theme,
    themeName,
    setTheme,
    setThemeByName,
    updateThemeColor,
    resetTheme,
    isDark: dark,
    toggleDarkMode,
    contrastLevel,
    setContrastLevel,
  }
}

