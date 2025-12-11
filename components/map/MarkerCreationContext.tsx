'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { LatLng } from '@/types/map'

import type { AccessibilityFeature } from '@/types/map'

interface MarkerCreationContextType {
  isCreating: boolean
  setCreating: (creating: boolean) => void
  clickedCoordinates: LatLng | null
  setClickedCoordinates: (coords: LatLng | null) => void
  selectedBuildingId: string | null
  setSelectedBuildingId: (buildingId: string | null) => void
  openModal: () => void
  closeModal: () => void
  isModalOpen: boolean
  addNewFeature: (feature: AccessibilityFeature) => void
  newFeature: AccessibilityFeature | null
}

const MarkerCreationContext = createContext<MarkerCreationContextType | undefined>(undefined)

export function MarkerCreationProvider({ children }: { children: ReactNode }) {
  const [isCreating, setIsCreating] = useState(false)
  const [clickedCoordinates, setClickedCoordinates] = useState<LatLng | null>(null)
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newFeature, setNewFeature] = useState<AccessibilityFeature | null>(null)

  const openModal = useCallback(() => {
    setIsModalOpen(true)
    setIsCreating(false)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setClickedCoordinates(null)
    setSelectedBuildingId(null)
    setIsCreating(false)
  }, [])

  const addNewFeature = useCallback((feature: AccessibilityFeature) => {
    setNewFeature(feature)
    setTimeout(() => setNewFeature(null), 100)
  }, [])

  return (
    <MarkerCreationContext.Provider value={{
      isCreating,
      setCreating: setIsCreating,
      clickedCoordinates,
      setClickedCoordinates,
      selectedBuildingId,
      setSelectedBuildingId,
      openModal,
      closeModal,
      isModalOpen,
      addNewFeature,
      newFeature,
    }}>
      {children}
    </MarkerCreationContext.Provider>
  )
}

export function useMarkerCreation() {
  const context = useContext(MarkerCreationContext)
  if (!context) {
    throw new Error('useMarkerCreation must be used within MarkerCreationProvider')
  }
  return context
}

