'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Check, X, Loader2, Flag } from 'lucide-react'
import { useState } from 'react'

interface EditDeleteControlsProps {
  onEdit: () => void
  onDelete: () => void
  onReport?: () => void
  onSave?: () => void
  onCancel?: () => void
  onClose?: () => void
  isEditing?: boolean
  isSaving?: boolean
  isDeleting?: boolean
  isReporting?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showReport?: boolean
  showClose?: boolean
  className?: string
  editLabel?: string
  deleteLabel?: string
  reportLabel?: string
  closeLabel?: string
  saveLabel?: string
  cancelLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EditDeleteControls({
  onEdit,
  onDelete,
  onReport,
  onSave,
  onCancel,
  onClose,
  isEditing = false,
  isSaving = false,
  isDeleting = false,
  isReporting = false,
  showEdit = true,
  showDelete = true,
  showReport = false,
  showClose = false,
  className = '',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  reportLabel = 'Report',
  closeLabel = 'Close',
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  size = 'md',
}: EditDeleteControlsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sizeClasses = {
    sm: {
      button: 'w-8 h-8 md:w-7 md:h-7',
      icon: 'w-4 h-4',
      text: 'text-xs',
      confirmButton: 'h-6 px-1.5 text-xs',
    },
    md: {
      button: 'w-10 h-10 md:w-9 md:h-9',
      icon: 'w-5 h-5 md:w-5 md:h-5',
      text: 'text-xs md:text-xs',
      confirmButton: 'h-7 px-2.5 md:h-6 md:px-2 text-xs',
    },
    lg: {
      button: 'w-12 h-12 md:w-10 md:h-10',
      icon: 'w-6 h-6 md:w-5 md:h-5',
      text: 'text-sm md:text-xs',
      confirmButton: 'h-8 px-3 md:h-7 md:px-2.5 text-sm md:text-xs',
    },
  }

  const sizes = sizeClasses[size]

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete()
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
    }
  }

  const handleCancel = () => {
    setConfirmDelete(false)
    onCancel?.()
  }

  if (isEditing && onSave && onCancel) {
    return (
      <div className={`flex items-center gap-1.5 md:gap-2 flex-wrap ${className}`}>
        <Button
          size="icon"
          variant="ghost"
          onClick={onSave}
          disabled={isSaving}
          className={`${sizes.button} flex-shrink-0 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-primary shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={saveLabel}
        >
          {isSaving ? <Loader2 className={`${sizes.icon} animate-spin`} /> : <Check className={sizes.icon} />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          className={`${sizes.button} flex-shrink-0 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={cancelLabel}
        >
          <X className={sizes.icon} />
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 md:gap-2 flex-wrap ${className}`}>
      {showEdit && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          disabled={isDeleting || isReporting}
          className={`${sizes.button} flex-shrink-0 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-hover/20 text-m3-on-secondary-container shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={editLabel}
        >
          <Pencil className={sizes.icon} />
        </Button>
      )}
      {showReport && onReport && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onReport}
          disabled={isDeleting || isReporting || isEditing}
          className={`${sizes.button} flex-shrink-0 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-hover/20 text-m3-error shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={reportLabel}
        >
          {isReporting ? <Loader2 className={`${sizes.icon} animate-spin`} /> : <Flag className={sizes.icon} />}
        </Button>
      )}
      {showDelete && (
        confirmDelete ? (
          <div className={`flex items-center gap-1.5 md:gap-2 flex-shrink-0 bg-m3-surface rounded-lg px-2 py-1.5 md:px-2 md:py-1 border border-m3-outline shadow-xl`}>
            <span className={`${sizes.text} text-m3-error`}>Delete?</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isReporting}
              className={`${sizes.confirmButton} touch-manipulation`}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting || isReporting}
              className={`${sizes.confirmButton} touch-manipulation`}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setConfirmDelete(true)}
            disabled={isDeleting || isReporting}
            className={`${sizes.button} flex-shrink-0 rounded-full bg-m3-secondary-container hover:bg-m3-secondary-hover/20 text-m3-error hover:text-m3-error shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
            aria-label={deleteLabel}
          >
            <Trash2 className={sizes.icon} />
          </Button>
        )
      )}
      {showClose && onClose && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          disabled={isDeleting || isReporting || isEditing}
          className={`${sizes.button} flex-shrink-0 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={closeLabel}
        >
          <X className={sizes.icon} />
        </Button>
      )}
    </div>
  )
}

