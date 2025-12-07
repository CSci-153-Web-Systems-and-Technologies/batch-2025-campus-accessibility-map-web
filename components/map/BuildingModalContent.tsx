'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Building, AccessibilityFeature } from '@/types/map'
import { FeaturePhoto } from './FeaturePhoto'
import { formatFeatureType } from '@/lib/utils/feature-utils'
import { safeFetch } from '@/lib/fetch-utils'
import type { ApiFeatureWithPhotos } from '@/types/database'
import { transformApiFeatureToMapFeature } from '@/lib/utils/feature-transform'
import { DEFAULT_FETCH_LIMIT } from '@/lib/constants'
import { useFeatureModal } from './FeatureModalContext'
import { useBuildingModal } from './BuildingModalContext'
import { useAdmin } from '@/lib/hooks/use-admin'
import { EditDeleteControls } from '@/components/ui/edit-delete-controls'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface BuildingModalContentProps {
  building: Building
}

export function BuildingModalContent({ building }: BuildingModalContentProps) {
  const [features, setFeatures] = useState<AccessibilityFeature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editData, setEditData] = useState({
    name: building.name,
    description: building.description || '',
  })
  const { isAdmin } = useAdmin()
  const { openModal: openFeatureModal } = useFeatureModal()
  const { closeModal } = useBuildingModal()

  useEffect(() => {
    if (!building.id) return

    const abortController = new AbortController()

    async function fetchFeatures() {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await safeFetch<ApiFeatureWithPhotos[]>(
        `/api/features?building_id=${building.id}&limit=${DEFAULT_FETCH_LIMIT}`,
        { signal: abortController.signal }
      )

      if (fetchError) {
        if (fetchError.name !== 'AbortError') {
          console.error('Error fetching building features:', fetchError)
          setError(fetchError.message)
        }
        setIsLoading(false)
        return
      }

      if (data) {
        const featuresData: AccessibilityFeature[] = data.map(transformApiFeatureToMapFeature)
        setFeatures(featuresData)
      }

      setIsLoading(false)
    }

    fetchFeatures()

    return () => {
      abortController.abort()
    }
  }, [building.id])

  const buildingPhoto = features.length > 0 && features[0].photos && features[0].photos.length > 0
    ? features[0].photos[0]
    : null

  const handleFeatureClick = (feature: AccessibilityFeature) => {
    openFeatureModal(feature)
  }

  const handleEdit = useCallback(() => {
    setIsEditing(true)
    setEditData({
      name: building.name,
      description: building.description || '',
    })
  }, [building])

  const handleCancel = useCallback(() => {
    setIsEditing(false)
    setEditData({
      name: building.name,
      description: building.description || '',
    })
  }, [building])

  const handleSave = useCallback(async () => {
    if (isSaving || !editData.name.trim()) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/buildings/${building.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name.trim(),
          description: editData.description.trim() || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update building')
      }

      setIsEditing(false)
      window.location.reload()
    } catch (error) {
      console.error('Error updating building:', error)
      alert(error instanceof Error ? error.message : 'Failed to update building. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [building.id, editData, isSaving])

  const handleDelete = useCallback(async () => {
    if (isDeleting) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/buildings/${building.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete building')
      }

      closeModal()
      window.location.reload()
    } catch (error) {
      console.error('Error deleting building:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete building. Please try again.')
      setIsDeleting(false)
    }
  }, [building.id, isDeleting, closeModal])

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg border overflow-hidden relative">
      {isAdmin && (
        <div className="absolute top-2 right-12 md:top-4 md:right-16 z-50">
          <EditDeleteControls
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={isEditing}
            isSaving={isSaving}
            isDeleting={isDeleting}
            size="md"
            editLabel="Edit building"
            deleteLabel="Delete building"
          />
        </div>
      )}
      <header className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-gradient-to-br from-card to-muted/20 h-1/2 min-h-0">
        <div className="p-4 md:p-6 lg:p-8 lg:pr-4 flex items-center justify-center min-w-0 min-h-0">
          <div className="relative w-full h-full flex items-center justify-center bg-muted rounded-xl overflow-hidden border-2 border-border">
            {buildingPhoto ? (
              <FeaturePhoto
                photoUrl={buildingPhoto.full_url || buildingPhoto.photo_url}
                alt={building.name}
                className="w-full h-full"
                height="100%"
                objectFit="cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-base md:text-lg bg-muted/50">
                <span>No photo available</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 md:p-6 lg:p-8 lg:pl-4 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          <div className="space-y-3 md:space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="building-name">Building Name *</Label>
                  <Input
                    id="building-name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="e.g., Main Building"
                    maxLength={200}
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <Label htmlFor="building-description">Description</Label>
                  <Textarea
                    id="building-description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Optional description of the building"
                    maxLength={1000}
                    rows={4}
                    className="mt-1"
                    disabled={isSaving}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="font-bold text-2xl md:text-3xl mb-2 md:mb-3 text-foreground leading-tight">
                    {building.name}
                  </h1>
                </div>

                {building.description && (
                  <div className="pt-2 md:pt-3">
                    <div className="bg-card border rounded-xl p-4 md:p-5 shadow-sm">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 md:mb-3">
                        Description
                      </h3>
                      <p className="text-sm md:text-base text-foreground leading-relaxed">
                        {building.description}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="h-1/2 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4 flex-shrink-0">
          <h2 className="font-semibold text-sm md:text-base text-foreground">
            Accessibility Features <span className="text-muted-foreground font-normal">({features.length})</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-5 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Loading features...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-base text-destructive">{error}</p>
              </div>
            </div>
          ) : features.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-base text-muted-foreground">No accessibility features recorded for this building yet.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 auto-rows-fr">
              {features.map((feature) => (
                <article
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className="p-4 md:p-5 border rounded-xl hover:bg-muted/50 transition-all bg-card shadow-sm hover:shadow-md cursor-pointer flex flex-col min-h-[112px] md:min-h-[128px]"
                >
                  <div className="flex-1 min-w-0 mb-3">
                    <h3 className="font-semibold text-base md:text-lg text-foreground mb-1.5 leading-tight">
                      {feature.title}
                    </h3>
                    <div className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs border border-primary/20 mb-2">
                      {formatFeatureType(feature.feature_type)}
                    </div>
                    {feature.description && (
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2 break-words mt-2">
                        {feature.description}
                      </p>
                    )}
                  </div>
                  
                  {feature.photos && feature.photos.length > 0 && (
                    <div className="mt-auto pt-2">
                      <FeaturePhoto
                        photoUrl={feature.photos[0].full_url || feature.photos[0].photo_url}
                        alt={feature.title}
                        className="w-full rounded-lg"
                        height="120px"
                        objectFit="cover"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

