'use client'

import { useEffect, useState } from 'react'
import { redirect, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { safeFetch } from '@/lib/fetch-utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Camera, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ThemeSelector } from '@/components/theme-selector'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        redirect('/login')
        return
      }

      setUser(currentUser)

      const { data, error } = await safeFetch<{
        profile: any
        email: string
      }>('/api/profile')

      if (!error && data) {
        setProfile(data.profile)
        
        if (data.profile?.display_name) {
          const nameParts = data.profile.display_name.trim().split(/\s+/)
          if (nameParts.length > 1) {
            setFirstName(nameParts.slice(0, -1).join(' '))
            setLastName(nameParts[nameParts.length - 1])
          } else {
            setFirstName(nameParts[0] || '')
            setLastName('')
          }
        }
      }

      setIsLoading(false)
    }

    loadSettings()
  }, [])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setSaveMessage({ type: 'success', text: 'Profile updated successfully' })
      setProfile(result.data.profile)
      
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || 'Failed to upload avatar')
          return
        }

        const result = await response.json()
        if (result.data?.avatar_url) {
          setProfile((prev: any) => ({
            ...prev,
            avatar_url: result.data.avatar_url,
          }))
        }
      } catch (error) {
        console.error('Error uploading avatar:', error)
        alert('Failed to upload avatar')
      }
    }
    input.click()
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete account')
      }

      const supabase = createClient()
      await supabase.auth.signOut()
      // Clear remember_me cookie on logout
      document.cookie = `remember_me=; path=/; max-age=0`
      router.push('/login')
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete account')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User'
  const avatarUrl = profile?.avatar_url || null

  if (isLoading) {
    return (
      <div className="bg-m3-surface text-m3-on-surface p-6 rounded-lg shadow">
        <div className="flex items-center justify-center h-64">
          <p className="text-m3-on-surface-variant">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-m3-surface text-m3-on-surface p-6 rounded-lg shadow max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-m3-primary mb-8">Settings</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-m3-primary">Profile Settings</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div 
                  className="w-20 h-20 rounded-full bg-m3-surface-variant flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-m3-outline"
                  onClick={handleAvatarClick}
                >
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-m3-on-surface">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-m3-primary text-m3-on-primary flex items-center justify-center shadow-lg hover:bg-m3-primary-hover transition-colors border-2 border-m3-surface"
                  aria-label="Edit profile picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm text-m3-on-surface-variant mb-1">Profile Picture</p>
                <p className="text-xs text-m3-on-surface-variant">Click to upload or change</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-m3-on-surface">
                  First Name
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-m3-on-surface">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>

            {saveMessage && (
              <div className={`p-3 rounded-lg text-sm border ${
                saveMessage.type === 'success' 
                  ? 'bg-m3-primary-container text-m3-on-primary-container border-m3-primary' 
                  : 'bg-m3-error-container text-m3-on-error-container border-m3-error'
              }`}>
                {saveMessage.text}
              </div>
            )}

            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full md:w-auto"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="border-t border-m3-outline pt-8">
          <h2 className="text-xl font-semibold mb-4 text-m3-primary">Theme Settings</h2>
          <ThemeSelector />
        </div>

        <div className="border-t border-m3-outline pt-8">
          <h2 className="text-xl font-semibold mb-4 text-m3-primary">Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-m3-on-surface">
                Password
              </label>
              <Link href="/update-password">
                <Button variant="outline" className="w-full md:w-auto">
                  Change Password
                </Button>
              </Link>
            </div>

            <div className="border-t border-m3-outline pt-4 mt-6">
              <div className="flex items-start gap-3 p-4 bg-m3-error-container border border-m3-error rounded-lg">
                <AlertTriangle className="w-5 h-5 text-m3-error flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-m3-on-error-container mb-1">
                    Delete Account
                  </h3>
                  <p className="text-sm text-m3-on-error-container mb-4">
                    This action cannot be undone. This will permanently delete your account and all associated data.
                  </p>
                  {showDeleteConfirm && (
                    <div className="mb-4 p-3 bg-m3-error-container border border-m3-error rounded">
                      <p className="text-sm font-medium text-m3-on-error-container mb-3">
                        Are you sure you want to delete your account? This action is permanent.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          variant="destructive"
                          size="sm"
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                        </Button>
                        <Button
                          onClick={() => setShowDeleteConfirm(false)}
                          variant="outline"
                          size="sm"
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {!showDeleteConfirm && (
                    <Button
                      onClick={handleDeleteAccount}
                      variant="destructive"
                      size="sm"
                    >
                      Delete Account
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
