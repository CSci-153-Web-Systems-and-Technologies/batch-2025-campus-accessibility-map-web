'use client'

import { FeatureType } from '@/types/database'
import { formatFeatureType } from '@/lib/utils/feature-utils'
import { getFeatureColor, hexToRgba } from '@/lib/utils/feature-colors'
import { cn } from '@/lib/utils'

interface FeatureTypeBadgeProps {
  featureType: FeatureType
  className?: string
  variant?: 'default' | 'outline' | 'solid'
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1.5 text-xs md:text-sm',
  lg: 'px-4 py-2 text-sm md:text-base',
}

export function FeatureTypeBadge({ 
  featureType, 
  className,
  variant = 'default',
  size = 'md'
}: FeatureTypeBadgeProps) {
  const color = getFeatureColor(featureType)
  const baseClasses = 'inline-flex items-center rounded-full font-semibold border transition-colors'
  
  const variantClasses = {
    default: '',
    outline: 'bg-transparent border-2',
    solid: 'text-white border-transparent',
  }

  const classes = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    className
  )

  const style = variant === 'solid' 
    ? { backgroundColor: color, borderColor: color }
    : variant === 'outline'
    ? { 
        borderColor: hexToRgba(color, 0.3),
        color: color 
      }
    : { 
        backgroundColor: hexToRgba(color, 0.1),
        borderColor: hexToRgba(color, 0.2),
        color: color 
      }

  return (
    <div 
      className={classes}
      style={style}
    >
      {formatFeatureType(featureType)}
    </div>
  )
}

