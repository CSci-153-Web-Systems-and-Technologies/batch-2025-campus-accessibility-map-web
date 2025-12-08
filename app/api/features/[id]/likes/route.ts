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

    const existingLike = await supabase
      .from('feature_likes')
      .select('id')
      .eq('feature_id', featureId)
      .eq('user_id', user.id)
      .single()

    if (existingLike.data) {
      const { error: deleteError } = await supabase
        .from('feature_likes')
        .delete()
        .eq('id', existingLike.data.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return NextResponse.json(
          { error: 'Failed to remove like', details: deleteError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        data: {
          liked: false,
          message: 'Like removed',
        },
      })
    } else {
      const { error: insertError } = await supabase
        .from('feature_likes')
        .insert({
          feature_id: featureId,
          user_id: user.id,
        })

      if (insertError) {
        console.error('Error adding like:', insertError)
        return NextResponse.json(
          { error: 'Failed to add like', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        data: {
          liked: true,
          message: 'Like added',
        },
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: featureId } = await params

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

    const { data: { user } } = await supabase.auth.getUser()

    const { count, error: countError } = await supabase
      .from('feature_likes')
      .select('*', { count: 'exact', head: true })
      .eq('feature_id', featureId)

    if (countError) {
      console.error('Error counting likes:', countError)
      return NextResponse.json(
        { error: 'Failed to fetch like count' },
        { status: 500 }
      )
    }

    let userLiked = false
    if (user) {
      const { data: userLike } = await supabase
        .from('feature_likes')
        .select('id')
        .eq('feature_id', featureId)
        .eq('user_id', user.id)
        .single()

      userLiked = !!userLike
    }

    return NextResponse.json({
      data: {
        count: count || 0,
        user_liked: userLiked,
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

