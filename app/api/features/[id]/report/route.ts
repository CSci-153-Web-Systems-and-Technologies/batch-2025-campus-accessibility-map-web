import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
      .select('id, created_by')
      .eq('id', featureId)
      .is('deleted_at', null)
      .single()

    if (!feature.data) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      )
    }

    if (feature.data.created_by === user.id) {
      return NextResponse.json(
        { error: 'You cannot report your own feature' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const reason = body.reason?.trim()

    if (!reason || reason.length === 0) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    if (reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason must be 500 characters or less' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('feature_reports')
      .insert({
        feature_id: featureId,
        reported_by: user.id,
        reason: reason,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reported this feature' },
          { status: 400 }
        )
      }
      console.error('Error reporting feature:', error)
      return NextResponse.json(
        { error: 'Failed to report feature', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, message: 'Feature reported successfully' }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


