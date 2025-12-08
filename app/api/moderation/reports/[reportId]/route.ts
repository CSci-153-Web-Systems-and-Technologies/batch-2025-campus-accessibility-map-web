import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const supabase = await createClient()
    const { reportId } = await params

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
        { error: 'Forbidden: Only admins can resolve reports' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { resolved, type = 'comment' } = body

    const updateData: any = {}
    if (resolved === true) {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    } else if (resolved === false) {
      updateData.resolved_at = null
      updateData.resolved_by = null
    }

    const tableName = type === 'feature' ? 'feature_reports' : 'comment_reports'

    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', reportId)
      .select()
      .single()

    if (error) {
      console.error('Error updating report:', error)
      return NextResponse.json(
        { error: 'Failed to update report', details: error.message },
        { status: 500 }
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

