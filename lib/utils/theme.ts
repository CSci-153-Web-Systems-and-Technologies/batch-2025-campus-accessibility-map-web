export interface ThemeColors {
  primary: string
  secondary: string
  tertiary: string
  error: string
  neutral: string
  neutralVariant: string
}

export const DEFAULT_THEME: ThemeColors = {
  primary: '#769CDF',
  secondary: '#8991A2',
  tertiary: '#A288A6',
  error: '#FF5449',
  neutral: '#919093',
  neutralVariant: '#8E9098',
}

export const THEME_2: ThemeColors = {
  primary: '#B33B15',
  secondary: '#B88576',
  tertiary: '#A58F44',
  error: '#FF5449',
  neutral: '#998E8C',
  neutralVariant: '#A08C87',
}

export const THEME_3: ThemeColors = {
  primary: '#63A002',
  secondary: '#85976E',
  tertiary: '#4D9D98',
  error: '#FF5449',
  neutral: '#91918B',
  neutralVariant: '#8F9285',
}

export const THEMES = {
  default: DEFAULT_THEME,
  theme2: THEME_2,
  theme3: THEME_3,
} as const

export type ContrastLevel = 'low' | 'medium' | 'high'

export type ThemeName = keyof typeof THEMES

export function hexToHsl(hex: string): string {
  hex = hex.replace('#', '')
  
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function lightenHsl(hsl: string, lightenPercent: number = 25): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!match) return hsl

  const [, h, s, l] = match
  const newL = Math.min(100, parseInt(l) + lightenPercent)
  return `${h} ${s}% ${newL}%`
}

export function darkenHsl(hsl: string, darkenPercent: number = 4): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!match) return hsl

  const [, h, s, l] = match
  const newL = Math.max(0, parseInt(l) - darkenPercent)
  return `${h} ${s}% ${newL}%`
}

function adjustContrast(hsl: string, contrastLevel: ContrastLevel, isDark: boolean): string {
  const match = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!match) return hsl

  const [, h, s, l] = match
  let lightness = parseInt(l)
  
  if (isDark) {
    switch (contrastLevel) {
      case 'low':
        lightness = Math.min(95, lightness + 5)
        break
      case 'medium':
        break
      case 'high':
        lightness = Math.max(5, lightness - 10)
        break
    }
  } else {
    switch (contrastLevel) {
      case 'low':
        lightness = Math.max(5, lightness - 5)
        break
      case 'medium':
        break
      case 'high':
        lightness = Math.min(95, lightness + 10)
        break
    }
  }
  
  return `${h} ${s}% ${lightness}%`
}

