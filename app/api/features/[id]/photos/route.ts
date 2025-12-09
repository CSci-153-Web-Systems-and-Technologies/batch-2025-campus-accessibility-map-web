import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type FeaturePhotoInsert } from '@/types/database'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const STORAGE_BUCKET = 'feature-photos'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const feature = await supabase
      .from('accessibility_features')
      .select('id')
      .eq('id', featureId)
      .is('deleted_at', null)
      .single()

    if (!feature.data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const caption = formData.get('caption') as string | null
    const isPrimary = formData.get('is_primary') === 'true'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${featureId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file to storage:', {
        error: uploadError,
        message: uploadError.message,
        name: uploadError.name,
        bucket: STORAGE_BUCKET,
        fileName,
      })
      return NextResponse.json(
        { error: 'Failed to upload file to storage', details: uploadError.message },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    if (isPrimary) {
      const { error: unsetError } = await supabase
        .from('feature_photos')
        .update({ is_primary: false })
        .eq('feature_id', featureId)
        .eq('is_primary', true)
        .is('deleted_at', null)

      if (unsetError) {
        console.error('Error unsetting previous primary photo:', unsetError)
      }
    }

    const photoData: FeaturePhotoInsert = {
      feature_id: featureId,
      photo_url: fileName,
      uploaded_by: user.id,
      caption: caption || null,
      is_primary: isPrimary,
    }

    const { data, error } = await supabase
      .from('feature_photos')
      .insert(photoData)
      .select()
      .single()

    if (error) {
      console.error('Error saving photo record:', error)
      await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
      return NextResponse.json(
        { error: 'Failed to save photo record', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        ...data,
        full_url: publicUrl,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId } = await params

    const feature = await supabase
      .from('accessibility_features')
      .select('id')
      .eq('id', featureId)
      .is('deleted_at', null)
      .single()

    if (!feature.data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('feature_photos')
      .select('*')
      .eq('feature_id', featureId)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    const photosWithUrls = (data || []).map((photo) => ({
      ...photo,
      full_url: supabase.storage.from(STORAGE_BUCKET).getPublicUrl(photo.photo_url).data.publicUrl,
    }))

    return NextResponse.json({ data: photosWithUrls })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

