'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { useMapControl } from './MapControlContext'

export function MapControlInitializer() {
  const map = useMap()
  const { setMapInstance } = useMapControl()

  useEffect(() => {
    setMapInstance(map)
    return () => {
      setMapInstance(null)
    }
  }, [map, setMapInstance])

  return null
}

