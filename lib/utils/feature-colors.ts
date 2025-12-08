import { FeatureType } from '@/types/database'

/**
 * Feature type color mapping using Tailwind config colors
 * This centralizes feature colors and removes duplication
 */
export const FEATURE_TYPE_COLORS: Record<FeatureType, string> = {
  [FeatureType.RAMP]: '#ef4444',
  [FeatureType.ELEVATOR]: '#3b82f6',
  [FeatureType.ACCESSIBLE_RESTROOM]: '#10b981',
  [FeatureType.PARKING]: '#f97316',
  [FeatureType.RESTROOM]: '#8b5cf6',
  [FeatureType.BENCH]: '#eab308',
} as const

/**
 * Get feature color by type
 * @param featureType - The feature type
 * @returns Hex color string
 */
export function getFeatureColor(featureType: FeatureType): string {
  return FEATURE_TYPE_COLORS[featureType] || FEATURE_TYPE_COLORS[FeatureType.RAMP]
}

/**
 * Get Tailwind class name for feature color
 * Maps feature types to Tailwind config feature colors
 */
export function getFeatureColorClass(featureType: FeatureType): string {
  const colorMap: Record<FeatureType, string> = {
    [FeatureType.RAMP]: 'feature-ramp',
    [FeatureType.ELEVATOR]: 'feature-elevator',
    [FeatureType.ACCESSIBLE_RESTROOM]: 'feature-accessibleRestroom',
    [FeatureType.PARKING]: 'feature-parking',
    [FeatureType.RESTROOM]: 'feature-restroom',
    [FeatureType.BENCH]: 'feature-bench',
  }
  return colorMap[featureType] || 'feature-ramp'
}

/**
 * Convert hex color to rgba with opacity
 * @param hex - Hex color string (e.g., '#ef4444')
 * @param opacity - Opacity value between 0 and 1
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

