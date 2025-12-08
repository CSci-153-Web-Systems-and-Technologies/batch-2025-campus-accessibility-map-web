import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { commentId } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const comment = await supabase
      .from('feature_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single()

    if (!comment.data) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (comment.data.user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot report your own comment' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const reason = body.reason?.trim() || null

    const { data, error } = await supabase
      .from('comment_reports')
      .insert({
        comment_id: commentId,
        reported_by: user.id,
        reason: reason,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reported this comment' },
          { status: 400 }
        )
      }
      console.error('Error reporting comment:', error)
      return NextResponse.json(
        { error: 'Failed to report comment', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data, message: 'Comment reported successfully' }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


