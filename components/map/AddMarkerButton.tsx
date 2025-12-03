'use client'

import { FaPlus } from 'react-icons/fa'
import { useMarkerCreation } from './MarkerCreationContext'

export function AddMarkerButton() {
  const { setCreating } = useMarkerCreation()

  return (
    <button
      onClick={() => setCreating(true)}
      className="absolute bottom-4 right-4 z-[1000] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Add Marker"
    >
      <FaPlus className="w-6 h-6" />
    </button>
  )
}

