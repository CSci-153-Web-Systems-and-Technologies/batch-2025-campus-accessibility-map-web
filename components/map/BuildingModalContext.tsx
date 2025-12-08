'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Building } from '@/types/map'

interface AnimationOrigin {
  x: number
  y: number
}

interface BuildingModalContextType {
  selectedBuilding: Building | null
  isOpen: boolean
  animationOrigin: AnimationOrigin | null
  openModal: (building: Building, origin?: AnimationOrigin) => void
  closeModal: () => void
}

const BuildingModalContext = createContext<BuildingModalContextType | undefined>(undefined)

export function BuildingModalProvider({ children }: { children: ReactNode }) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [animationOrigin, setAnimationOrigin] = useState<AnimationOrigin | null>(null)

  const openModal = useCallback((building: Building, origin?: AnimationOrigin) => {
    setSelectedBuilding(building)
    setAnimationOrigin(origin || null)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      setSelectedBuilding(null)
      setAnimationOrigin(null)
    }, 300)
  }, [])

  return (
    <BuildingModalContext.Provider value={{
      selectedBuilding,
      isOpen,
      animationOrigin,
      openModal,
      closeModal,
    }}>
      {children}
    </BuildingModalContext.Provider>
  )
}

export function useBuildingModal() {
  const context = useContext(BuildingModalContext)
  if (context === undefined) {
    throw new Error('useBuildingModal must be used within a BuildingModalProvider')
  }
  return context
}


