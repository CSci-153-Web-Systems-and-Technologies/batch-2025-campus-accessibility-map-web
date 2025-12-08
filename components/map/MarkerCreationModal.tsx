'use client'

import { X } from 'lucide-react'
import { MarkerCreationForm } from './MarkerCreationForm'

interface MarkerCreationModalProps {
  isOpen: boolean
  onClose: () => void
  initialLat?: number
  initialLng?: number
}

export function MarkerCreationModal({ isOpen, onClose, initialLat, initialLng }: MarkerCreationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Add Accessibility Feature</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <MarkerCreationForm
            onSuccess={onClose}
            onCancel={onClose}
            initialLat={initialLat}
            initialLng={initialLng}
          />
        </div>
      </div>
    </div>
  )
}

