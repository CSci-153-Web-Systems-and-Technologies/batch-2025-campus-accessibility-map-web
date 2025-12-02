let mapInstance: any = null
let containerElement: HTMLElement | null = null

export function getMapContainer(): HTMLElement | null {
  if (typeof window === 'undefined') return null
  return containerElement
}

export function setMapContainer(element: HTMLElement | null) {
  containerElement = element
}

export function getMapInstance(): any {
  return mapInstance
}

export function setMapInstance(instance: any) {
  mapInstance = instance
}

export function clearMapInstance() {
  if (mapInstance) {
    try {
      if (typeof mapInstance.remove === 'function') {
        mapInstance.remove()
      }
    } catch (e) {
      console.warn('Error clearing map instance:', e)
    }
    mapInstance = null
  }
  containerElement = null
}

