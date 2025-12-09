'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useRouteDrawing } from './RouteDrawingContext';
import { RouteGraph, GraphNode } from '@/lib/routing/RouteGraph';
// @ts-ignore
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';

const createNodeIcon = (tags: string[]) => {
  const hasStairs = tags.includes('has_stairs');
  const color = hasStairs ? 'hsl(var(--m3-error))' : 'hsl(var(--m3-tertiary))';
  
  return L.divIcon({
    className: 'route-node-marker',
    html: `<div style="width: 16px; height: 16px; background-color: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export function RouteDrawingControl() {
  const map = useMap();
  const { isDrawing, setSelectedNode } = useRouteDrawing();
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const nodeLayerRef = useRef<L.LayerGroup | null>(null);
  const graphRef = useRef<RouteGraph>(new RouteGraph());
  const nodeMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const snapIndicatorRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!isDrawing) return;

    const drawnItems = new L.FeatureGroup();
    const nodeLayer = new L.LayerGroup();
    drawnItemsRef.current = drawnItems;
    nodeLayerRef.current = nodeLayer;
    
    map.addLayer(drawnItems);
    map.addLayer(nodeLayer);

    const snapIndicator = L.circleMarker([0, 0], {
      radius: 10,
      color: 'hsl(var(--m3-primary))',
      fillColor: 'hsl(var(--m3-primary))',
      fillOpacity: 0.3,
      weight: 3,
      opacity: 0,
    });
    snapIndicatorRef.current = snapIndicator;
    snapIndicator.addTo(map);

    const drawControl = new L.Control.Draw({
      draw: {
        polyline: {
          shapeOptions: {
            color: 'hsl(var(--m3-primary))',
            weight: 4,
            opacity: 0.8,
          },
          metric: true,
          showLength: true,
        },
        polygon: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });

    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    const SNAP_DISTANCE = 25;
    
    const findNearestNode = (latlng: L.LatLng): GraphNode | null => {
      let nearestNode: GraphNode | null = null;
      let minDistance = Infinity;

      graphRef.current.getNodes().forEach((node) => {
        const point1 = map.latLngToContainerPoint(latlng);
        const point2 = map.latLngToContainerPoint(node.latlng);
        const distance = point1.distanceTo(point2);

        if (distance < SNAP_DISTANCE && distance < minDistance) {
          minDistance = distance;
          nearestNode = node;
        }
      });

      return nearestNode;
    };

    const findNearestLinePoint = (latlng: L.LatLng): { latlng: L.LatLng; layer: L.Polyline; index: number } | null => {
      let nearestPoint: { latlng: L.LatLng; layer: L.Polyline; index: number } | null = null;
      let minDistance = Infinity;

      drawnItemsRef.current?.eachLayer((layer) => {
        if (layer instanceof L.Polyline) {
          const latlngs = layer.getLatLngs() as L.LatLng[];
          
          for (let i = 0; i < latlngs.length - 1; i++) {
            const p1 = map.latLngToContainerPoint(latlngs[i]);
            const p2 = map.latLngToContainerPoint(latlngs[i + 1]);
            const point = map.latLngToContainerPoint(latlng);

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const lengthSquared = dx * dx + dy * dy;

            if (lengthSquared === 0) continue;

            const t = Math.max(0, Math.min(1, ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / lengthSquared));
            const closestX = p1.x + t * dx;
            const closestY = p1.y + t * dy;
            const distance = Math.sqrt((point.x - closestX) ** 2 + (point.y - closestY) ** 2);

            if (distance < SNAP_DISTANCE && distance < minDistance) {
              minDistance = distance;
              const closestLatLng = map.containerPointToLatLng(L.point(closestX, closestY));
              nearestPoint = { latlng: closestLatLng, layer, index: i };
            }
          }
        }
      });

      return nearestPoint;
    };

    const showSnapIndicator = (latlng: L.LatLng, type: 'node' | 'line') => {
      if (snapIndicatorRef.current) {
        snapIndicatorRef.current.setLatLng(latlng);
        snapIndicatorRef.current.setStyle({ 
          opacity: 1,
          color: type === 'node' ? 'hsl(var(--m3-tertiary))' : 'hsl(var(--m3-primary))',
          fillColor: type === 'node' ? 'hsl(var(--m3-tertiary))' : 'hsl(var(--m3-primary))',
        });
      }
    };

    const hideSnapIndicator = () => {
      if (snapIndicatorRef.current) {
        snapIndicatorRef.current.setStyle({ opacity: 0 });
      }
    };

    const updateNodeMarker = (node: GraphNode) => {
      let marker = nodeMarkersRef.current.get(node.id);
      
      if (!marker) {
        marker = L.marker(node.latlng, { icon: createNodeIcon(node.tags) }).addTo(nodeLayer);
        marker.on('click', () => {
          console.log('Node clicked:', node);
          setSelectedNode?.(node);
        });
        nodeMarkersRef.current.set(node.id, marker);
      } else {
        marker.setLatLng(node.latlng);
        marker.setIcon(createNodeIcon(node.tags));
      }
    };

    const removeNodeMarker = (nodeId: string) => {
      const marker = nodeMarkersRef.current.get(nodeId);
      if (marker) {
        nodeLayer.removeLayer(marker);
        nodeMarkersRef.current.delete(nodeId);
      }
    };

    const updateNodeTags = (nodeId: string, tags: string[]) => {
      graphRef.current.updateNodeTags(nodeId, tags);
      const node = graphRef.current.getNode(nodeId);
      if (node) {
        updateNodeMarker(node);
        console.log('Node tags updated:', nodeId, tags);
      }
    };

    const onCreated = (event: any) => {
      const layer = event.layer;
      const polylineId = `polyline-${Date.now()}`;
      (layer as any)._polylineId = polylineId;
      drawnItems.addLayer(layer);

      if (layer instanceof L.Polyline) {
        const latlngs = layer.getLatLngs() as L.LatLng[];
        console.log('🎨 Route drawn:', latlngs.length, 'points');
        
        const { nodes } = graphRef.current.addPolyline(latlngs, polylineId);
        nodes.forEach(node => updateNodeMarker(node));
        graphRef.current.printStats();
      }
    };

    const onEdited = (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        if (layer instanceof L.Polyline) {
          let latlngs = layer.getLatLngs() as L.LatLng[];
          const polylineId = (layer as any)._polylineId;
          console.log('✏️ Route edited:', polylineId, latlngs.length, 'vertices');
          
          if (polylineId) {
            console.log('=== Starting snap check ===');
            
            graphRef.current.removePolyline(polylineId);
            console.log('Temporarily removed polyline from graph');
            console.log('Remaining nodes for snapping:', graphRef.current.getNodes().size);
            
            const snappedLatLngs = latlngs.map((latlng, index) => {
              const nearestNode = findNearestNode(latlng);
              if (nearestNode) {
                console.log(`✅ Vertex ${index} SNAPPED to node ${nearestNode.id}`);
                showSnapIndicator(nearestNode.latlng, 'node');
                return nearestNode.latlng;
              }
              
              const nearestLine = findNearestLinePoint(latlng);
              if (nearestLine && nearestLine.layer !== layer) {
                console.log(`✅ Vertex ${index} SNAPPED to line - inserting vertex`);
                showSnapIndicator(nearestLine.latlng, 'line');
                
                const existingLatLngs = nearestLine.layer.getLatLngs() as L.LatLng[];
                const existingPolylineId = (nearestLine.layer as any)._polylineId;
                
                existingLatLngs.splice(nearestLine.index + 1, 0, nearestLine.latlng);
                nearestLine.layer.setLatLngs(existingLatLngs);
                
                if (existingPolylineId) {
                  console.log('Updating graph for modified line:', existingPolylineId);
                  graphRef.current.removePolyline(existingPolylineId);
                  const { nodes: updatedNodes } = graphRef.current.addPolyline(existingLatLngs, existingPolylineId);
                  updatedNodes.forEach(node => updateNodeMarker(node));
                }
                
                return nearestLine.latlng;
              }
              
              console.log(`⚪ Vertex ${index} - no snap target found`);
              return latlng;
            });
            
            console.log('=== Snap check complete ===');
            
            layer.setLatLngs(snappedLatLngs);
            
            const currentNodeIds = new Set(Array.from(graphRef.current.getNodes().keys()));
            nodeMarkersRef.current.forEach((marker, nodeId) => {
              if (!currentNodeIds.has(nodeId)) {
                removeNodeMarker(nodeId);
              }
            });
            
            const { nodes } = graphRef.current.addPolyline(snappedLatLngs, polylineId);
            nodes.forEach(node => updateNodeMarker(node));
            graphRef.current.printStats();
          }
        }
      });
    };

    const onDeleted = (event: any) => {
      const layers = event.layers;
      layers.eachLayer((layer: any) => {
        const polylineId = (layer as any)._polylineId;
        
        if (polylineId) {
          console.log('🗑️ Route deleted:', polylineId);
          graphRef.current.removePolyline(polylineId);
          
          const currentNodeIds = new Set(Array.from(graphRef.current.getNodes().keys()));
          nodeMarkersRef.current.forEach((marker, nodeId) => {
            if (!currentNodeIds.has(nodeId)) {
              removeNodeMarker(nodeId);
            }
          });
          
          graphRef.current.printStats();
        }
      });
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    map.on(L.Draw.Event.EDITSTART, () => {
      console.log('Edit mode started');
      hideSnapIndicator();
    });

    map.on(L.Draw.Event.EDITSTOP, () => {
      console.log('Edit mode stopped');
      hideSnapIndicator();
    });

    map.on('draw:editvertex', (e: any) => {
      const poly = e.poly;
      if (poly && poly instanceof L.Polyline) {
        const latlngs = poly.getLatLngs() as L.LatLng[];
        
        latlngs.forEach((latlng) => {
          const nearestNode = findNearestNode(latlng);
          if (nearestNode) {
            showSnapIndicator(nearestNode.latlng, 'node');
            return;
          }
          
          const nearestLine = findNearestLinePoint(latlng);
          if (nearestLine) {
            showSnapIndicator(nearestLine.latlng, 'line');
            return;
          }
        });
      }
    });

    (window as any).updateRouteNodeTags = updateNodeTags;
    (window as any).routeGraph = graphRef.current;

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
      }
      if (nodeLayerRef.current) {
        map.removeLayer(nodeLayerRef.current);
      }
      if (snapIndicatorRef.current) {
        map.removeLayer(snapIndicatorRef.current);
      }
      map.off(L.Draw.Event.CREATED, onCreated);
      map.off(L.Draw.Event.EDITED, onEdited);
      map.off(L.Draw.Event.DELETED, onDeleted);
      map.off(L.Draw.Event.EDITSTART);
      map.off(L.Draw.Event.EDITSTOP);
      map.off('draw:editvertex');
      delete (window as any).updateRouteNodeTags;
      delete (window as any).routeGraph;
    };
  }, [isDrawing, map, setSelectedNode]);

  return null;
}
