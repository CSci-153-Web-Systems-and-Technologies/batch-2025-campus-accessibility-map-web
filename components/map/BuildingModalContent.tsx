'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Building, AccessibilityFeature } from '@/types/map'
import { FeaturePhoto } from './FeaturePhoto'
import { safeFetch } from '@/lib/fetch-utils'
import type { ApiFeatureWithPhotos } from '@/types/database'
import { transformApiFeatureToMapFeature } from '@/lib/utils/feature-transform'
import { DEFAULT_FETCH_LIMIT } from '@/lib/constants'
import { useFeatureModal } from './FeatureModalContext'
import { useBuildingModal } from './BuildingModalContext'
import { useAdmin } from '@/lib/hooks/use-admin'
import { EditDeleteControls } from '@/components/ui/edit-delete-controls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FeatureTypeBadge } from '@/components/ui/feature-type-badge'
import { X } from 'lucide-react'
import { RouteToHereButton } from './RouteToHereButton'
import type L from 'leaflet'

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
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)
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
    <>
      {fullScreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setFullScreenImage(null)}
        >
          <button
            onClick={() => setFullScreenImage(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-m3-surface hover:bg-m3-surface/90 text-m3-on-surface flex items-center justify-center shadow-xl border border-m3-outline transition-all hover:scale-110 z-10"
            aria-label="Close full screen image"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={fullScreenImage}
            alt={building.name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div className="w-full h-full flex flex-col bg-m3-surface rounded-lg border overflow-hidden relative">
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-50 flex gap-2 flex-shrink-0">
        <RouteToHereButton 
          lat={building.coordinates[0]}
          lng={building.coordinates[1]}
        />
        {isAdmin && !isEditing ? (
          <EditDeleteControls
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClose={closeModal}
            isDeleting={isDeleting}
            showClose={true}
            size="md"
            editLabel="Edit building"
            deleteLabel="Delete building"
            closeLabel="Close modal"
          />
        ) : (
          <EditDeleteControls
            onEdit={() => {}}
            onDelete={() => {}}
            onClose={closeModal}
            showEdit={false}
            showDelete={false}
            showClose={true}
            size="md"
            closeLabel="Close modal"
          />
        )}
      </div>
      <header className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-m3-surface h-1/2 min-h-0">
        <div className="p-4 md:p-6 lg:p-8 lg:pr-4 flex items-center justify-center min-w-0 min-h-0">
          <div 
            className="relative w-full h-full flex items-center justify-center bg-m3-surface-variant rounded-xl overflow-hidden border-4 border-m3-outline cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => buildingPhoto && setFullScreenImage(buildingPhoto.full_url || buildingPhoto.photo_url)}
          >
            {buildingPhoto ? (
              <FeaturePhoto
                photoUrl={buildingPhoto.full_url || buildingPhoto.photo_url}
                alt={building.name}
                className="w-full h-full"
                height="100%"
                objectFit="cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-m3-on-surface-variant text-base md:text-lg bg-m3-surface-variant/50">
                <span>No photo available</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 md:p-6 lg:p-8 lg:pl-4 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          <div className="space-y-3 md:space-y-4">
             {isEditing ? (
               <div className="space-y-3">
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
                 
                 <div className="flex gap-2">
                   <Button
                     onClick={handleSave}
                     disabled={isSaving || !editData.name.trim()}
                     className="flex-1"
                   >
                     {isSaving ? 'Saving...' : 'Save'}
                   </Button>
                   <Button
                     variant="outline"
                     onClick={handleCancel}
                     disabled={isSaving}
                   >
                     Cancel
                   </Button>
                 </div>
               </div>
             ) : (
              <>
                <div>
                  <h1 className="font-bold text-2xl md:text-3xl mb-2 md:mb-3 mt-8 md:mt-10 text-m3-primary leading-tight">
                    {building.name}
                  </h1>
                </div>

                {building.description && (
                  <div className="pt-2 md:pt-3">
                    <div className="bg-m3-tertiary-container border rounded-xl p-4 md:p-5 shadow-sm">
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

      <main className="h-1/2 flex flex-col min-h-0 overflow-hidden bg-m3-surface">
        <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4 flex-shrink-0 bg-m3-surface">
          <h2 className="font-semibold text-sm md:text-base text-foreground">
            Accessibility Features <span className="text-muted-foreground font-normal">({features.length})</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-4 md:py-5 min-h-0 bg-m3-surface">
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
                  className="p-4 md:p-5 border rounded-xl hover:bg-m3-surface-variant/50 transition-all bg-m3-secondary-container shadow-sm hover:shadow-md cursor-pointer flex flex-col min-h-[112px] md:min-h-[128px]"
                >
                  <div className="flex-1 min-w-0 mb-3">
                    <h3 className="font-semibold text-base md:text-lg text-foreground mb-1.5 leading-tight">
                      {feature.title}
                    </h3>
                    <div className="mb-2">
                      <FeatureTypeBadge 
                        featureType={feature.feature_type} 
                        size="sm"
                      />
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
                        className="w-full rounded-lg border-4 border-m3-outline"
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
    </>
  )
}

