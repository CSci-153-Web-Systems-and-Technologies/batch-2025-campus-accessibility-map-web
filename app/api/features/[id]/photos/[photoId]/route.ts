import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const STORAGE_BUCKET = 'feature-photos'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId, photoId } = await params

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

    const existingPhoto = await supabase
      .from('feature_photos')
      .select('id, photo_url, feature_id')
      .eq('id', photoId)
      .is('deleted_at', null)
      .single()

    if (!existingPhoto.data) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    if (existingPhoto.data.feature_id !== featureId) {
      return NextResponse.json(
        { error: 'Photo does not belong to this feature' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('feature_photos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', photoId)

    if (error) {
      console.error('Error deleting photo:', error)
      return NextResponse.json(
        { error: 'Failed to delete photo', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Photo deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

