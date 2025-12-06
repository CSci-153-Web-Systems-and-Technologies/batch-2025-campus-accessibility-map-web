'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { BuildingModalContent } from './BuildingModalContent'
import { useBuildingModal } from './BuildingModalContext'

export function BuildingModal() {
  const { selectedBuilding, isOpen, animationOrigin, closeModal } = useBuildingModal()

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeModal])

  const [animationStyle, setAnimationStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!isOpen || !animationOrigin) {
      setAnimationStyle({})
      return
    }

    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    
    const offsetX = animationOrigin.x - centerX
    const offsetY = animationOrigin.y - centerY

    setAnimationStyle({
      '--initial-x': `${offsetX}px`,
      '--initial-y': `${offsetY}px`,
    } as React.CSSProperties)
  }, [isOpen, animationOrigin])

  if (!isOpen || !selectedBuilding) return null

  return (
    <div 
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 feature-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeModal()
        }
      }}
    >
      <div 
        className="relative w-[76vw] md:w-[68vw] lg:w-[56vw] h-[90vh] md:h-[85vh] max-w-[1120px] max-h-[95vh] flex items-center justify-center feature-modal-content"
        style={animationStyle}
      >
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 md:top-4 md:right-4 z-50 w-9 h-9 md:w-10 md:h-10 rounded-full bg-background hover:bg-background/90 text-foreground flex items-center justify-center shadow-xl border transition-all hover:scale-110"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
        <div className="w-full h-full">
          <BuildingModalContent building={selectedBuilding} />
        </div>
      </div>
    </div>
  )
}

