'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { LatLng, Building } from '@/types/map'

interface BuildingCreationContextType {
  isCreating: boolean
  setCreating: (creating: boolean) => void
  clickedCoordinates: LatLng | null
  setClickedCoordinates: (coords: LatLng | null) => void
  polygonCoordinates: number[][] | null
  setPolygonCoordinates: (coords: number[][] | null) => void
  openModal: () => void
  closeModal: () => void
  isModalOpen: boolean
  addNewBuilding: (building: Building) => void
  newBuilding: Building | null
}

const BuildingCreationContext = createContext<BuildingCreationContextType | undefined>(undefined)

export function BuildingCreationProvider({ children }: { children: ReactNode }) {
  const [isCreating, setIsCreating] = useState(false)
  const [clickedCoordinates, setClickedCoordinates] = useState<LatLng | null>(null)
  const [polygonCoordinates, setPolygonCoordinates] = useState<number[][] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newBuilding, setNewBuilding] = useState<Building | null>(null)

  const openModal = useCallback(() => {
    setIsModalOpen(true)
    setIsCreating(false)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setClickedCoordinates(null)
    setPolygonCoordinates(null)
    setIsCreating(false)
  }, [])

  const addNewBuilding = useCallback((building: Building) => {
    setNewBuilding(building)
    setTimeout(() => setNewBuilding(null), 100)
  }, [])

  return (
    <BuildingCreationContext.Provider value={{
      isCreating,
      setCreating: setIsCreating,
      clickedCoordinates,
      setClickedCoordinates,
      polygonCoordinates,
      setPolygonCoordinates,
      openModal,
      closeModal,
      isModalOpen,
      addNewBuilding,
      newBuilding,
    }}>
      {children}
    </BuildingCreationContext.Provider>
  )
}

export function useBuildingCreation() {
  const context = useContext(BuildingCreationContext)
  if (!context) {
    throw new Error('useBuildingCreation must be used within BuildingCreationProvider')
  }
  return context
}

