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

    const isAdmin = user.user_metadata?.role === 'admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can access moderation reports' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')

    // Fetch both comment and feature reports
    const buildQuery = (table: string, selectFields: string) => {
      let query = supabase
        .from(table)
        .select(selectFields)
        .order('created_at', { ascending: false })

      if (resolved === 'true') {
        query = query.not('resolved_at', 'is', null)
      } else if (resolved === 'false') {
        query = query.is('resolved_at', null)
      }

      return query
    }

    const [commentReportsResult, featureReportsResult] = await Promise.all([
      buildQuery(
        'comment_reports',
        `
          id,
          comment_id,
          reported_by,
          reason,
          created_at,
          resolved_at,
          resolved_by,
          feature_comments!left(
            id,
            feature_id,
            user_id,
            content,
            created_at,
            deleted_at
          )
        `
      ),
      buildQuery(
        'feature_reports',
        `
          id,
          feature_id,
          reported_by,
          reason,
          created_at,
          resolved_at,
          resolved_by,
          accessibility_features!left(
            id,
            title,
            feature_type,
            description,
            created_by,
            deleted_at
          )
        `
      )
    ])

    if (commentReportsResult.error) {
      console.error('Error fetching comment reports:', commentReportsResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch comment reports', details: commentReportsResult.error.message },
        { status: 500 }
      )
    }

    if (featureReportsResult.error) {
      console.error('Error fetching feature reports:', featureReportsResult.error)
      return NextResponse.json(
        { error: 'Failed to fetch feature reports', details: featureReportsResult.error.message },
        { status: 500 }
      )
    }

    const commentReportsData = commentReportsResult.data || []
    const featureReportsData = featureReportsResult.data || []

    if (commentReportsData.length === 0 && featureReportsData.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Collect all user IDs
    const userIds = new Set<string>()
    const featureIds = new Set<string>()

    commentReportsData.forEach((report: any) => {
      if (report.reported_by) userIds.add(report.reported_by)
      if (report.feature_comments?.user_id) userIds.add(report.feature_comments.user_id)
      if (report.feature_comments?.feature_id) featureIds.add(report.feature_comments.feature_id)
    })

    featureReportsData.forEach((report: any) => {
      if (report.reported_by) userIds.add(report.reported_by)
      if (report.accessibility_features?.created_by) userIds.add(report.accessibility_features.created_by)
      if (report.feature_id) featureIds.add(report.feature_id)
    })

    const [profilesResult, featuresResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(userIds)),
      supabase
        .from('accessibility_features')
        .select('id, title, feature_type, deleted_at')
        .in('id', Array.from(featureIds))
    ])

    const profilesMap = new Map()
    if (profilesResult.data) {
      profilesResult.data.forEach((profile: any) => {
        profilesMap.set(profile.id, profile)
      })
    }

    const featuresMap = new Map()
    if (featuresResult.data) {
      featuresResult.data.forEach((feature: any) => {
        featuresMap.set(feature.id, feature)
      })
    }

    // Process comment reports
    const commentReports = commentReportsData.map((report: any) => {
      // Handle both array and object responses from Supabase join
      const comment = Array.isArray(report.feature_comments) 
        ? report.feature_comments[0] 
        : report.feature_comments
      const feature = comment?.feature_id ? featuresMap.get(comment.feature_id) : null
      
      return {
        ...report,
        type: 'comment' as const,
        feature_comments: {
          ...comment,
          accessibility_features: feature || null,
        },
        reporter: profilesMap.get(report.reported_by) || null,
        comment_author: comment?.user_id
          ? profilesMap.get(comment.user_id) || null
          : null,
      }
    })

    // Process feature reports
    const featureReports = featureReportsData.map((report: any) => {
      // Handle both array and object responses from Supabase join
      const feature = Array.isArray(report.accessibility_features)
        ? report.accessibility_features[0]
        : report.accessibility_features
      
      return {
        ...report,
        type: 'feature' as const,
        accessibility_features: feature,
        reporter: profilesMap.get(report.reported_by) || null,
        feature_author: feature?.created_by
          ? profilesMap.get(feature.created_by) || null
          : null,
      }
    })

    // Combine and sort by created_at (most recent first)
    const allReports = [...commentReports, ...featureReports].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return NextResponse.json({ data: allReports })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

