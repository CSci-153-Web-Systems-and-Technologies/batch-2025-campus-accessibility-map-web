import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const STORAGE_BUCKET = 'avatars'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading avatar to storage:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload avatar', details: uploadError.message },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    if (existingProfile?.avatar_url) {
      try {
        const url = new URL(existingProfile.avatar_url)
        const pathMatch = url.pathname.match(/\/avatars\/(.+)$/)
        if (pathMatch && pathMatch[1]) {
          const oldFileName = pathMatch[1]
          await supabase.storage.from(STORAGE_BUCKET).remove([oldFileName])
        }
      } catch (e) {
        console.error('Error removing old avatar:', e)
      }
    }

    const { data, error: upsertError } = await supabase
      .from('user_profiles')
      .upsert({ 
        id: user.id,
        avatar_url: publicUrl,
      }, {
        onConflict: 'id'
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Error upserting profile:', upsertError)
      await supabase.storage.from(STORAGE_BUCKET).remove([fileName])
      return NextResponse.json(
        { error: 'Failed to update profile', details: upsertError.message, code: upsertError.code },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        avatar_url: publicUrl,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

