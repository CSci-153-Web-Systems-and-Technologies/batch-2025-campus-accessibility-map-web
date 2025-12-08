import type { Building } from '@/types/map'
import type { Building as DBBuilding } from '@/types/database'

export function transformApiBuildingToMapBuilding(building: DBBuilding): Building {
  return {
    ...building,
    coordinates: [building.latitude, building.longitude] as [number, number],
  }
}

