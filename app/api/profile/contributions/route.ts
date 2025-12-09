import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { AccessibilityFeature, FeatureComment } from '@/types/database'

interface FeatureContribution {
  id: string
  title: string
  feature_type: string
  created_at: string
}

interface CommentContribution {
  id: string
  content: string
  created_at: string
  feature_id: string
  feature_title: string
  feature_type: string | null
}

interface CommentWithFeature {
  id: string
  content: string
  created_at: string
  feature_id: string
  accessibility_features: Array<{
    id: string
    title: string
    feature_type: string
  }>
}

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

    const userId = user.id

    const [featuresResult, commentsResult] = await Promise.all([
      supabase
        .from('accessibility_features')
        .select('id, title, feature_type, created_at')
        .eq('created_by', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('feature_comments')
        .select(`
          id,
          content,
          created_at,
          feature_id,
          accessibility_features!inner(id, title, feature_type)
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ])

    if (featuresResult.error) {
      console.error('Error fetching features:', featuresResult.error)
    }

    if (commentsResult.error) {
      console.error('Error fetching comments:', commentsResult.error)
    }

    const comments: CommentContribution[] = (commentsResult.data || []).map((comment: CommentWithFeature) => {
      const feature = comment.accessibility_features.length > 0 ? comment.accessibility_features[0] : null
      return {
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        feature_id: comment.feature_id,
        feature_title: feature?.title || 'Unknown Feature',
        feature_type: feature?.feature_type || null,
      }
    })

    const features: FeatureContribution[] = (featuresResult.data || []).map((f: Pick<AccessibilityFeature, 'id' | 'title' | 'feature_type' | 'created_at'>) => ({
      id: f.id,
      title: f.title,
      feature_type: f.feature_type,
      created_at: f.created_at,
    }))

    return NextResponse.json({
      data: {
        features,
        comments,
      }
    })
  } catch (error) {
    console.error('Error fetching user contributions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

