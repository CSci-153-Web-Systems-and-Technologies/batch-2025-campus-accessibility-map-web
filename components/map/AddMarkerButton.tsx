'use client'

import { FaPlus } from 'react-icons/fa'
import { useMarkerCreation } from './MarkerCreationContext'

export function AddMarkerButton() {
  const { setCreating } = useMarkerCreation()

  return (
    <button
      onClick={() => setCreating(true)}
      className="w-14 h-14 rounded-full bg-m3-primary text-m3-on-primary shadow-lg hover:bg-m3-primary-hover active:bg-m3-primary-pressed active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-m3-primary focus:ring-offset-2"
      aria-label="Add Marker"
    >
      <FaPlus className="w-6 h-6" />
    </button>
  )
}

