'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useMarkerCreation } from './MarkerCreationContext'

export function AddMarkerButton() {
  const { setCreating } = useMarkerCreation()

  return (
    <Button
      onClick={() => setCreating(true)}
      className="absolute top-4 right-4 z-[1000] shadow-lg"
      size="lg"
    >
      <Plus className="w-5 h-5 mr-2" />
      Add Marker
    </Button>
  )
}

