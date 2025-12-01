'use client'
import { useEffect, useState, useRef } from 'react'

export default function MapPage() {
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<any>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mapRef.current) return

    const timer = setTimeout(async () => {
      const L = require('leaflet')
      const { MapContainer, TileLayer } = require('react-leaflet')
      const { createRoot } = require('react-dom/client')
      
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      const MapComponent = () => (
        <MapContainer center={[40.7128, -74.0060]} zoom={15} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
      )

      if (!rootRef.current) {
        rootRef.current = createRoot(mapRef.current!)
      }
      rootRef.current.render(<MapComponent />)
    }, 100)

    return () => clearTimeout(timer)
  }, [isClient])

  if (!isClient) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading map...</div>
  }

  return (
    <div className="h-screen w-screen">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}
