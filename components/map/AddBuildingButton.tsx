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
      className="absolute bottom-4 right-20 z-[1000] w-14 h-14 rounded-full bg-m3-primary text-m3-on-primary shadow-lg hover:bg-m3-primary-hover active:bg-m3-primary-pressed active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-m3-primary focus:ring-offset-2"
      aria-label="Add Building"
    >
      <FaBuilding className="w-6 h-6" />
    </button>
  )
}

