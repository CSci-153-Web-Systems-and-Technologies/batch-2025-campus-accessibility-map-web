'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeFetch } from '@/lib/fetch-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Loader2, Settings, X } from 'lucide-react'

export function ProfileSetupModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    async function checkSetup() {
      // Only show if coming from email confirmation (setup=true query param)
      const setupParam = searchParams.get('setup')
      if (setupParam !== 'true') {
        return
      }

      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!user) {
        return
      }

      const { data, error } = await safeFetch<{
        profile: { display_name: string | null; avatar_url: string | null } | null
        email: string
      }>('/api/profile')

      if (error) {
        return
      }

      // for testing
      if (data && (!data.profile?.display_name || setupParam === 'true')) {
        setDisplayName(user.email?.split('@')[0] || '')
        setAvatarUrl(data.profile?.avatar_url || null)
        setIsOpen(true)

        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('setup')
        router.replace(newUrl.pathname + newUrl.search, { scroll: false })
      }
    }
    checkSetup()
  }, [searchParams, router])

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })
      if (response.ok) {
        const result = await response.json()
        setAvatarUrl(result.data?.avatar_url || null)
      }
    } catch (err) {
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: displayName.trim(), lastName: '' }),
      })
      if (response.ok) {
        setIsOpen(false)
        window.location.reload()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md mx-4 space-y-4 relative">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold">Welcome! Let&apos;s set up your profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose a display name and optionally upload a profile picture</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-border"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/jpeg,image/jpg,image/png,image/webp'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleAvatarUpload(file)
                  }
                  input.click()
                }}
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-foreground">
                    {displayName.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/jpeg,image/jpg,image/png,image/webp'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleAvatarUpload(file)
                  }
                  input.click()
                }}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-background"
                aria-label="Edit profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
            <Settings className="h-3.5 w-3.5" />
            <span>You can change this later in settings</span>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving || !displayName.trim()}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  )
}
