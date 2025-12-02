import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type BuildingInsert } from '@/types/database'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('buildings')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching buildings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch buildings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
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

    const isAdmin = user.user_metadata?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create buildings' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Building name is required' },
        { status: 400 }
      )
    }

    if (typeof body.latitude !== 'number' || body.latitude < -90 || body.latitude > 90) {
      return NextResponse.json(
        { error: 'Valid latitude is required' },
        { status: 400 }
      )
    }

    if (typeof body.longitude !== 'number' || body.longitude < -180 || body.longitude > 180) {
      return NextResponse.json(
        { error: 'Valid longitude is required' },
        { status: 400 }
      )
    }

    if (body.description && body.description.length > 1000) {
      return NextResponse.json(
        { error: 'Description too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    const insertData: BuildingInsert = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      latitude: body.latitude,
      longitude: body.longitude,
      created_by: user.id,
    }

    const { data, error } = await supabase
      .from('buildings')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating building:', error)
      return NextResponse.json(
        { error: 'Failed to create building', details: error.message },
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

