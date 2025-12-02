let mapInstance: any = null
let mapContainer: HTMLElement | null = null

export function getMapInstance() {
  return mapInstance
}

export function setMapInstance(instance: any, container: HTMLElement) {
  mapInstance = instance
  mapContainer = container
}

export function clearMapInstance() {
  mapInstance = null
  mapContainer = null
}

export function hasExistingMap(): boolean {
  return mapInstance !== null && mapContainer !== null
}

export function getMapContainer(): HTMLElement | null {
  return mapContainer
}

