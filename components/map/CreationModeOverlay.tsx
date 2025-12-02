'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface CreationModeOverlayProps {
  onCancel: () => void
}

export function CreationModeOverlay({ onCancel }: CreationModeOverlayProps) {
  return (
    <>
      <div className="absolute inset-0 z-[1500] pointer-events-none">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-xl p-4 max-w-md mx-4 border">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold">Add a Marker</h3>
              <p className="text-sm text-muted-foreground">
                Click on the map where you want to place the marker
              </p>
              <Button 
                variant="outline" 
                onClick={onCancel} 
                size="sm"
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

