'use client'

import { useEffect, useState, ReactNode } from 'react'
import { X } from 'lucide-react'

interface AnimationOrigin {
  x: number
  y: number
}

import { Z_INDEX } from '@/lib/constants'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  zIndex?: number
  animationOrigin?: AnimationOrigin | null
  hideCloseButton?: boolean
}

export function Modal({ isOpen, onClose, children, zIndex = 3000, animationOrigin, hideCloseButton = false }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

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

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 feature-modal-backdrop"
      style={{ zIndex }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="relative w-full sm:w-[90vw] md:w-[68vw] lg:w-[56vw] h-[95vh] sm:h-[90vh] md:h-[85vh] max-w-[1120px] max-h-[95vh] flex items-center justify-center feature-modal-content rounded-lg sm:rounded-none overflow-hidden"
        style={animationStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-50 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface flex items-center justify-center shadow-xl border border-m3-outline transition-all hover:scale-110"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>
        )}
        <div className="w-full h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

