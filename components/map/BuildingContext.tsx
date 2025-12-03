'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Building } from '@/types/map'

interface BuildingContextType {
  selectedBuilding: Building | null
  isWindowOpen: boolean
  selectBuilding: (building: Building | null) => void
  openWindow: (building: Building) => void
  closeWindow: () => void
}

const BuildingContext = createContext<BuildingContextType | undefined>(undefined)

export function BuildingProvider({ children }: { children: ReactNode }) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [isWindowOpen, setIsWindowOpen] = useState(false)

  const selectBuilding = (building: Building | null) => {
    setSelectedBuilding(building)
  }

  const openWindow = (building: Building) => {
    setSelectedBuilding(building)
    setIsWindowOpen(true)
  }

  const closeWindow = () => {
    setIsWindowOpen(false)
    setSelectedBuilding(null)
  }

  return (
    <BuildingContext.Provider
      value={{
        selectedBuilding,
        isWindowOpen,
        selectBuilding,
        openWindow,
        closeWindow,
      }}
    >
      {children}
    </BuildingContext.Provider>
  )
}

export function useBuilding() {
  const context = useContext(BuildingContext)
  if (!context) {
    throw new Error('useBuilding must be used within a BuildingProvider')
  }
  return context
}

