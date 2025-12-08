import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { FeatureType, type AccessibilityFeatureInsert } from '@/types/database'
import { processFeaturePhotos } from '@/lib/api/photo-utils'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const featureType = searchParams.get('feature_type')
    const buildingId = searchParams.get('building_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('accessibility_features')
      .select(`
        *,
        feature_photos!left(*)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (featureType) {
      query = query.eq('feature_type', featureType)
    }

    if (buildingId) {
      query = query.eq('building_id', buildingId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching features:', error)
      return NextResponse.json(
        { error: 'Failed to fetch features' },
        { status: 500 }
      )
    }

    const featuresWithPhotos = (data || []).map((feature) => 
      processFeaturePhotos(feature, supabase)
    )

    return NextResponse.json({ data: featuresWithPhotos })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.feature_type || !body.title || typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: feature_type, title, latitude, longitude' },
        { status: 400 }
      )
    }

    if (!Object.values(FeatureType).includes(body.feature_type)) {
      return NextResponse.json(
        { error: 'Invalid feature_type' },
        { status: 400 }
      )
    }

    if (body.title.length > 200 || (body.description && body.description.length > 1000)) {
      return NextResponse.json(
        { error: 'Title or description too long' },
        { status: 400 }
      )
    }

    const insertData: AccessibilityFeatureInsert = {
      feature_type: body.feature_type,
      title: body.title,
      description: body.description || null,
      latitude: body.latitude,
      longitude: body.longitude,
      building_id: body.building_id || null,
      created_by: user.id,
      deleted_at: null,
    }

    const { data, error } = await supabase
      .from('accessibility_features')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating feature:', error)
      return NextResponse.json(
        { error: 'Failed to create feature', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

