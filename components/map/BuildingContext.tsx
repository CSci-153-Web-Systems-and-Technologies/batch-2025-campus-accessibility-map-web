'use client'

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react'
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

  const selectBuilding = useCallback((building: Building | null) => {
    setSelectedBuilding(building)
  }, [])

  const openWindow = useCallback((building: Building) => {
    setSelectedBuilding(building)
    setIsWindowOpen(true)
  }, [])

  const closeWindow = useCallback(() => {
    setIsWindowOpen(false)
    setSelectedBuilding(null)
  }, [])

  const contextValue = useMemo(() => ({
    selectedBuilding,
    isWindowOpen,
    selectBuilding,
    openWindow,
    closeWindow,
  }), [selectedBuilding, isWindowOpen, selectBuilding, openWindow, closeWindow])

  return (
    <BuildingContext.Provider value={contextValue}>
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

