const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface PhotoValidationResult {
  validFiles: File[]
  errors: string[]
}

export function validatePhotoFiles(files: File[]): PhotoValidationResult {
  const validFiles: File[] = []
  const errors: string[] = []

  files.forEach((file) => {
    if (!file.type.startsWith('image/')) {
      errors.push(`Only image files are allowed. ${file.name} is not an image.`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Image size must be less than 5MB. ${file.name} is too large.`)
      return
    }
    validFiles.push(file)
  })

  return { validFiles, errors }
}

export function generatePhotoPreviews(files: File[]): Promise<string[]> {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              resolve(reader.result as string)
            } else {
              reject(new Error(`Failed to read ${file.name}`))
            }
          }
          reader.onerror = () => reject(new Error(`Error reading ${file.name}`))
          reader.readAsDataURL(file)
        })
    )
  )
}

export interface PhotoUploadResult {
  success: boolean
  error?: string
  data?: any
}

export async function uploadFeaturePhoto(
  featureId: string,
  photo: File,
  isPrimary: boolean = false
): Promise<PhotoUploadResult> {
  try {
    const formData = new FormData()
    formData.append('file', photo)
    formData.append('is_primary', isPrimary ? 'true' : 'false')

    const response = await fetch(`/api/features/${featureId}/photos`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorResult
      try {
        errorResult = JSON.parse(errorText)
      } catch {
        errorResult = { error: errorText || `HTTP ${response.status}` }
      }
      const errorMsg = errorResult.error || errorResult.details || response.statusText || 'Unknown error'
      return { success: false, error: errorMsg }
    }

    const json = await response.json().catch(() => null)
    const created = json?.data ?? null
    return { success: true, data: created }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

export async function uploadFeaturePhotos(
  featureId: string,
  photos: File[]
): Promise<{ errors: string[]; photos?: any[] }> {
  const errors: string[] = []
  const created: any[] = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    const isPrimary = i === 0
    const result = await uploadFeaturePhoto(featureId, photo, isPrimary)

    if (!result.success) {
      errors.push(`Photo ${i + 1}: ${result.error || 'Upload failed'}`)
    } else if (result.data) {
      created.push(result.data)
    }
  }

  return { errors, photos: created }
}

export async function deleteFeaturePhoto(
  featureId: string,
  photoId: string
): Promise<PhotoUploadResult> {
  try {
    const response = await fetch(`/api/features/${featureId}/photos/${photoId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorResult
      try {
        errorResult = JSON.parse(errorText)
      } catch {
        errorResult = { error: errorText || `HTTP ${response.status}` }
      }
      const errorMsg = errorResult.error || errorResult.details || response.statusText || 'Unknown error'
      return { success: false, error: errorMsg }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}

