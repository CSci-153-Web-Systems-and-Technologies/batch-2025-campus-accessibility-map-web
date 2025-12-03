'use client'

import React from 'react'

interface FeaturePhotoProps {
  photoUrl: string | null | undefined
  alt: string
  className?: string
  width?: number | string
  height?: number | string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  renderImage?: (props: {
    src: string
    alt: string
    className?: string
    style?: React.CSSProperties
    onError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void
  }) => React.ReactNode
}

export function FeaturePhoto({ 
  photoUrl, 
  alt, 
  className = '', 
  width = '100%',
  height = 'auto',
  objectFit = 'cover',
  onError,
  renderImage
}: FeaturePhotoProps) {
  if (!photoUrl) return null

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement
    target.style.display = 'none'
    if (onError) {
      onError(e)
    }
  }

  const imageProps = {
    src: photoUrl,
    alt,
    className,
    style: {
      width,
      height,
      objectFit,
    } as React.CSSProperties,
    onError: handleError,
  }

  if (renderImage) {
    return <>{renderImage(imageProps)}</>
  }

  return (
    <img
      {...imageProps}
      loading="lazy"
    />
  )
}
