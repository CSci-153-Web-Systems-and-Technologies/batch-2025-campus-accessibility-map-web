'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { LatLng } from '@/types/map'

interface MarkerCreationContextType {
  isCreating: boolean
  setCreating: (creating: boolean) => void
  clickedCoordinates: LatLng | null
  setClickedCoordinates: (coords: LatLng | null) => void
  openModal: () => void
  closeModal: () => void
  isModalOpen: boolean
  refreshMarkers: () => void
  markersRefreshTrigger: number
}

const MarkerCreationContext = createContext<MarkerCreationContextType | undefined>(undefined)

export function MarkerCreationProvider({ children }: { children: ReactNode }) {
  const [isCreating, setIsCreating] = useState(false)
  const [clickedCoordinates, setClickedCoordinates] = useState<LatLng | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [markersRefreshTrigger, setMarkersRefreshTrigger] = useState(0)

  const openModal = () => {
    setIsModalOpen(true)
    setIsCreating(false)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setClickedCoordinates(null)
    setIsCreating(false)
  }

  const refreshMarkers = () => {
    setMarkersRefreshTrigger(prev => prev + 1)
  }

  return (
    <MarkerCreationContext.Provider
      value={{
        isCreating,
        setCreating: setIsCreating,
        clickedCoordinates,
        setClickedCoordinates,
        openModal,
        closeModal,
        isModalOpen,
        refreshMarkers,
        markersRefreshTrigger,
      }}
    >
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

