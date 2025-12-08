'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface BuildingCreationOverlayProps {
  onCancel: () => void
  onContinue: () => void
}

export function BuildingCreationOverlay({ onCancel, onContinue }: BuildingCreationOverlayProps) {
  return (
    <>
      <div className="absolute inset-0 z-[1500] pointer-events-none">
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-xl p-4 max-w-md mx-4 border">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-bold">Add a Building</h3>
              <p className="text-sm text-muted-foreground">
                Click on the map to create a building area. Drag the corners to adjust the shape.
              </p>
              <p className="text-xs text-muted-foreground">
              "Continue" to add building details
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={onCancel} 
                  size="sm"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={onContinue} 
                  size="sm"
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

