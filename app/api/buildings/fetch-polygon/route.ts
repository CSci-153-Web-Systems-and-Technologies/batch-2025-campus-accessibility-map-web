import { NextResponse } from 'next/server'

interface OverpassElement {
  type: 'way' | 'node'
  id: number
  lat?: number
  lon?: number
  geometry?: Array<{ lat: number; lon: number }>
  tags?: {
    building?: string
    [key: string]: string | undefined
  }
}

interface OverpassResponse {
  elements: OverpassElement[]
}

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json()

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required' },
        { status: 400 }
      )
    }

    const searchRadius = 0.001
    const bbox = [
      latitude - searchRadius,
      longitude - searchRadius,
      latitude + searchRadius,
      longitude + searchRadius,
    ].join(',')

    const overpassQuery = `
      [out:json][timeout:10];
      (
        way["building"](bbox:${bbox});
        relation["building"](bbox:${bbox});
      );
      out geom;
    `

    const overpassUrl = 'https://overpass-api.de/api/interpreter'
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`)
    }

    const data: OverpassResponse = await response.json()

    if (!data.elements || data.elements.length === 0) {
      return NextResponse.json({
        polygon: null,
        message: 'No building found at this location in OpenStreetMap',
      })
    }

    const point = { lat: latitude, lng: longitude }

    const closestBuilding = data.elements
      .filter((element) => {
        if (element.type !== 'way' || !element.geometry) return false
        if (element.tags?.building) return true
        return false
      })
      .map((element) => {
        if (!element.geometry) return null

        const coords = element.geometry.map((g) => [g.lat, g.lon] as [number, number])

        const buildingCenter = {
          lat: coords.reduce((sum, c) => sum + c[0], 0) / coords.length,
          lng: coords.reduce((sum, c) => sum + c[1], 0) / coords.length,
        }

        const distance = Math.sqrt(
          Math.pow(buildingCenter.lat - point.lat, 2) +
            Math.pow(buildingCenter.lng - point.lng, 2)
        )

        return { element, coords, distance }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.distance - b.distance)[0]

    if (!closestBuilding) {
      return NextResponse.json({
        polygon: null,
        message: 'No building polygon found at this location',
      })
    }

    return NextResponse.json({
      polygon: closestBuilding.coords,
      message: 'Building polygon fetched successfully',
    })
  } catch (error) {
    console.error('Error fetching building polygon:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch building polygon',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

