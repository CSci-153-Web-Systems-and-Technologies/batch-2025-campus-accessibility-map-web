'use client'

import { useTheme } from '@/lib/hooks/use-theme'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Moon, Sun } from 'lucide-react'
import { THEMES, ThemeName } from '@/lib/utils/theme'

const THEME_NAMES: { name: ThemeName; label: string; colors: { primary: string; secondary: string; tertiary: string } }[] = [
  {
    name: 'default',
    label: 'Default',
    colors: {
      primary: THEMES.default.primary,
      secondary: THEMES.default.secondary,
      tertiary: THEMES.default.tertiary,
    },
  },
  {
    name: 'theme2',
    label: 'Theme 2',
    colors: {
      primary: THEMES.theme2.primary,
      secondary: THEMES.theme2.secondary,
      tertiary: THEMES.theme2.tertiary,
    },
  },
  {
    name: 'theme3',
    label: 'Theme 3',
    colors: {
      primary: THEMES.theme3.primary,
      secondary: THEMES.theme3.secondary,
      tertiary: THEMES.theme3.tertiary,
    },
  },
]

export function ThemeSelector() {
  const { themeName, setThemeByName, isDark, toggleDarkMode, contrastLevel, setContrastLevel } = useTheme()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Theme Settings</h3>
        <p className="text-sm text-m3-on-surface-variant mt-1">
          Customize the appearance of the app
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Color Theme</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {THEME_NAMES.map((theme) => (
            <button
              key={theme.name}
              onClick={() => setThemeByName(theme.name)}
              className={`p-2 sm:p-4 border-2 rounded-lg transition-colors ${
                themeName === theme.name
                  ? 'border-m3-primary bg-m3-primary-container'
                  : 'border-m3-outline bg-m3-tertiary-container hover:border-m3-primary'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div className="flex gap-1 sm:gap-1.5 justify-center">
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-m3-outline flex-shrink-0"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-m3-outline flex-shrink-0"
                    style={{ backgroundColor: theme.colors.secondary }}
                  />
                  <div
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-m3-outline flex-shrink-0"
                    style={{ backgroundColor: theme.colors.tertiary }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-medium text-m3-on-surface">
                  {theme.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Contrast Level</Label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setContrastLevel(level)}
              className={`p-2 sm:p-3 border-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${
                contrastLevel === level
                  ? 'border-m3-primary bg-m3-primary-container text-m3-on-primary-container'
                  : 'border-m3-outline bg-m3-tertiary-container hover:border-m3-primary text-m3-on-surface'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 border border-m3-outline rounded-lg bg-m3-tertiary-container">
        <div>
          <Label className="text-sm font-medium">Dark Mode</Label>
        </div>
        <Button
          variant="outline"
          onClick={toggleDarkMode}
          className="gap-2 w-full sm:w-auto"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4" />
              Light
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              Dark
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

