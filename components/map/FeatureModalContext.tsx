'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { AccessibilityFeature } from '@/types/map'

interface AnimationOrigin {
  x: number
  y: number
}

interface FeatureModalContextType {
  selectedFeature: AccessibilityFeature | null
  isOpen: boolean
  animationOrigin: AnimationOrigin | null
  openModal: (feature: AccessibilityFeature, origin?: AnimationOrigin) => void
  closeModal: () => void
}

const FeatureModalContext = createContext<FeatureModalContextType | undefined>(undefined)

export function FeatureModalProvider({ children }: { children: ReactNode }) {
  const [selectedFeature, setSelectedFeature] = useState<AccessibilityFeature | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [animationOrigin, setAnimationOrigin] = useState<AnimationOrigin | null>(null)

  const openModal = useCallback((feature: AccessibilityFeature, origin?: AnimationOrigin) => {
    setSelectedFeature(feature)
    setAnimationOrigin(origin || null)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      setSelectedFeature(null)
      setAnimationOrigin(null)
    }, 300)
  }, [])

  return (
    <FeatureModalContext.Provider value={{
      selectedFeature,
      isOpen,
      animationOrigin,
      openModal,
      closeModal,
    }}>
      {children}
    </FeatureModalContext.Provider>
  )
}

export function useFeatureModal() {
  const context = useContext(FeatureModalContext)
  if (context === undefined) {
    throw new Error('useFeatureModal must be used within a FeatureModalProvider')
  }
  return context
}

