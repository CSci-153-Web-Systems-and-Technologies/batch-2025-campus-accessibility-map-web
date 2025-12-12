import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const STORAGE_BUCKET = 'building-photos'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: buildingId } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const building = await supabase
      .from('buildings')
      .select('id')
      .eq('id', buildingId)
      .is('deleted_at', null)
      .single()

    if (!building.data) {
      return NextResponse.json({ error: 'Building not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${buildingId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload file to storage', details: uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    const { data, error } = await supabase
      .from('buildings')
      .update({ photo_path: fileName })
      .eq('id', buildingId)
      .select()
      .single()

    if (error) {
      console.error('Error saving building photo reference:', error)
      await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
      return NextResponse.json({ error: 'Failed to save photo reference', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: { ...data, full_url: publicUrl } }, { status: 201 })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: buildingId } = await params

    const { data, error } = await supabase
      .from('buildings')
      .select('photo_path')
      .eq('id', buildingId)
      .is('deleted_at', null)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch building photo' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ data: null })
    }

    const publicUrl = data.photo_path ? supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.photo_path).data.publicUrl : null

    return NextResponse.json({ data: { photo_path: data.photo_path, full_url: publicUrl } })
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
