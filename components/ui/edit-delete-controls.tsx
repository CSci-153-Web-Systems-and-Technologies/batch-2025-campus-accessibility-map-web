'use client'

import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface EditDeleteControlsProps {
  onEdit: () => void
  onDelete: () => void
  onSave?: () => void
  onCancel?: () => void
  isEditing?: boolean
  isSaving?: boolean
  isDeleting?: boolean
  showEdit?: boolean
  showDelete?: boolean
  className?: string
  editLabel?: string
  deleteLabel?: string
  saveLabel?: string
  cancelLabel?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EditDeleteControls({
  onEdit,
  onDelete,
  onSave,
  onCancel,
  isEditing = false,
  isSaving = false,
  isDeleting = false,
  showEdit = true,
  showDelete = true,
  className = '',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
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
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          size="icon"
          variant="ghost"
          onClick={onSave}
          disabled={isSaving}
          className={`${sizes.button} rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-primary shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={saveLabel}
        >
          {isSaving ? <Loader2 className={`${sizes.icon} animate-spin`} /> : <Check className={sizes.icon} />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          className={`${sizes.button} rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={cancelLabel}
        >
          <X className={sizes.icon} />
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showEdit && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          disabled={isDeleting}
          className={`${sizes.button} rounded-full bg-m3-secondary-container hover:bg-m3-secondary-hover/20 text-m3-on-secondary-container shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
          aria-label={editLabel}
        >
          <Pencil className={sizes.icon} />
        </Button>
      )}
      {showDelete && (
        confirmDelete ? (
          <div className={`flex items-center gap-2 bg-m3-surface rounded-lg px-2 py-1.5 md:px-2 md:py-1 border border-m3-outline shadow-xl`}>
            <span className={`${sizes.text} text-m3-error`}>Delete?</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`${sizes.confirmButton} touch-manipulation`}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
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
            disabled={isDeleting}
            className={`${sizes.button} rounded-full bg-m3-secondary-container hover:bg-m3-secondary-hover/20 text-m3-error hover:text-m3-error shadow-xl border border-m3-outline transition-all hover:scale-110 touch-manipulation`}
            aria-label={deleteLabel}
          >
            <Trash2 className={sizes.icon} />
          </Button>
        )
      )}
    </div>
  )
}

