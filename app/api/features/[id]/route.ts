import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { FeatureType, type AccessibilityFeatureUpdate } from '@/types/database'
import { processFeaturePhotos } from '@/lib/api/photo-utils'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('accessibility_features')
      .select(`
        *,
        feature_photos!left(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    const featureWithPhotos = processFeaturePhotos(data, supabase)

    return NextResponse.json({ data: featureWithPhotos })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const existingFeature = await supabase
      .from('accessibility_features')
      .select('created_by')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!existingFeature.data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    if (existingFeature.data.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own features' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const updateData: AccessibilityFeatureUpdate = {}

    if (body.feature_type !== undefined) {
      if (!Object.values(FeatureType).includes(body.feature_type)) {
        return NextResponse.json(
          { error: 'Invalid feature_type' },
          { status: 400 }
        )
      }
      updateData.feature_type = body.feature_type
    }

    if (body.title !== undefined) {
      if (body.title.length > 200) {
        return NextResponse.json(
          { error: 'Title too long (max 200 characters)' },
          { status: 400 }
        )
      }
      updateData.title = body.title
    }

    if (body.description !== undefined) {
      if (body.description && body.description.length > 1000) {
        return NextResponse.json(
          { error: 'Description too long (max 1000 characters)' },
          { status: 400 }
        )
      }
      updateData.description = body.description || null
    }

    if (body.latitude !== undefined) {
      if (typeof body.latitude !== 'number' || body.latitude < -90 || body.latitude > 90) {
        return NextResponse.json(
          { error: 'Invalid latitude' },
          { status: 400 }
        )
      }
      updateData.latitude = body.latitude
    }

    if (body.longitude !== undefined) {
      if (typeof body.longitude !== 'number' || body.longitude < -180 || body.longitude > 180) {
        return NextResponse.json(
          { error: 'Invalid longitude' },
          { status: 400 }
        )
      }
      updateData.longitude = body.longitude
    }

    if (body.building_id !== undefined) {
      updateData.building_id = body.building_id || null
    }

    const { data, error } = await supabase
      .from('accessibility_features')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating feature:', error)
      return NextResponse.json(
        { error: 'Failed to update feature', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const existingFeature = await supabase
      .from('accessibility_features')
      .select('id, created_by')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!existingFeature.data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    const isAdmin = user.user_metadata?.role === 'admin'
    const isCreator = existingFeature.data.created_by === user.id

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: 'Forbidden: Only the creator or an admin can delete this feature' },
        { status: 403 }
      )
    }

    const { data: updateData, error } = await supabase
      .from('accessibility_features')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, deleted_at')

    if (error) {
      console.error('Error deleting feature:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to delete feature', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    // Verify the update actually happened
    if (!updateData || updateData.length === 0) {
      console.error('Update returned no rows - RLS policy may have blocked the update')
      return NextResponse.json(
        { error: 'Update failed: No rows were updated. This may be due to RLS policies.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ message: 'Feature deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

