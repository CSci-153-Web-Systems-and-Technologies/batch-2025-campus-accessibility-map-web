'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FeatureType } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useMarkerCreation } from './MarkerCreationContext'

interface MarkerCreationFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialLat?: number
  initialLng?: number
}

export function MarkerCreationForm({ onSuccess, onCancel, initialLat, initialLng }: MarkerCreationFormProps) {
  const [featureType, setFeatureType] = useState<FeatureType>(FeatureType.RAMP)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { refreshMarkers, selectedBuildingId } = useMarkerCreation()

  if (!initialLat || !initialLng) {
    return (
      <div className="text-center text-destructive p-4">
        Error: Location not set. Please click on the map again.
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (typeof initialLat !== 'number' || typeof initialLng !== 'number') {
      setError('Invalid coordinates')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('You must be logged in to add markers')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_type: featureType,
          title: title.trim(),
          description: description.trim() || null,
          latitude: initialLat,
          longitude: initialLng,
          building_id: selectedBuildingId || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create marker')
      }

      const featureId = result.data.id

      if (photos.length > 0) {
        const { uploadFeaturePhotos } = await import('@/lib/utils/photo-handler')
        const { errors: uploadErrors } = await uploadFeaturePhotos(featureId, photos)

        if (uploadErrors.length > 0) {
          const errorMsg = `Feature created successfully, but ${uploadErrors.length} photo(s) failed to upload:\n\n${uploadErrors.join('\n')}\n\nCheck the browser console for more details.`
          setError(errorMsg)
          setIsLoading(false)
          return
        }
      }

      refreshMarkers()
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setError(null)
    
    const { validatePhotoFiles, generatePhotoPreviews } = await import('@/lib/utils/photo-handler')
    const { validFiles, errors } = validatePhotoFiles(files)
    
    if (errors.length > 0) {
      setError(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setPhotos((prev) => [...prev, ...validFiles])
      const previews = await generatePhotoPreviews(validFiles)
      setPhotoPreviews((prev) => [...prev, ...previews])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const featureTypeLabels: Record<FeatureType, string> = {
    [FeatureType.RAMP]: 'Ramp',
    [FeatureType.ELEVATOR]: 'Elevator',
    [FeatureType.ACCESSIBLE_RESTROOM]: 'Accessible Restroom',
    [FeatureType.PARKING]: 'Parking',
    [FeatureType.RESTROOM]: 'Restroom',
    [FeatureType.BENCH]: 'Bench',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="feature_type">Feature Type *</Label>
        <select
          id="feature_type"
          value={featureType}
          onChange={(e) => setFeatureType(e.target.value as FeatureType)}
          className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
          required
        >
          {Object.values(FeatureType).map((type) => (
            <option key={type} value={type}>
              {featureTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Main Building Ramp"
          maxLength={200}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about this feature..."
          maxLength={1000}
          rows={4}
          className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md resize-none"
        />
      </div>

      <div>
        <Label htmlFor="photos">Photos</Label>
        <Input
          id="photos"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handlePhotoChange}
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Upload photos of this feature (max 5MB each)
        </p>
        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {photoPreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center hover:bg-destructive/90 transition-colors"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Marker'}
        </Button>
      </div>
    </form>
  )
}

