'use client'

import { useEffect, useState } from 'react'
import { Polygon, Marker } from 'react-leaflet'
import { divIcon, Icon } from 'leaflet'
import type { LatLng } from '@/types/map'

interface DraggableBuildingPolygonEditorProps {
  center: LatLng
  onPolygonChange: (coordinates: number[][]) => void
  onRemove: () => void
}

function createDefaultPolygon(centerLat: number, centerLng: number, size: number = 0.0003): [number, number][] {
  const offset = size / 2
  
  return [
    [centerLat - offset, centerLng - offset],
    [centerLat - offset, centerLng + offset],
    [centerLat + offset, centerLng + offset],
    [centerLat + offset, centerLng - offset],
  ]
}

const CORNER_ICON = divIcon({
  html: `
    <div style="
      width: 16px;
      height: 16px;
      background-color: #3b82f6;
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: move;
    "></div>
  `,
  className: 'draggable-corner-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export function DraggableBuildingPolygonEditor({ 
  center, 
  onPolygonChange,
  onRemove 
}: DraggableBuildingPolygonEditorProps) {
  const [corners, setCorners] = useState<[number, number][]>(() => 
    createDefaultPolygon(center[0], center[1])
  )

  useEffect(() => {
    onPolygonChange(corners.map(c => [c[0], c[1]]))
  }, [corners, onPolygonChange])

  const handleCornerDrag = (index: number, newPosition: [number, number]) => {
    setCorners(prev => {
      const updated = [...prev]
      updated[index] = newPosition
      return updated as [number, number][]
    })
  }

  return (
    <>
      <Polygon
        positions={corners}
        pathOptions={{
          fillColor: '#93c5fd',
          fillOpacity: 0.4,
          color: '#3b82f6',
          weight: 3,
          opacity: 0.8,
          dashArray: '10, 5',
        }}
      />
      {corners.map((corner, index) => (
        <Marker
          key={index}
          position={corner}
          icon={CORNER_ICON}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target
              const position = marker.getLatLng()
              handleCornerDrag(index, [position.lat, position.lng])
            },
          }}
          zIndexOffset={1000}
        />
      ))}
    </>
  )
}
