'use client'

import { divIcon } from 'leaflet'
import { ComponentType } from 'react'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

export function createReactIconMarker(
  IconComponent: ComponentType<{ className?: string; style?: React.CSSProperties; size?: number; color?: string }>,
  options: {
    color?: string
    size?: number
    className?: string
    backgroundColor?: string
    borderColor?: string
  } = {}
): ReturnType<typeof divIcon> {
  const {
    color = 'white',
    size = 20,
    className = '',
    backgroundColor = '#3b82f6',
    borderColor = '#1f2937',
  } = options

  const containerSize = size + 8

  const iconElement = React.createElement(IconComponent, {
    size,
    color,
    style: {
      width: `${size}px`,
      height: `${size}px`,
    },
  })

  const containerElement = React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        backgroundColor,
        borderRadius: '50%',
        border: `2px solid ${borderColor}`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      },
      className,
    },
    iconElement
  )

  const iconHTML = renderToStaticMarkup(containerElement)

  return divIcon({
    html: iconHTML,
    className: 'custom-div-icon',
    iconSize: [containerSize, containerSize],
    iconAnchor: [containerSize / 2, containerSize],
    popupAnchor: [0, -containerSize],
  })
}

export function createFABuildingMarker(options?: {
  size?: number
  backgroundColor?: string
  borderColor?: string
}): ReturnType<typeof divIcon> {
  let FaBuilding: ComponentType<any>
  
  try {
    FaBuilding = require('react-icons/fa').FaBuilding
  } catch {
    const size = options?.size || 20
    const buildingSvg = `<svg width="${size}" height="${size}" viewBox="0 0 448 512" fill="white"><path d="M128 32H32C14.3 32 0 46.3 0 64V448c0 17.7 14.3 32 32 32h96c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32zM64 192h64v64H64V192zm0 128h64v64H64V320zM416 32H192c-17.7 0-32 14.3-32 32V448c0 17.7 14.3 32 32 32h224c17.7 0 32-14.3 32-32V64c0-17.7-14.3-32-32-32zM288 192h64v64H288V192zm0 128h64v64H288V320z"/></svg>`
    
    const containerSize = size + 8
    return divIcon({
      html: `<div style="display:flex;align-items:center;justify-content:center;width:${containerSize}px;height:${containerSize}px;background-color:${options?.backgroundColor || '#f59e0b'};border-radius:50%;border:2px solid ${options?.borderColor || '#92400e'};box-shadow:0 2px 4px rgba(0,0,0,0.2)">${buildingSvg}</div>`,
      iconSize: [containerSize, containerSize],
      iconAnchor: [containerSize / 2, containerSize],
      popupAnchor: [0, -containerSize],
    })
  }
  
  return createReactIconMarker(FaBuilding, {
    color: 'white',
    size: options?.size || 20,
    backgroundColor: options?.backgroundColor || '#f59e0b',
    borderColor: options?.borderColor || '#92400e',
  })
}

export function createLocationMarker(
  backgroundColor: string,
  options?: {
    size?: number
    borderColor?: string
  }
): ReturnType<typeof divIcon> {
  let HiLocationMarker: ComponentType<any>
  
  try {
    HiLocationMarker = require('react-icons/hi').HiLocationMarker
  } catch {
    const size = options?.size || 20
    const locationSvg = `<svg width="${size}" height="${size}" viewBox="0 0 20 20" fill="white"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg>`
    
    const containerSize = size + 8
    return divIcon({
      html: `<div style="display:flex;align-items:center;justify-content:center;width:${containerSize}px;height:${containerSize}px;background-color:${backgroundColor};border-radius:50%;border:2px solid ${options?.borderColor || '#1f2937'};box-shadow:0 2px 4px rgba(0,0,0,0.2)">${locationSvg}</div>`,
      iconSize: [containerSize, containerSize],
      iconAnchor: [containerSize / 2, containerSize],
      popupAnchor: [0, -containerSize],
    })
  }
  
  return createReactIconMarker(HiLocationMarker, {
    color: 'white',
    size: options?.size || 20,
    backgroundColor,
    borderColor: options?.borderColor || '#1f2937',
  })
}
