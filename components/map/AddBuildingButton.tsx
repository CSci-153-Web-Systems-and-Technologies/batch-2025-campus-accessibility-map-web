'use client'

import { useState, useEffect } from 'react'
import { FaBuilding } from 'react-icons/fa'
import { createClient } from '@/lib/supabase/client'
import { useBuildingCreation } from './BuildingCreationContext'

export function AddBuildingButton() {
  const { setCreating } = useBuildingCreation()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const role = user.user_metadata?.role
          setIsAdmin(role === 'admin')
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [])

  if (isLoading || !isAdmin) {
    return null
  }

  return (
    <button
      onClick={() => setCreating(true)}
      className="absolute bottom-4 right-20 z-[1000] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Add Building"
    >
      <FaBuilding className="w-6 h-6" />
    </button>
  )
}

