import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        profile: profile || null,
        email: user.email,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
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
    const { firstName, lastName, routePreference, route_preference } = body

    if (firstName === undefined && lastName === undefined && routePreference === undefined && route_preference === undefined) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

    const rawPref = route_preference ?? routePreference
    const allowedPrefs = ['avoid_stairs', 'no_preference']
    const pref = typeof rawPref === 'string' && allowedPrefs.includes(rawPref) ? rawPref : undefined

    const upsertRow: any = {
      id: user.id,
      display_name: displayName,
    }

    if (pref) upsertRow.route_preference = pref

    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .upsert(upsertRow, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        profile: data,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

