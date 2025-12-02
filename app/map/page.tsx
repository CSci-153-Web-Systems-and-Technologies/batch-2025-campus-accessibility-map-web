'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MapRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirecting to map...</p>
    </div>
  )
}
