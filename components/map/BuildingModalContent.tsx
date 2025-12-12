'use client'

import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Building, AccessibilityFeature } from '@/types/map'
import { FeaturePhoto } from './FeaturePhoto'
import { safeFetch } from '@/lib/fetch-utils'
import type { ApiFeatureWithPhotos } from '@/types/database'
import { transformApiFeatureToMapFeature } from '@/lib/utils/feature-transform'
import { DEFAULT_FETCH_LIMIT } from '@/lib/constants'
import { useFeatureModal } from './FeatureModalContext'
import { useBuildingModal } from './BuildingModalContext'
import { useAdmin } from '@/lib/hooks/use-admin'
import { createClient } from '@/lib/supabase/client'
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
  const [hasLoadedFeatures, setHasLoadedFeatures] = useState(false)
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
  const [user, setUser] = useState<User | null>(null)
  const isOwner = user?.id && building.created_by && building.created_by === user.id

  useEffect(() => {
    if (!building.id) return

    const abortController = new AbortController()
    let isActive = true

    async function fetchFeatures() {
      setIsLoading(true)
      setHasLoadedFeatures(false)
      setError(null)

      try {
        const { data, error: fetchError } = await safeFetch<ApiFeatureWithPhotos[]>(
          `/api/features?building_id=${building.id}&limit=${DEFAULT_FETCH_LIMIT}`,
          { signal: abortController.signal }
        )

        if (!isActive) return

        if (fetchError) {
          if (fetchError.name !== 'AbortError') {
            setError(fetchError.message)
          }
          return
        }

        if (data) {
          const featuresData: AccessibilityFeature[] = data.map(transformApiFeatureToMapFeature)
          setFeatures(featuresData)
        }
      } finally {
        if (!isActive) return
        setIsLoading(false)
        setHasLoadedFeatures(true)
      }
    }

    fetchFeatures()

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [building.id])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  const [buildingPhotoUrl, setBuildingPhotoUrl] = useState<string | null>(null)

  const buildingPhoto = buildingPhotoUrl
    ? { full_url: buildingPhotoUrl, photo_url: building.photo_path }
    : (features.length > 0 && features[0].photos && features[0].photos.length > 0
      ? features[0].photos[0]
      : null)

  useEffect(() => {
    if (!building.photo_path) {
      setBuildingPhotoUrl(null)
      return
    }
    try {
      const supabase = createClient()
      const publicUrl = supabase.storage.from('building-photos').getPublicUrl(building.photo_path).data.publicUrl
      setBuildingPhotoUrl(publicUrl)
    } catch (err) {
      setBuildingPhotoUrl(null)
    }
  }, [building.photo_path])

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
      // Realtime subscription will update the building automatically
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update building. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [building.id, editData, isSaving])

  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)

  const handleEditPhotoChange = async (file: File | null) => {
    setEditPhotoFile(file)
    if (!file) {
      setEditPhotoPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setEditPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUploadEditPhoto = async () => {
    if (!editPhotoFile) return
    try {
      const fd = new FormData()
      fd.append('file', editPhotoFile)
      const res = await fetch(`/api/buildings/${building.id}/photos`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      setEditPhotoFile(null)
      setEditPhotoPreview(null)
      // Realtime subscription will update the building automatically
    } catch (err) {
      alert('Failed to upload photo')
    }
  }

  const handleDelete = useCallback(async () => {
    if (isDeleting || !isAdmin) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/buildings/${building.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete building')
      }

      // close modal and rely on realtime subscriptions to remove the building from the map
      closeModal()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete building. Please try again.')
      setIsDeleting(false)
    }
  }, [building.id, isDeleting, closeModal, isAdmin])

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
            onClick={() => {
              if (!buildingPhoto) return
              setFullScreenImage((buildingPhoto.full_url ?? buildingPhoto.photo_url) ?? null)
            }}
          >
            {buildingPhoto ? (
              <FeaturePhoto
                photoUrl={(buildingPhoto.full_url ?? buildingPhoto.photo_url) ?? null}
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
                <div>
                  <Label htmlFor="building-photo">Photo (optional)</Label>
                  <input
                    id="building-photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEditPhotoChange(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                  {editPhotoPreview && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={editPhotoPreview} alt="Preview" className="w-28 h-20 object-cover rounded-md border" />
                      <div className="flex gap-2">
                        <Button onClick={handleUploadEditPhoto} disabled={!editPhotoFile || isSaving}>Upload Photo</Button>
                        <Button variant="outline" onClick={() => handleEditPhotoChange(null)} disabled={isSaving}>Remove</Button>
                      </div>
                    </div>
                  )}
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
          {isLoading || !hasLoadedFeatures ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="relative flex animate-pulse gap-3 p-4 md:p-5 border rounded-xl bg-m3-secondary-container min-h-[112px] md:min-h-[128px]">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/5 rounded-lg bg-muted/40"></div>
                    <div className="h-4 w-full rounded-lg bg-muted/40"></div>
                    <div className="h-4 w-4/5 rounded-lg bg-muted/40"></div>
                  </div>
                </div>
              ))}
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

