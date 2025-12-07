'use client'

import { useState } from 'react'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useMapFilters } from './MapFiltersContext'
import { FeatureType } from '@/types/database'
import { formatFeatureType } from '@/lib/utils/feature-utils'
import { getFeatureColor } from '@/lib/utils/feature-colors'

export function FiltersDrawer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { enabledFeatureTypes, toggleFeatureType, isFeatureTypeEnabled, enableAllTypes, disableAllTypes } = useMapFilters()

  const allEnabled = enabledFeatureTypes.size === Object.values(FeatureType).length
  const noneEnabled = enabledFeatureTypes.size === 0

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <div className="bg-m3-secondary-container border border-m3-outline rounded-lg shadow-lg">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between gap-2 hover:bg-m3-secondary-hover/20 text-m3-on-secondary-container transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {enabledFeatureTypes.size < Object.values(FeatureType).length && (
              <span className="text-xs text-m3-on-secondary-container/70">
                ({enabledFeatureTypes.size}/{Object.values(FeatureType).length})
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-m3-outline p-4 space-y-3 min-w-[280px] bg-m3-secondary-container">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={enableAllTypes}
                disabled={allEnabled}
                className="flex-1"
              >
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disableAllTypes}
                disabled={noneEnabled}
                className="flex-1"
              >
                None
              </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {Object.values(FeatureType).map((type) => {
                const enabled = isFeatureTypeEnabled(type)

                return (
                  <label
                    key={type}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-m3-secondary-hover/20 cursor-pointer transition-colors text-m3-on-secondary-container"
                  >
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={() => toggleFeatureType(type)}
                    />
                    <div
                      className="w-5 h-5 rounded-full border-2 border-m3-outline flex-shrink-0"
                      style={{ backgroundColor: getFeatureColor(type) }}
                    />
                    <span className="text-sm flex-1 text-m3-on-secondary-container">{formatFeatureType(type)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

