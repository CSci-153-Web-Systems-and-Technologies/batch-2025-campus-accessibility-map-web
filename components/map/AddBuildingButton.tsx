'use client'

import { FaBuilding } from 'react-icons/fa'
import { useBuildingCreation } from './BuildingCreationContext'
import { useAdmin } from '@/lib/hooks/use-admin'

export function AddBuildingButton() {
  const { setCreating } = useBuildingCreation()
  const { isAdmin, isLoading } = useAdmin()

  if (isLoading || !isAdmin) {
    return null
  }

  return (
    <button
      onClick={() => setCreating(true)}
      className="absolute bottom-4 right-20 z-[1000] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Add Building"
    >
      <FaBuilding className="w-6 h-6" />
    </button>
  )
}