export function generateM3Theme(theme: ThemeColors, isDark: boolean = false, contrastLevel: ContrastLevel = 'medium') {
  let primaryHsl = hexToHsl(theme.primary)
  let secondaryHsl = hexToHsl(theme.secondary)
  let tertiaryHsl = hexToHsl(theme.tertiary)
  let errorHsl = hexToHsl(theme.error)
  let neutralHsl = hexToHsl(theme.neutral)
  let neutralVariantHsl = hexToHsl(theme.neutralVariant)

  primaryHsl = adjustContrast(primaryHsl, contrastLevel, isDark)
  secondaryHsl = adjustContrast(secondaryHsl, contrastLevel, isDark)
  tertiaryHsl = adjustContrast(tertiaryHsl, contrastLevel, isDark)
  neutralHsl = adjustContrast(neutralHsl, contrastLevel, isDark)
  neutralVariantHsl = adjustContrast(neutralVariantHsl, contrastLevel, isDark)

  if (isDark) {
    return {
      'm3-primary': '0 0% 60%',
      'm3-on-primary': '0 0% 10%',
      'm3-primary-container': '0 0% 25%',
      'm3-on-primary-container': '0 0% 90%',
      'm3-primary-hover': '0 0% 65%',
      'm3-primary-pressed': '0 0% 55%',
      
      'm3-secondary': '0 0% 55%',
      'm3-on-secondary': '0 0% 10%',
      'm3-secondary-container': '0 0% 22%',
      'm3-on-secondary-container': '0 0% 88%',
      'm3-secondary-hover': '0 0% 60%',
      'm3-secondary-pressed': '0 0% 50%',
      
      'm3-tertiary': '0 0% 50%',
      'm3-on-tertiary': '0 0% 10%',
      'm3-tertiary-container': '0 0% 20%',
      'm3-on-tertiary-container': '0 0% 85%',
      'm3-tertiary-hover': '0 0% 55%',
      'm3-tertiary-pressed': '0 0% 45%',
      
      'm3-error': '4 100% 70%',
      'm3-on-error': '0 0% 100%',
      'm3-error-container': '4 100% 30%',
      'm3-on-error-container': '4 100% 90%',
      'm3-error-hover': '4 100% 74%',
      'm3-error-pressed': '4 100% 66%',
      
      'm3-surface': contrastLevel === 'high' ? '0 0% 5%' : contrastLevel === 'low' ? '0 0% 12%' : '0 0% 8%',
      'm3-on-surface': contrastLevel === 'high' ? '0 0% 98%' : contrastLevel === 'low' ? '0 0% 90%' : '0 0% 95%',
      'm3-surface-variant': '0 0% 15%',
      'm3-on-surface-variant': contrastLevel === 'high' ? '0 0% 85%' : contrastLevel === 'low' ? '0 0% 75%' : '0 0% 80%',
      'm3-surface-dim': '0 0% 5%',
      'm3-surface-bright': '0 0% 12%',
      
      'm3-outline': contrastLevel === 'high' ? '0 0% 60%' : contrastLevel === 'low' ? '0 0% 40%' : '0 0% 50%',
      'm3-outline-variant': '0 0% 30%',
    }
  } else {
    return {
      'm3-primary': primaryHsl,
      'm3-on-primary': '0 0% 100%',
      'm3-primary-container': lightenHsl(primaryHsl, 25),
      'm3-on-primary-container': darkenHsl(primaryHsl, 42),
      'm3-primary-hover': darkenHsl(primaryHsl, 4),
      'm3-primary-pressed': darkenHsl(primaryHsl, 8),
      
      'm3-secondary': secondaryHsl,
      'm3-on-secondary': '0 0% 100%',
      'm3-secondary-container': lightenHsl(secondaryHsl, 33),
      'm3-on-secondary-container': darkenHsl(secondaryHsl, 34),
      'm3-secondary-hover': darkenHsl(secondaryHsl, 4),
      'm3-secondary-pressed': darkenHsl(secondaryHsl, 8),
      
      'm3-tertiary': tertiaryHsl,
      'm3-on-tertiary': '0 0% 100%',
      'm3-tertiary-container': lightenHsl(tertiaryHsl, 33),
      'm3-on-tertiary-container': darkenHsl(tertiaryHsl, 34),
      'm3-tertiary-hover': darkenHsl(tertiaryHsl, 4),
      'm3-tertiary-pressed': darkenHsl(tertiaryHsl, 8),
      
      'm3-error': errorHsl,
      'm3-on-error': '0 0% 100%',
      'm3-error-container': lightenHsl(errorHsl, 31),
      'm3-on-error-container': darkenHsl(errorHsl, 39),
      'm3-error-hover': darkenHsl(errorHsl, 4),
      'm3-error-pressed': darkenHsl(errorHsl, 8),
      
      'm3-surface': contrastLevel === 'high' ? '0 0% 100%' : contrastLevel === 'low' ? '0 0% 98%' : '0 0% 100%',
      'm3-on-surface': contrastLevel === 'high' 
        ? darkenHsl(neutralHsl, 45) 
        : contrastLevel === 'low' 
        ? darkenHsl(neutralHsl, 30) 
        : darkenHsl(neutralHsl, 37),
      'm3-surface-variant': lightenHsl(neutralVariantHsl, 38),
      'm3-on-surface-variant': contrastLevel === 'high'
        ? darkenHsl(neutralVariantHsl, 25)
        : contrastLevel === 'low'
        ? darkenHsl(neutralVariantHsl, 12)
        : darkenHsl(neutralVariantHsl, 18),
      'm3-surface-dim': lightenHsl(neutralHsl, 30),
      'm3-surface-bright': '0 0% 100%',
      
      'm3-outline': contrastLevel === 'high'
        ? darkenHsl(neutralVariantHsl, 15)
        : contrastLevel === 'low'
        ? darkenHsl(neutralVariantHsl, 3)
        : darkenHsl(neutralVariantHsl, 8),
      'm3-outline-variant': lightenHsl(neutralVariantHsl, 22),
    }
  }
}

export function applyTheme(theme: ThemeColors, isDark: boolean = false, contrastLevel: ContrastLevel = 'medium') {
  if (typeof window === 'undefined') return

  const m3Theme = generateM3Theme(theme, isDark, contrastLevel)
  const root = document.documentElement

  Object.entries(m3Theme).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value)
  })

  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  try {
    localStorage.setItem('theme-colors', JSON.stringify(theme))
    localStorage.setItem('theme-dark', JSON.stringify(isDark))
    localStorage.setItem('theme-contrast', contrastLevel)
  } catch (error) {
  }
}

export function loadContrastLevel(): ContrastLevel {
  if (typeof window === 'undefined') return 'medium'
  
  try {
    const saved = localStorage.getItem('theme-contrast')
    if (saved && (saved === 'low' || saved === 'medium' || saved === 'high')) {
      return saved as ContrastLevel
    }
  } catch (error) {
  }
  
  return 'medium'
}

export function loadTheme(): ThemeColors {
  if (typeof window === 'undefined') return DEFAULT_THEME

  try {
    const themeName = localStorage.getItem('theme-name') as ThemeName
    if (themeName && THEMES[themeName]) {
      return THEMES[themeName]
    }
    
    const saved = localStorage.getItem('theme-colors')
    if (saved) {
      return JSON.parse(saved) as ThemeColors
    }
  } catch (error) {
  }

  return DEFAULT_THEME
}

export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const saved = localStorage.getItem('theme-dark')
    if (saved !== null) {
      return JSON.parse(saved) as boolean
    }
  } catch (error) {
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

