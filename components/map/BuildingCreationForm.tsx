'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useBuildingCreation } from './BuildingCreationContext'
import { transformApiBuildingToMapBuilding } from '@/lib/utils/building-transform'

interface BuildingCreationFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialLat?: number
  initialLng?: number
}

export function BuildingCreationForm({ onSuccess, onCancel, initialLat, initialLng }: BuildingCreationFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const { addNewBuilding, polygonCoordinates } = useBuildingCreation()

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

    if (!name.trim()) {
      setError('Building name is required')
      return
    }

    if (typeof initialLat !== 'number' || typeof initialLng !== 'number') {
      setError('Invalid coordinates')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          latitude: initialLat,
          longitude: initialLng,
          polygon_coordinates: polygonCoordinates || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create building')
      }

      try {
        const mapBuilding = transformApiBuildingToMapBuilding(result.data)
        addNewBuilding(mapBuilding)
      } catch {
        addNewBuilding({
          ...result.data,
          coordinates: [result.data.latitude, result.data.longitude],
        } as any)
      }
      if (photoFile) {
        try {
          const fd = new FormData()
          fd.append('file', photoFile)
          await fetch(`/api/buildings/${result.data.id}/photos`, { method: 'POST', body: fd })
        } catch (err) {
          // Photo upload failed
        }
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create building')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name">Building Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Main Building"
          maxLength={200}
          required
        />
      </div>

      <div>
        <Label htmlFor="photo">Photo (optional)</Label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] || null
            setPhotoFile(file)
            if (file) {
              const reader = new FileReader()
              reader.onloadend = () => setPhotoPreview(reader.result as string)
              reader.readAsDataURL(file)
            } else {
              setPhotoPreview(null)
            }
          }}
          className="mt-1"
        />
        {photoPreview && (
          <div className="mt-2">
            <img src={photoPreview} alt="Preview" className="w-32 h-20 object-cover rounded-md border" />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description of the building"
          maxLength={1000}
          rows={4}
          className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Building'}
        </Button>
      </div>
    </form>
  )
}

