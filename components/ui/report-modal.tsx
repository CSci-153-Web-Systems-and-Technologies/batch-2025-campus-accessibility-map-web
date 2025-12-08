'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Textarea } from './textarea'
import { Label } from './label'
import { X } from 'lucide-react'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
  title: string
  isSubmitting?: boolean
}

export function ReportModal({ isOpen, onClose, onSubmit, title, isSubmitting = false }: ReportModalProps) {
  const [reason, setReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      alert('Please provide a reason for reporting')
      return
    }
    await onSubmit(reason.trim())
    setReason('')
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('')
      onClose()
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setReason('')
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 z-[4000]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose()
        }
      }}
    >
      <div 
        className="w-full max-w-md bg-m3-surface rounded-lg border overflow-hidden flex flex-col relative shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 sm:p-4 border-b border-m3-outline flex-shrink-0 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-m3-primary">{title}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface flex items-center justify-center shadow-xl border border-m3-outline transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-3 sm:p-4">
          <div className="mb-3 sm:mb-4">
            <Label htmlFor="report-reason" className="block mb-1.5 text-sm text-m3-on-surface">
              Reason for reporting <span className="text-m3-error">*</span>
            </Label>
            <Textarea
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you are reporting this content..."
              className="min-h-[100px] text-sm resize-none"
              maxLength={500}
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-m3-on-surface-variant mt-1">
              {reason.length}/500 characters
            </p>
          </div>

          <div className="flex gap-2 justify-end flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || !reason.trim()}
              size="sm"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

