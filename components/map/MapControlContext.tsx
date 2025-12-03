'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { Map } from 'leaflet'

interface MapControlContextType {
  mapInstance: Map | null
  setMapInstance: (map: Map | null) => void
}

const MapControlContext = createContext<MapControlContextType | undefined>(undefined)

export function MapControlProvider({ children }: { children: ReactNode }) {
  const [mapInstance, setMapInstance] = useState<Map | null>(null)

  return (
    <MapControlContext.Provider value={{ mapInstance, setMapInstance }}>
      {children}
    </MapControlContext.Provider>
  )
}

export function useMapControl() {
  const context = useContext(MapControlContext)
  if (!context) {
    throw new Error('useMapControl must be used within MapControlProvider')
  }
  return context
}

