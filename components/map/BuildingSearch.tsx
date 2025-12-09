'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useMap } from 'react-leaflet'
import { useBuildingModal } from './BuildingModalContext'
import { safeFetch } from '@/lib/fetch-utils'
import type { Building } from '@/types/map'
import type { Building as DBBuilding } from '@/types/database'
import { transformApiBuildingToMapBuilding } from '@/lib/utils/building-transform'

// Component that must be used inside MapContainer
export function BuildingSearchMapControl() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Building[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { openModal } = useBuildingModal()
  const mapInstance = useMap()

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => {
      async function searchBuildings() {
        setIsSearching(true)
        const { data, error } = await safeFetch<DBBuilding[]>(
          `/api/buildings?search=${encodeURIComponent(searchQuery.trim())}&limit=10`,
          { signal: abortController.signal }
        )

        if (error && error.name !== 'AbortError') {
          console.error('Error searching buildings:', error)
          setSearchResults([])
        } else if (data) {
          const buildingsData: Building[] = data.map(transformApiBuildingToMapBuilding)
          setSearchResults(buildingsData)
          setShowResults(true)
        }
        setIsSearching(false)
      }

      searchBuildings()
    }, 300)

    return () => {
      abortController.abort()
      clearTimeout(timeoutId)
    }
  }, [searchQuery])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setShowResults(false)
  }, [])

  const handleBuildingSelect = useCallback((building: Building) => {
    const origin = mapInstance ? {
      x: mapInstance.getContainer().getBoundingClientRect().left + mapInstance.getContainer().offsetWidth / 2,
      y: mapInstance.getContainer().getBoundingClientRect().top + mapInstance.getContainer().offsetHeight / 2,
    } : undefined
    openModal(building, origin)
    setSearchQuery('')
    setShowResults(false)
    setIsMobileSearchOpen(false)
    if (mapInstance) {
      mapInstance.setView(building.coordinates, 18, { animate: true })
    }
  }, [openModal, mapInstance])

  // Close mobile search when clicking outside
  useEffect(() => {
    if (!isMobileSearchOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.building-search-container')) {
        setIsMobileSearchOpen(false)
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobileSearchOpen])

  return (
    <div className={`${isMobile ? 'fixed' : 'absolute'} top-2 left-14 sm:top-4 sm:left-16 z-[1000] pointer-events-none`}>
      <div className="pointer-events-auto building-search-container">
        {/* Mobile: Button */}
        {isMobile ? (
          <>
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="w-10 h-10 rounded-lg bg-m3-surface border border-m3-outline text-m3-on-surface flex items-center justify-center shadow-lg hover:bg-m3-surface-variant transition-colors"
              aria-label="Search buildings"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile: Expanded search panel */}
            {isMobileSearchOpen && (
              <div className="absolute top-12 left-0 w-[calc(100vw-3.5rem)] max-w-xs bg-m3-surface border border-m3-outline rounded-lg shadow-lg p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-m3-on-surface-variant w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search buildings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    className="pl-10 pr-10 bg-m3-surface text-m3-on-surface border-m3-outline"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-m3-on-surface-variant hover:text-m3-on-surface"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {showResults && searchResults.length > 0 && (
                  <div className="mt-2 bg-m3-surface border border-m3-outline rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {isSearching && (
                      <div className="p-4 text-sm text-m3-on-surface-variant text-center">
                        Searching...
                      </div>
                    )}
                    {!isSearching && searchResults.map((building) => (
                      <button
                        key={building.id}
                        onClick={() => handleBuildingSelect(building)}
                        className="w-full px-4 py-3 text-left hover:bg-m3-surface-variant transition-colors border-b border-m3-outline last:border-b-0"
                      >
                        <div className="font-medium text-m3-on-surface">{building.name}</div>
                        {building.description && (
                          <div className="text-sm text-m3-on-surface-variant truncate">
                            {building.description}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchQuery && !isSearching && searchResults.length === 0 && (
                  <div className="mt-2 bg-m3-surface border border-m3-outline rounded-md shadow-lg p-4 text-sm text-m3-on-surface-variant text-center">
                    No buildings found
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* Desktop: Input box */
          <div className="w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search buildings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowResults(true)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-64 overflow-y-auto z-[1001]">
                {isSearching && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Searching...
                  </div>
                )}
                {!isSearching && searchResults.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingSelect(building)}
                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                  >
                    <div className="font-medium">{building.name}</div>
                    {building.description && (
                      <div className="text-sm text-muted-foreground truncate">
                        {building.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {showResults && searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg p-4 text-sm text-muted-foreground text-center z-[1001]">
                No buildings found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

