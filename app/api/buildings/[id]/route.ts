import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type BuildingUpdate } from '@/types/database'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('buildings')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
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

    const isAdmin = user.user_metadata?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update buildings' },
        { status: 403 }
      )
    }

    const existingBuilding = await supabase
      .from('buildings')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!existingBuilding.data) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const updateData: BuildingUpdate = {}

    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Building name is required' },
          { status: 400 }
        )
      }
      if (body.name.length > 200) {
        return NextResponse.json(
          { error: 'Building name too long (max 200 characters)' },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.description !== undefined) {
      if (body.description && body.description.length > 1000) {
        return NextResponse.json(
          { error: 'Description too long (max 1000 characters)' },
          { status: 400 }
        )
      }
      updateData.description = body.description?.trim() || null
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

    if (body.polygon_coordinates !== undefined) {
      updateData.polygon_coordinates = body.polygon_coordinates || null
    }

    const { data, error } = await supabase
      .from('buildings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update building', details: error.message },
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

    const isAdmin = user.user_metadata?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete buildings' },
        { status: 403 }
      )
    }

    const existingBuilding = await supabase
      .from('buildings')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (!existingBuilding.data) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      )
    }

    const { data: updateData, error } = await supabase
      .from('buildings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, deleted_at')
      .single()
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete building', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    if (!updateData) {
      return NextResponse.json(
        { error: 'Update failed: No rows were updated. This may be due to RLS policies.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ message: 'Building deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

