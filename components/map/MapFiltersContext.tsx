'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { FeatureType } from '@/types/database'

interface MapFiltersContextType {
  enabledFeatureTypes: Set<FeatureType>
  toggleFeatureType: (type: FeatureType) => void
  isFeatureTypeEnabled: (type: FeatureType) => boolean
  enableAllTypes: () => void
  disableAllTypes: () => void
}

const MapFiltersContext = createContext<MapFiltersContextType | undefined>(undefined)

export function MapFiltersProvider({ children }: { children: ReactNode }) {
  const [enabledFeatureTypes, setEnabledFeatureTypes] = useState<Set<FeatureType>>(
    new Set(Object.values(FeatureType))
  )

  const toggleFeatureType = (type: FeatureType) => {
    setEnabledFeatureTypes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  const isFeatureTypeEnabled = (type: FeatureType) => {
    return enabledFeatureTypes.has(type)
  }

  const enableAllTypes = () => {
    setEnabledFeatureTypes(new Set(Object.values(FeatureType)))
  }

  const disableAllTypes = () => {
    setEnabledFeatureTypes(new Set())
  }

  return (
    <MapFiltersContext.Provider value={{
      enabledFeatureTypes,
      toggleFeatureType,
      isFeatureTypeEnabled,
      enableAllTypes,
      disableAllTypes,
    }}>
      {children}
    </MapFiltersContext.Provider>
  )
}

export function useMapFilters() {
  const context = useContext(MapFiltersContext)
  if (!context) {
    throw new Error('useMapFilters must be used within MapFiltersProvider')
  }
  return context
}

