import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type FeatureCommentUpdate } from '@/types/database'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId, commentId } = await params

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

    const existingComment = await supabase
      .from('feature_comments')
      .select('id, user_id, feature_id, content')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single()

    if (!existingComment.data) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (existingComment.data.feature_id !== featureId) {
      return NextResponse.json(
        { error: 'Comment does not belong to this feature' },
        { status: 400 }
      )
    }

    const body = await request.json()

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      )
    }

    if (body.content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment content too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    const updateData: FeatureCommentUpdate = {
      content: body.content.trim(),
    }

    const { data, error } = await supabase
      .from('feature_comments')
      .update(updateData)
      .eq('id', commentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return NextResponse.json(
        { error: 'Failed to update comment', details: error.message },
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
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId, commentId } = await params

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

    const existingComment = await supabase
      .from('feature_comments')
      .select('id, user_id, feature_id')
      .eq('id', commentId)
      .is('deleted_at', null)
      .single()

    if (!existingComment.data) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    if (existingComment.data.feature_id !== featureId) {
      return NextResponse.json(
        { error: 'Comment does not belong to this feature' },
        { status: 400 }
      )
    }

    const isAdmin = user.user_metadata?.role === 'admin'
    const isCommenter = existingComment.data.user_id === user.id

    if (!isAdmin && !isCommenter) {
      return NextResponse.json(
        { error: 'Forbidden: Only the commenter or an admin can delete this comment' },
        { status: 403 }
      )
    }
    
    const { data: updateData, error } = await supabase
      .from('feature_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .select('id, deleted_at')

    if (error) {
      console.error('Error deleting comment:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to delete comment', details: error.message, code: error.code },
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

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

