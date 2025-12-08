'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdmin } from '@/lib/hooks/use-admin'
import { safeFetch } from '@/lib/fetch-utils'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2, Trash2 } from 'lucide-react'
import { formatFeatureType } from '@/lib/utils/feature-utils'
import { FeatureTypeBadge } from '@/components/ui/feature-type-badge'
import { FeatureType } from '@/types/database'

interface CommentReport {
  id: string
  comment_id: string
  reported_by: string
  reason: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  type: 'comment'
  feature_comments: {
    id: string
    feature_id: string
    user_id: string
    content: string
    created_at: string
    deleted_at: string | null
    accessibility_features: {
      id: string
      title: string
      feature_type: FeatureType
    } | null
  }
  reporter: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
  comment_author: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface FeatureReport {
  id: string
  feature_id: string
  reported_by: string
  reason: string | null
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  type: 'feature'
  accessibility_features: {
    id: string
    title: string
    feature_type: FeatureType
    description: string | null
    created_by: string
    deleted_at: string | null
  }
  reporter: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
  feature_author: {
    id: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

type Report = CommentReport | FeatureReport

export default function ModerationPage() {
  const router = useRouter()
  const { isAdmin, isLoading: isAdminLoading } = useAdmin()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'resolved' | 'unresolved'>('unresolved')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'comment' | 'feature' } | null>(null)

  useEffect(() => {
    if (!isAdminLoading) {
      if (!isAdmin) {
        router.push('/')
        return
      }
      loadReports()
    }
  }, [isAdmin, isAdminLoading, filter])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const resolvedParam = filter === 'all' ? undefined : filter === 'resolved' ? 'true' : 'false'
      const url = resolvedParam ? `/api/moderation/reports?resolved=${resolvedParam}` : '/api/moderation/reports'
      const { data, error } = await safeFetch<Report[]>(url)

      if (error) {
        console.error('Error loading reports:', error)
        return
      }

      setReports(data || [])
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolve = async (reportId: string, resolved: boolean, type: 'comment' | 'feature') => {
    setResolvingId(reportId)
    try {
      const response = await fetch(`/api/moderation/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolved, type }),
      })

      if (!response.ok) {
        throw new Error('Failed to update report')
      }

      await loadReports()
    } catch (error) {
      console.error('Error resolving report:', error)
      alert('Failed to update report. Please try again.')
    } finally {
      setResolvingId(null)
    }
  }

  const handleDelete = async (report: Report) => {
    if (!confirmDelete || confirmDelete.id !== report.id) {
      setConfirmDelete({ id: report.id, type: report.type })
      return
    }

    setDeletingId(report.id)
    try {
      let deleteUrl = ''
      if (report.type === 'comment') {
        deleteUrl = `/api/features/${report.feature_comments.feature_id}/comments/${report.feature_comments.id}`
      } else {
        deleteUrl = `/api/features/${report.feature_id}`
      }

      const { error } = await safeFetch(deleteUrl, {
        method: 'DELETE',
      })

      if (error) {
        throw error
      }

      // Resolve the report after successful deletion
      await handleResolve(report.id, true, report.type)
      setConfirmDelete(null)
    } catch (error) {
      console.error('Error deleting:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (isAdminLoading || isLoading) {
    return (
      <div className="bg-m3-surface text-m3-on-surface p-6 rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <p className="text-m3-on-surface-variant">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="bg-m3-surface text-m3-on-surface p-3 sm:p-4 md:p-6 rounded-lg shadow max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-m3-primary mb-4 sm:mb-6">Moderation</h1>

      <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-3">
        <Button
          variant={filter === 'unresolved' ? 'default' : 'outline'}
          onClick={() => setFilter('unresolved')}
          size="sm"
          className="flex-1 sm:flex-initial min-w-[100px]"
        >
          Unresolved
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          onClick={() => setFilter('resolved')}
          size="sm"
          className="flex-1 sm:flex-initial min-w-[100px]"
        >
          Resolved
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
          className="flex-1 sm:flex-initial min-w-[100px]"
        >
          All
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-m3-on-surface-variant">No {filter === 'all' ? '' : filter} reports found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`border rounded-lg p-3 sm:p-4 ${
                report.resolved_at
                  ? 'bg-m3-surface-variant border-m3-outline-variant'
                  : 'bg-m3-secondary-container border-m3-outline'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 space-y-3 min-w-0 w-full sm:w-auto">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-m3-on-surface-variant">Reported by:</span>
                        <span className="text-sm text-m3-on-surface">
                          {report.reporter?.display_name || 'Unknown User'}
                        </span>
                      </div>
                      <span className="text-xs text-m3-on-surface-variant">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {report.reason && (
                      <p className="text-sm text-m3-on-surface-variant italic">"{report.reason}"</p>
                    )}
                  </div>

                  <div className="border-t border-m3-outline pt-3">
                    {report.type === 'comment' ? (
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-m3-on-surface-variant">Comment:</span>
                            {report.feature_comments.deleted_at && (
                              <span className="text-xs px-2 py-0.5 bg-m3-error-container text-m3-on-error-container rounded">
                                Deleted
                              </span>
                            )}
                            {report.feature_comments.accessibility_features && (
                              <FeatureTypeBadge
                                featureType={report.feature_comments.accessibility_features.feature_type}
                                size="sm"
                              />
                            )}
                          </div>
                          {!report.feature_comments.deleted_at ? (
                            <p className="text-sm text-m3-on-surface mb-2">{report.feature_comments.content}</p>
                          ) : (
                            <p className="text-sm text-m3-on-surface-variant italic mb-2">This comment has been deleted.</p>
                          )}
                          <div className="text-xs text-m3-on-surface-variant">
                            <span>By: {report.comment_author?.display_name || 'Unknown User'}</span>
                            {report.feature_comments.accessibility_features && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Feature: {report.feature_comments.accessibility_features.title}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-m3-on-surface-variant">Feature:</span>
                            {report.accessibility_features.deleted_at && (
                              <span className="text-xs px-2 py-0.5 bg-m3-error-container text-m3-on-error-container rounded">
                                Deleted
                              </span>
                            )}
                            <FeatureTypeBadge
                              featureType={report.accessibility_features.feature_type}
                              size="sm"
                            />
                          </div>
                          {!report.accessibility_features.deleted_at ? (
                            <>
                              <p className="text-sm font-semibold text-m3-on-surface mb-1">{report.accessibility_features.title}</p>
                              {report.accessibility_features.description && (
                                <p className="text-sm text-m3-on-surface-variant mb-2">{report.accessibility_features.description}</p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-m3-on-surface-variant italic mb-2">This feature has been deleted.</p>
                          )}
                          <div className="text-xs text-m3-on-surface-variant">
                            <span>By: {report.feature_author?.display_name || 'Unknown User'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {report.resolved_at && (
                    <div className="text-xs text-m3-on-surface-variant">
                      Resolved on {new Date(report.resolved_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-col gap-2 w-full sm:w-auto">
                  {!report.resolved_at && (
                    <>
                      {confirmDelete?.id === report.id ? (
                        <div className="flex flex-col gap-2 p-2 bg-m3-error-container border border-m3-error rounded-lg w-full sm:w-auto">
                          <p className="text-xs text-m3-on-error-container font-medium">Delete {report.type}?</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(report)}
                              disabled={deletingId === report.id}
                              className="h-7 text-xs"
                            >
                              {deletingId === report.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                'Yes'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDelete(null)}
                              disabled={deletingId === report.id}
                              className="h-7 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResolve(report.id, true, report.type)}
                            disabled={resolvingId === report.id || deletingId === report.id}
                            className="gap-2 w-full sm:w-auto"
                          >
                            {resolvingId === report.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(report)}
                            disabled={
                              resolvingId === report.id || 
                              deletingId === report.id ||
                              (report.type === 'comment' && !!report.feature_comments.deleted_at) ||
                              (report.type === 'feature' && !!report.accessibility_features.deleted_at)
                            }
                            className="gap-2 text-m3-error border-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container disabled:opacity-50 w-full sm:w-auto"
                          >
                            {deletingId === report.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            Delete
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  {report.resolved_at && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResolve(report.id, false, report.type)}
                      disabled={resolvingId === report.id}
                      className="gap-2 w-full sm:w-auto"
                    >
                      {resolvingId === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Unresolve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

