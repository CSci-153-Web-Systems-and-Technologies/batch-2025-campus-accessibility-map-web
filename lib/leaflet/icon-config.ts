let iconsConfigured = false

export function configureLeafletIcons() {
  if (typeof window === 'undefined' || iconsConfigured) return
  
  const L = require('leaflet')
  
  delete (L.Icon.Default.prototype as any)._getIconUrl
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
  
  iconsConfigured = true
}

export function createLeafletIcon(options?: {
  iconUrl?: string
  iconRetinaUrl?: string
  shadowUrl?: string
  iconSize?: [number, number]
  iconAnchor?: [number, number]
  popupAnchor?: [number, number]
  shadowSize?: [number, number]
  shadowAnchor?: [number, number]
}) {
  if (typeof window === 'undefined') return null

  const L = require('leaflet')
  
  return L.icon({
    iconRetinaUrl: options?.iconRetinaUrl || 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: options?.iconUrl || 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: options?.shadowUrl || 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: options?.iconSize || [25, 41],
    iconAnchor: options?.iconAnchor || [12, 41],
    popupAnchor: options?.popupAnchor || [1, -34],
    shadowSize: options?.shadowSize || [41, 41],
    shadowAnchor: options?.shadowAnchor || [12, 41],
  })
}
