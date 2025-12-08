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
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 z-[1000]">
      <div className="bg-m3-secondary-container border border-m3-outline rounded-lg shadow-lg max-w-[calc(100vw-1rem)] sm:max-w-none">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-3 sm:px-4 md:px-5 py-2 flex items-center justify-between gap-2 hover:bg-m3-secondary-hover/20 text-m3-on-secondary-container transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="font-medium text-sm sm:text-base md:text-lg">Filters</span>
            {enabledFeatureTypes.size < Object.values(FeatureType).length && (
              <span className="text-xs sm:text-sm text-m3-on-secondary-container/70">
                ({enabledFeatureTypes.size}/{Object.values(FeatureType).length})
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          )}
        </button>

        {isExpanded && (
          <div className="border-t border-m3-outline p-2 sm:p-4 md:p-5 space-y-2 sm:space-y-4 w-[280px] sm:w-auto sm:min-w-[280px] md:min-w-[320px] bg-m3-secondary-container">
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={enableAllTypes}
                disabled={allEnabled}
                className="flex-1 text-xs sm:text-sm h-7 sm:h-8"
              >
                All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disableAllTypes}
                disabled={noneEnabled}
                className="flex-1 text-xs sm:text-sm h-7 sm:h-8"
              >
                None
              </Button>
            </div>

            <div className="space-y-1 sm:space-y-2.5 max-h-[250px] sm:max-h-[350px] md:max-h-[400px] overflow-y-auto">
              {Object.values(FeatureType).map((type) => {
                const enabled = isFeatureTypeEnabled(type)

                return (
                  <label
                    key={type}
                    className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2.5 rounded-md hover:bg-m3-secondary-hover/20 cursor-pointer transition-colors text-m3-on-secondary-container"
                  >
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={() => toggleFeatureType(type)}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <div
                      className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full border-2 border-m3-outline flex-shrink-0"
                      style={{ backgroundColor: getFeatureColor(type) }}
                    />
                    <span className="text-xs sm:text-sm md:text-base flex-1 text-m3-on-secondary-container">{formatFeatureType(type)}</span>
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

